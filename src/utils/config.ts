import path from "node:path";
import fs from "fs-extra";
import { vaultPaths } from "../config/paths.js";
import type { VaultConfig } from "../types/index.js";

const configPath = path.join(vaultPaths.root, "config.json");

export async function loadVaultConfig(): Promise<VaultConfig> {
  if (!(await fs.pathExists(configPath))) {
    return {};
  }
  return fs.readJson(configPath) as VaultConfig;
}

export async function saveVaultConfig(config: VaultConfig): Promise<void> {
  await fs.ensureDir(vaultPaths.root);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export async function updateVaultConfig(
  updater: (current: VaultConfig) => VaultConfig
): Promise<VaultConfig> {
  const current = await loadVaultConfig();
  const updated = updater(current);
  await saveVaultConfig(updated);
  return updated;
}

export function getRegistryForPackage(
  name: string,
  config: VaultConfig,
  override?: { registry?: string; token?: string }
): { url: string; token?: string } {
  if (override?.registry) {
    return { url: override.registry, token: override.token };
  }

  if (name.startsWith("@") && config.scopedRegistries) {
    const scope = name.split("/")[0] + "/*";
    const scoped = config.scopedRegistries[scope];
    if (scoped) {
      const entry = config.registries?.[scoped];
      return { url: scoped, token: entry?.token };
    }
  }

  return { url: "https://registry.npmjs.org" };
}
