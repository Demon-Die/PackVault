import chalk from "chalk";
import { loadVaultConfig, updateVaultConfig } from "../utils/config.js";

export class PolicyManager {
  async allow(packages: string[]): Promise<void> {
    await updateVaultConfig((config) => {
      const allow = new Set(config.policy?.allow ?? []);
      for (const pkg of packages) allow.add(pkg);
      return { ...config, policy: { ...config.policy, allow: [...allow] } };
    });
    console.log(chalk.green(`Added ${packages.length} package(s) to allowlist.`));
  }

  async block(packages: string[]): Promise<void> {
    await updateVaultConfig((config) => {
      const block = new Set(config.policy?.block ?? []);
      for (const pkg of packages) block.add(pkg);
      return { ...config, policy: { ...config.policy, block: [...block] } };
    });
    console.log(chalk.yellow(`Blocked ${packages.length} package(s).`));
  }

  async list(): Promise<void> {
    const config = await loadVaultConfig();
    const policy = config.policy;
    if (!policy?.allow?.length && !policy?.block?.length) {
      console.log("No policy rules configured.");
      return;
    }
    if (policy.allow?.length) {
      console.log(chalk.green("Allowlist:"), policy.allow.join(", "));
    }
    if (policy.block?.length) {
      console.log(chalk.red("Blocklist:"), policy.block.join(", "));
    }
  }

  async clear(): Promise<void> {
    await updateVaultConfig((config) => ({ ...config, policy: undefined }));
    console.log(chalk.green("Policy cleared."));
  }
}
