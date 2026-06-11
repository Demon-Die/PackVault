import path from "node:path";
import fs from "fs-extra";
import ProgressBar from "progress";
import * as tar from "tar";
import semver from "semver";
import type { CachedPackage, InstallResult, SyncResult } from "../types/index.js";
import { PackVaultDatabase } from "../db/database.js";
import { CacheManager } from "./CacheManager.js";
import { RegistryManager } from "./RegistryManager.js";

export class PackageManager {
  constructor(
    private readonly database: PackVaultDatabase,
    private readonly registry: RegistryManager,
    private readonly cache: CacheManager
  ) {}

  async sync(packages: string[], options: { dependencies?: boolean } = {}): Promise<SyncResult[]> {
    const progress = new ProgressBar("syncing [:bar] :current/:total :token", {
      total: packages.length,
      width: 28
    });

    const results: SyncResult[] = [];
    const queue = packages.map((packageSpec) => this.parsePackageSpec(packageSpec));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { name, version } = queue.shift()!;
      const visitKey = `${name}@${version}`;
      if (visited.has(visitKey)) {
        progress.tick({ token: name });
        continue;
      }

      visited.add(visitKey);
      progress.tick(0, { token: name });

      const metadata = await this.registry.resolveVersion(name, version);
      const exactKey = `${metadata.name}@${metadata.version}`;
      if (visited.has(exactKey) && exactKey !== visitKey) {
        progress.tick({ token: name });
        continue;
      }

      visited.add(exactKey);
      const stream = await this.registry.downloadTarball(metadata.dist.tarball);
      const cached = await this.cache.writeTarball(metadata, stream);
      const dependencies = options.dependencies === false ? [] : Object.entries(cached.dependencies);

      progress.total += dependencies.length;
      for (const [dependencyName, dependencyRange] of dependencies) {
        queue.push({ name: dependencyName, version: dependencyRange });
      }

      await this.database.upsertPackage(cached);
      results.push({
        name: cached.name,
        version: cached.version,
        cachePath: cached.cachePath,
        size: cached.size,
        dependencyCount: dependencies.length
      });

      progress.tick({ token: name });
    }

    return results;
  }

  async install(name: string, targetProject = process.cwd(), version?: string): Promise<InstallResult> {
    const cached = this.database.findPackage(name, version);

    if (!cached) {
      throw new Error(`${name}${version ? `@${version}` : ""} is not cached. Run packvault sync first while online.`);
    }

    if (!(await this.cache.hasTarball(cached))) {
      throw new Error(`Cached metadata exists for ${name}, but the tarball is missing at ${cached.cachePath}.`);
    }

    const installed = await this.installPackageTree(cached, targetProject, new Set());

    return {
      installed,
      rootPath: path.join(targetProject, "node_modules", name)
    };
  }

  async syncBundle(bundleName: string): Promise<SyncResult[]> {
    const bundle = this.database.listBundles().find((candidate) => candidate.name === bundleName);

    if (!bundle) {
      throw new Error(`Unknown bundle "${bundleName}".`);
    }

    return this.sync(bundle.packages);
  }

  private parsePackageSpec(spec: string): { name: string; version: string } {
    if (spec.startsWith("@")) {
      const index = spec.lastIndexOf("@");
      if (index > 0) {
        return { name: spec.slice(0, index), version: spec.slice(index + 1) };
      }
      return { name: spec, version: "latest" };
    }

    const [name, version = "latest"] = spec.split("@");
    return { name, version };
  }

  private async installPackageTree(
    cached: CachedPackage,
    targetProject: string,
    installed: Set<string>
  ): Promise<string[]> {
    const installKey = `${cached.name}@${cached.version}`;
    if (installed.has(installKey)) {
      return [];
    }

    installed.add(installKey);
    await this.extractCachedPackage(cached, targetProject);

    const installedNames = [installKey];

    for (const [dependencyName, dependencyRange] of Object.entries(cached.dependencies)) {
      const dependency = this.findCachedDependency(dependencyName, dependencyRange);

      if (!dependency) {
        throw new Error(
          `${cached.name}@${cached.version} depends on ${dependencyName}@${dependencyRange}, but it is not cached. Run packvault sync ${cached.name} while online.`
        );
      }

      installedNames.push(...await this.installPackageTree(dependency, targetProject, installed));
    }

    return installedNames;
  }

  private async extractCachedPackage(cached: CachedPackage, targetProject: string): Promise<void> {
    if (!(await this.cache.hasTarball(cached))) {
      throw new Error(`Cached metadata exists for ${cached.name}, but the tarball is missing at ${cached.cachePath}.`);
    }

    const packageRoot = path.join(targetProject, "node_modules", cached.name);
    await fs.remove(packageRoot);
    await fs.ensureDir(packageRoot);

    await tar.x({
      file: cached.cachePath,
      cwd: packageRoot,
      strip: 1
    });
  }

  private findCachedDependency(name: string, range: string): CachedPackage | undefined {
    const candidates = this.database.listPackages().filter((pkg) => pkg.name === name);
    const exact = candidates.find((pkg) => pkg.version === range);
    if (exact) {
      return exact;
    }

    const satisfyingVersion = semver.maxSatisfying(
      candidates.map((pkg) => pkg.version).filter((version) => semver.valid(version)),
      range
    );

    return satisfyingVersion
      ? candidates.find((pkg) => pkg.version === satisfyingVersion)
      : candidates.at(-1);
  }
}
