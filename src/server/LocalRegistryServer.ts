import express from "express";
import fs from "fs-extra";
import semver from "semver";
import { PackVaultDatabase } from "../db/database.js";
import { getLanAddresses } from "../utils/network.js";
import type { CachedPackage } from "../types/index.js";

export class LocalRegistryServer {
  constructor(private readonly database: PackVaultDatabase) {}

  async start(port = 4873): Promise<void> {
    const app = express();

    app.get("/-/packvault/health", (_request, response) => {
      response.json({
        ok: true,
        packages: this.database.listPackages().length,
        addresses: getLanAddresses()
      });
    });

    app.get("/-/packvault/packages", (_request, response) => {
      response.json(this.database.listPackages());
    });

    app.get("/-/packvault/tarball", async (request, response, next) => {
      try {
        const name = String(request.query.name ?? "");
        const version = String(request.query.version ?? "");
        const cached = this.database.findPackage(name, version);

        if (!cached || !(await fs.pathExists(cached.cachePath))) {
          response.status(404).json({ error: "Package tarball not found in this vault." });
          return;
        }

        response.download(cached.cachePath);
      } catch (error) {
        next(error);
      }
    });

    app.get(/^\/(@[^/]+)\/([^/]+)$/, (request, response) => {
      this.sendPackageMetadata(`${request.params[0]}/${request.params[1]}`, request, response);
    });

    app.get("/:name", (request, response) => {
      this.sendPackageMetadata(request.params.name, request, response);
    });

    app.listen(port, "0.0.0.0", () => {
      const addresses = getLanAddresses();
      console.log(`PackVault registry listening on http://127.0.0.1:${port}`);
      for (const address of addresses) {
        console.log(`LAN: http://${address}:${port}`);
      }
    });
  }

  private sendPackageMetadata(
    name: string,
    request: express.Request,
    response: express.Response
  ): void {
    const packages = this.database
      .listPackages()
      .filter((pkg) => pkg.name === name)
      .sort((a, b) => semver.compare(a.version, b.version));

    if (packages.length === 0) {
      response.status(404).json({ error: `${name} is not cached.` });
      return;
    }

    const versions = Object.fromEntries(
      packages.map((pkg) => [
        pkg.version,
        this.toNpmVersionMetadata(pkg, request)
      ])
    );

    response.json({
      name,
      "dist-tags": {
        latest: packages.at(-1)?.version
      },
      versions
    });
  }

  private toNpmVersionMetadata(pkg: CachedPackage, request: express.Request): Record<string, unknown> {
    return {
      name: pkg.name,
      version: pkg.version,
      dependencies: pkg.dependencies,
      dist: {
        tarball: `${request.protocol}://${request.get("host")}/-/packvault/tarball?name=${encodeURIComponent(pkg.name)}&version=${encodeURIComponent(pkg.version)}`,
        integrity: pkg.integrity
      }
    };
  }
}
