import crypto from "node:crypto";
import fs from "fs-extra";

export function parseIntegrity(integrity?: string): { algorithm: string; digest: string } | undefined {
  if (!integrity) return undefined;
  const [algorithm, digest] = integrity.split("-");
  if (!algorithm || !digest) return undefined;
  return { algorithm, digest };
}

export async function verifyTarball(
  filePath: string,
  integrity?: string,
  shasum?: string
): Promise<boolean> {
  const buffer = await fs.readFile(filePath);

  if (integrity) {
    const parsed = parseIntegrity(integrity);
    if (parsed) {
      const hash = crypto.createHash(parsed.algorithm).update(buffer).digest("base64");
      return hash === parsed.digest;
    }
  }

  if (shasum) {
    const hash = crypto.createHash("sha1").update(buffer).digest("hex");
    return hash === shasum;
  }

  return true;
}

export function extractShasum(integrity?: string, shasum?: string): string | undefined {
  if (shasum) return shasum;
  if (integrity?.startsWith("sha1-")) {
    return Buffer.from(integrity.slice(5), "base64").toString("hex");
  }
  return integrity ?? shasum;
}
