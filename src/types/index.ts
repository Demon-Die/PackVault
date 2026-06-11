export interface CachedPackage {
  name: string;
  version: string;
  size: number;
  cachePath: string;
  createdAt: string;
  dependencies: Record<string, string>;
  distTarball?: string;
  integrity?: string;
}

export interface PackageRecord {
  name: string;
  version: string;
  size: number;
  cache_path: string;
  created_at: string;
  dependencies?: string;
  dist_tarball?: string;
  integrity?: string;
}

export interface BundleDefinition {
  name: string;
  packages: string[];
}

export interface PeerRecord {
  ip: string;
  hostname: string;
  lastSeen: string;
}

export interface NpmDist {
  tarball: string;
  shasum?: string;
  integrity?: string;
  unpackedSize?: number;
}

export interface NpmVersionMetadata {
  name: string;
  version: string;
  dist: NpmDist;
  dependencies?: Record<string, string>;
}

export interface NpmPackageMetadata {
  name: string;
  "dist-tags": Record<string, string>;
  versions: Record<string, NpmVersionMetadata>;
  time?: Record<string, string>;
}

export interface SyncResult {
  name: string;
  version: string;
  cachePath: string;
  size: number;
  dependencyCount: number;
}

export interface InstallResult {
  installed: string[];
  rootPath: string;
}

export interface DoctorReport {
  packages: CachedPackage[];
  storageBytes: number;
  missingFromBundles: string[];
  healthScore: number;
}

export interface VaultPaths {
  root: string;
  cache: string;
  templates: string;
  bundles: string;
  database: string;
  exports: string;
}
