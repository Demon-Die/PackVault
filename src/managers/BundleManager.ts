import { builtInBundles } from "../config/bundles.js";
import { PackVaultDatabase } from "../db/database.js";
import type { BundleDefinition } from "../types/index.js";

export class BundleManager {
  constructor(private readonly database: PackVaultDatabase) {}

  async seedBuiltIns(): Promise<void> {
    for (const bundle of builtInBundles) {
      await this.database.upsertBundle(bundle);
    }
  }

  list(): BundleDefinition[] {
    return this.database.listBundles();
  }
}
