import path from "node:path";
import fs from "fs-extra";
import ProgressBar from "progress";
import * as tar from "tar";
import { vaultPaths } from "../config/paths.js";
import type { SyncResult } from "../types/index.js";
import { PackVaultDatabase } from "../db/database.js";
import { CacheManager } from "./CacheManager.js";
import { RegistryManager } from "./RegistryManager.js";

export class PackageManager {
  constructor(
    private readonly database: PackVaultDatabase,
    private readonly registry: RegistryManager,
    private readonly cache: CacheManager
  ) {}

  async sync(packages: string[]): Promise<SyncResult[]> {
    const progress = new ProgressBar("syncing [:bar] :current/:total :token", {
      total: packages.length,
      width: 28
    });

    const results: SyncResult[] = [];

    for (const packageSpec of packages) {
      const { name, version } = this.parsePackageSpec(packageSpec);
      progress.tick(0, { token: name });

      const metadata = await this.registry.resolveVersion(name, version);
      const stream = await this.registry.downloadTarball(metadata.dist.tarball);
      const cached = await this.cache.writeTarball(metadata, stream);

      await this.database.upsertPackage(cached);
      results.push({
        name: cached.name,
        version: cached.version,
        cachePath: cached.cachePath,
        size: cached.size
      });

      progress.tick({ token: name });
    }

    return results;
  }

  async install(name: string, targetProject = process.cwd(), version?: string): Promise<string> {
    const cached = this.database.findPackage(name, version);

    if (!cached) {
      throw new Error(`${name}${version ? `@${version}` : ""} is not cached. Run packvault sync first while online.`);
    }

    if (!(await this.cache.hasTarball(cached))) {
      throw new Error(`Cached metadata exists for ${name}, but the tarball is missing at ${cached.cachePath}.`);
    }

    const packageRoot = path.join(targetProject, "node_modules", name);
    await fs.remove(packageRoot);
    await fs.ensureDir(packageRoot);

    await tar.x({
      file: cached.cachePath,
      cwd: packageRoot,
      strip: 1
    });

    return packageRoot;
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
}
