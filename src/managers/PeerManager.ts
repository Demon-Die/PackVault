import axios from "axios";
import os from "node:os";
import { PackVaultDatabase } from "../db/database.js";
import type { CachedPackage, PeerRecord } from "../types/index.js";
import { CacheManager } from "./CacheManager.js";

export class PeerManager {
  constructor(
    private readonly database: PackVaultDatabase,
    private readonly cache: CacheManager
  ) {}

  async recordPeer(ip: string, hostname = "unknown"): Promise<PeerRecord> {
    const peer = {
      ip,
      hostname,
      lastSeen: new Date().toISOString()
    };
    await this.database.upsertPeer(peer);
    return peer;
  }

  listPeers(): PeerRecord[] {
    return this.database.listPeers();
  }

  async connect(ip: string, port = 4873): Promise<CachedPackage[]> {
    const baseUrl = `http://${ip}:${port}`;
    const response = await axios.get<CachedPackage[]>(`${baseUrl}/-/packvault/packages`, {
      timeout: 10_000
    });

    await this.recordPeer(ip, os.hostname());

    const imported: CachedPackage[] = [];

    for (const remotePackage of response.data) {
      const local = this.database.findPackage(remotePackage.name, remotePackage.version);
      if (local && await this.cache.hasTarball(local)) {
        continue;
      }

      const tarball = await axios.get<NodeJS.ReadableStream>(`${baseUrl}/-/packvault/tarball`, {
        params: {
          name: remotePackage.name,
          version: remotePackage.version
        },
        responseType: "stream",
        timeout: 120_000
      });

      const cached = await this.cache.importTarball(remotePackage, tarball.data);
      await this.database.upsertPackage(cached);
      imported.push(cached);
    }

    return imported;
  }
}
