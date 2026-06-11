import path from "node:path";
import fs from "fs-extra";
import initSqlJs, { type Database, type QueryExecResult, type SqlJsStatic } from "sql.js";
import { ensureVaultLayout, vaultPaths } from "../config/paths.js";
import { schema } from "./schema.js";
import type { BundleDefinition, CachedPackage, PackageRecord, PeerRecord } from "../types/index.js";

export class PackVaultDatabase {
  private sql?: SqlJsStatic;
  private db?: Database;
  private databasePath = path.join(vaultPaths.database, "packvault.sqlite");

  async initialize(): Promise<void> {
    await ensureVaultLayout();
    this.sql = await initSqlJs();
    this.db = await fs.pathExists(this.databasePath)
      ? new this.sql.Database(await fs.readFile(this.databasePath))
      : new this.sql.Database();
    this.db.exec(schema);
    this.migratePackagesTable();
    await this.persist();
  }

  close(): void {
    this.db?.close();
  }

  async upsertPackage(pkg: CachedPackage): Promise<void> {
    this.connection.run(
      `INSERT INTO packages (name, version, size, cache_path, dependencies, dist_tarball, integrity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name, version) DO UPDATE SET
         size = excluded.size,
         cache_path = excluded.cache_path,
         dependencies = excluded.dependencies,
         dist_tarball = excluded.dist_tarball,
         integrity = excluded.integrity,
         created_at = excluded.created_at`,
      [
        pkg.name,
        pkg.version,
        pkg.size,
        pkg.cachePath,
        JSON.stringify(pkg.dependencies),
        pkg.distTarball ?? null,
        pkg.integrity ?? null,
        pkg.createdAt
      ]
    );
    await this.persist();
  }

  findPackage(name: string, version?: string): CachedPackage | undefined {
    const result = version
      ? this.connection.exec("SELECT * FROM packages WHERE name = ? AND version = ?", [name, version])
      : this.connection.exec("SELECT * FROM packages WHERE name = ? ORDER BY created_at DESC LIMIT 1", [name]);

    const row = this.firstRow<PackageRecord>(result);
    return row ? this.toCachedPackage(row) : undefined;
  }

  listPackages(): CachedPackage[] {
    return this.rows<PackageRecord>(this.connection.exec("SELECT * FROM packages ORDER BY name ASC, version ASC"))
      .map((row) => this.toCachedPackage(row));
  }

  async upsertBundle(bundle: BundleDefinition): Promise<void> {
    this.connection.run(
      `INSERT INTO bundles (name, packages)
       VALUES (?, ?)
       ON CONFLICT(name) DO UPDATE SET packages = excluded.packages`,
      [bundle.name, JSON.stringify(bundle.packages)]
    );
    await this.persist();
  }

  listBundles(): BundleDefinition[] {
    return this.rows<{ name: string; packages: string }>(
      this.connection.exec("SELECT name, packages FROM bundles ORDER BY name ASC")
    )
      .map((row) => {
        return { name: row.name, packages: JSON.parse(row.packages) as string[] };
      });
  }

  async upsertPeer(peer: PeerRecord): Promise<void> {
    this.connection.run(
      `INSERT INTO peers (ip, hostname, last_seen)
       VALUES (?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET
         hostname = excluded.hostname,
         last_seen = excluded.last_seen`,
      [peer.ip, peer.hostname, peer.lastSeen]
    );
    await this.persist();
  }

  listPeers(): PeerRecord[] {
    return this.rows<{ ip: string; hostname: string; last_seen: string }>(
      this.connection.exec("SELECT ip, hostname, last_seen FROM peers ORDER BY last_seen DESC")
    )
      .map((row) => {
        return { ip: row.ip, hostname: row.hostname, lastSeen: row.last_seen };
      });
  }

  private get connection(): Database {
    if (!this.db) {
      throw new Error("Database has not been initialized.");
    }

    return this.db;
  }

  private async persist(): Promise<void> {
    if (!this.db) {
      return;
    }

    await fs.writeFile(this.databasePath, Buffer.from(this.db.export()));
  }

  private migratePackagesTable(): void {
    const columns = new Set(
      this.rows<{ name: string }>(this.connection.exec("PRAGMA table_info(packages)"))
        .map((column) => column.name)
    );

    if (!columns.has("dependencies")) {
      this.connection.run("ALTER TABLE packages ADD COLUMN dependencies TEXT NOT NULL DEFAULT '{}'");
    }

    if (!columns.has("dist_tarball")) {
      this.connection.run("ALTER TABLE packages ADD COLUMN dist_tarball TEXT");
    }

    if (!columns.has("integrity")) {
      this.connection.run("ALTER TABLE packages ADD COLUMN integrity TEXT");
    }
  }

  private rows<T>(results: QueryExecResult[]): T[] {
    const [result] = results;
    if (!result) {
      return [];
    }

    return result.values.map((values) =>
      Object.fromEntries(result.columns.map((column, index) => [column, values[index]])) as T
    );
  }

  private firstRow<T>(results: QueryExecResult[]): T | undefined {
    return this.rows<T>(results)[0];
  }

  private toCachedPackage(row: PackageRecord): CachedPackage {
    return {
      name: row.name,
      version: row.version,
      size: row.size,
      cachePath: row.cache_path,
      createdAt: row.created_at,
      dependencies: row.dependencies ? JSON.parse(row.dependencies) as Record<string, string> : {},
      distTarball: row.dist_tarball,
      integrity: row.integrity
    };
  }
}
