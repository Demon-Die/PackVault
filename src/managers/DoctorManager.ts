import { vaultPaths } from "../config/paths.js";
import { builtInBundles } from "../config/bundles.js";
import { PackVaultDatabase } from "../db/database.js";
import { CacheManager } from "./CacheManager.js";
import type { DoctorReport } from "../types/index.js";

export class DoctorManager {
  constructor(
    private readonly database: PackVaultDatabase,
    private readonly cache: CacheManager
  ) {}

  async inspect(): Promise<DoctorReport> {
    const packages = this.database.listPackages();
    const cachedNames = new Set(packages.map((pkg) => pkg.name));
    const requiredNames = new Set(builtInBundles.flatMap((bundle) => bundle.packages));
    const missingFromBundles = [...requiredNames].filter((pkg) => !cachedNames.has(pkg));
    const storageBytes = await this.cache.storageUsage(vaultPaths.cache);
    const healthScore = requiredNames.size === 0
      ? 100
      : Math.round(((requiredNames.size - missingFromBundles.length) / requiredNames.size) * 100);

    return {
      packages,
      storageBytes,
      missingFromBundles,
      healthScore
    };
  }
}
