import axios, { type AxiosInstance } from "axios";
import type { NpmPackageMetadata, NpmVersionMetadata } from "../types/index.js";

export class RegistryManager {
  private readonly client: AxiosInstance;

  constructor(registryUrl = "https://registry.npmjs.org") {
    this.client = axios.create({
      baseURL: registryUrl,
      timeout: 30_000,
      headers: {
        "User-Agent": "packvault/0.1.0"
      }
    });
  }

  async getPackageMetadata(name: string): Promise<NpmPackageMetadata> {
    const response = await this.client.get<NpmPackageMetadata>(`/${encodeURIComponent(name)}`);
    return response.data;
  }

  async resolveVersion(name: string, requestedVersion = "latest"): Promise<NpmVersionMetadata> {
    const metadata = await this.getPackageMetadata(name);
    const version =
      requestedVersion === "latest"
        ? metadata["dist-tags"].latest
        : requestedVersion;

    const versionMetadata = metadata.versions[version];

    if (!versionMetadata) {
      throw new Error(`Version ${requestedVersion} for ${name} was not found in the npm registry.`);
    }

    return versionMetadata;
  }

  async downloadTarball(tarballUrl: string): Promise<NodeJS.ReadableStream> {
    const response = await axios.get<NodeJS.ReadableStream>(tarballUrl, {
      responseType: "stream",
      timeout: 120_000
    });

    return response.data;
  }
}
