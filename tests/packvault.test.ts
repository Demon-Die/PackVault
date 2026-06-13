import { describe, it, expect } from "vitest";
import { parseLockfile } from "../src/utils/lockfile.js";
import { verifyTarball } from "../src/utils/integrity.js";
import { enforcePolicy } from "../src/utils/policy.js";
import { runMigrations } from "../src/db/migrations.js";
import initSqlJs from "sql.js";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "fixtures");

describe("lockfile parsers", () => {
  it("parses npm package-lock.json", async () => {
    const entries = await parseLockfile(path.join(fixtures, "package-lock.json"));
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.name === "lodash")).toBe(true);
  });

  it("parses yarn.lock", async () => {
    const entries = await parseLockfile(path.join(fixtures, "yarn.lock"));
    expect(entries.some((e) => e.name === "chalk" && e.version === "5.3.0")).toBe(true);
  });

  it("parses pnpm-lock.yaml", async () => {
    const entries = await parseLockfile(path.join(fixtures, "pnpm-lock.yaml"));
    expect(entries.some((e) => e.name === "semver")).toBe(true);
  });
});

describe("integrity verification", () => {
  it("verifies a known good sha1 shasum", async () => {
    const content = "test tarball content";
    const shasum = crypto.createHash("sha1").update(content).digest("hex");
    const tmp = path.join(fixtures, ".test.tgz");
    await fs.writeFile(tmp, content);
    expect(await verifyTarball(tmp, undefined, shasum)).toBe(true);
    await fs.remove(tmp);
  });

  it("rejects a bad shasum", async () => {
    const tmp = path.join(fixtures, ".test-bad.tgz");
    await fs.writeFile(tmp, "corrupt");
    expect(await verifyTarball(tmp, undefined, "deadbeef")).toBe(false);
    await fs.remove(tmp);
  });
});

describe("policy enforcement", () => {
  it("blocks blocked packages", () => {
    expect(() => enforcePolicy("lodash", { policy: { block: ["lodash"] } }, "sync")).toThrow();
  });

  it("rejects packages not on allowlist", () => {
    expect(() => enforcePolicy("axios", { policy: { allow: ["react"] } }, "sync")).toThrow();
  });

  it("allows packages on allowlist", () => {
    expect(() => enforcePolicy("react", { policy: { allow: ["react"] } }, "sync")).not.toThrow();
  });
});

describe("migrations", () => {
  it("runs all migrations in sequence", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(`CREATE TABLE packages (name TEXT, version TEXT, size INTEGER, cache_path TEXT, created_at TEXT, PRIMARY KEY (name, version))`);
    runMigrations(db);

    const cols = db.exec("PRAGMA table_info(packages)")[0]?.values.map((r) => r[1]);
    expect(cols).toContain("shasum");
    expect(cols).toContain("accessed_at");

    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values.flat();
    expect(tables).toContain("logs");
    expect(tables).toContain("advisories");
  });
});
