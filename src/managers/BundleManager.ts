import chalk from "chalk";
import { builtInBundleNames } from "../config/bundles.js";
import { PackVaultDatabase } from "../db/database.js";
import { formatBytes } from "../utils/format.js";
import type { BundleDefinition } from "../types/index.js";

export class BundleManager {
  constructor(private readonly database: PackVaultDatabase) {}

  async seedBuiltIns(): Promise<void> {
    const { builtInBundles } = await import("../config/bundles.js");
    for (const bundle of builtInBundles) {
      await this.database.upsertBundle(bundle);
    }
  }

  list(): BundleDefinition[] {
    return this.database.listBundles().map((b) => ({
      ...b,
      builtIn: builtInBundleNames.has(b.name)
    }));
  }

  async save(name: string, packages: string[]): Promise<void> {
    if (builtInBundleNames.has(name)) {
      throw new Error(`Cannot overwrite built-in bundle "${name}".`);
    }
    await this.database.upsertBundle({ name, packages });
    await this.database.addLog("bundle", `saved ${name}: ${packages.join(", ")}`, "cli");
  }

  async remove(name: string): Promise<void> {
    if (builtInBundleNames.has(name)) {
      throw new Error(`Cannot delete built-in bundle "${name}".`);
    }
    await this.database.deleteBundle(name);
    await this.database.addLog("bundle", `deleted ${name}`, "cli");
  }

  printList(database: PackVaultDatabase): void {
    const packages = database.listPackages();
    for (const bundle of this.list()) {
      const count = bundle.packages.length;
      const bytes = packages
        .filter((p) => bundle.packages.includes(p.name))
        .reduce((sum, p) => sum + p.size, 0);
      const tag = bundle.builtIn ? chalk.dim("(built-in)") : chalk.cyan("(custom)");
      console.log(`${chalk.bold(bundle.name)} ${tag} — ${count} packages, ${formatBytes(bytes)}`);
    }
  }
}
