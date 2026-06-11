import path from "node:path";
import fs from "fs-extra";
import { pipeline } from "node:stream/promises";
import { packageCachePath } from "../config/paths.js";
import type { CachedPackage, NpmVersionMetadata } from "../types/index.js";

export class CacheManager {
  async writeTarball(metadata: NpmVersionMetadata, stream: NodeJS.ReadableStream): Promise<CachedPackage> {
    const cachePath = packageCachePath(metadata.name, metadata.version);
    await fs.ensureDir(path.dirname(cachePath));
    await pipeline(stream, fs.createWriteStream(cachePath));
    const stat = await fs.stat(cachePath);

    return {
      name: metadata.name,
      version: metadata.version,
      size: stat.size,
      cachePath,
      createdAt: new Date().toISOString(),
      dependencies: metadata.dependencies ?? {},
      distTarball: metadata.dist.tarball,
      integrity: metadata.dist.integrity
    };
  }

  async hasTarball(pkg: CachedPackage): Promise<boolean> {
    return fs.pathExists(pkg.cachePath);
  }

  async importTarball(pkg: CachedPackage, stream: NodeJS.ReadableStream): Promise<CachedPackage> {
    await fs.ensureDir(path.dirname(pkg.cachePath));
    await pipeline(stream, fs.createWriteStream(pkg.cachePath));
    const stat = await fs.stat(pkg.cachePath);

    return {
      ...pkg,
      size: stat.size,
      dependencies: pkg.dependencies ?? {},
      createdAt: new Date().toISOString()
    };
  }

  async storageUsage(rootPath: string): Promise<number> {
    if (!(await fs.pathExists(rootPath))) {
      return 0;
    }

    let total = 0;
    const entries = await fs.readdir(rootPath);

    for (const entry of entries) {
      const fullPath = `${rootPath}/${entry}`;
      const stat = await fs.stat(fullPath);
      total += stat.isDirectory() ? await this.storageUsage(fullPath) : stat.size;
    }

    return total;
  }
}
