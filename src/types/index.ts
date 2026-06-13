export interface CachedPackage {
  name: string;
  version: string;
  size: number;
  cachePath: string;
  createdAt: string;
  dependencies: Record<string, string>;
  distTarball?: string;
  integrity?: string;
  shasum?: string;
  accessedAt?: string;
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
  shasum?: string;
  accessed_at?: string;
}

export interface BundleRecord {
  name: string;
  packages: string;
}

export interface BundleDefinition {
  name: string;
  packages: string[];
  builtIn?: boolean;
}

export interface PeerRecord {
  ip: string;
  hostname: string;
  lastSeen: string;
}

export interface LogEntry {
  id: number;
  action: string;
  detail?: string;
  source?: string;
  createdAt: string;
}

export interface AdvisoryRecord {
  packageName: string;
  versionRange: string;
  severity: string;
  title: string;
  url?: string;
  createdAt: string;
}

export interface LockfileEntry {
  name: string;
  version: string;
}

export interface VaultConfig {
  schedule?: { enabled: boolean; every: string; nextRun?: string };
  registries?: Record<string, { url: string; token?: string }>;
  scopedRegistries?: Record<string, string>;
  trustedPeerTokens?: Record<string, string>;
  policy?: { allow?: string[]; block?: string[] };
}

export interface ProjectConfig {
  bundle?: string;
  packages?: string[];
  registry?: string;
  concurrency?: number;
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
  skipped?: boolean;
}

export interface SyncSummary {
  results: SyncResult[];
  synced: number;
  skipped: number;
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
  bundleBreakdown?: Record<string, { cached: number; total: number; bytes: number }>;
  oldest?: CachedPackage;
  newest?: CachedPackage;
  orphanedFiles?: string[];
  orphanedRows?: CachedPackage[];
}

export interface ProjectDoctorEntry {
  spec: string;
  name: string;
  range: string;
  cached: boolean;
  resolvedVersion?: string;
}

export interface VaultPaths {
  root: string;
  cache: string;
  templates: string;
  bundles: string;
  database: string;
  exports: string;
}

export interface SyncOptions {
  dependencies?: boolean;
  concurrency?: number;
  registry?: string;
  token?: string;
  onProgress?: (info: ProgressInfo) => void;
}

export interface ProgressInfo {
  name: string;
  version: string;
  percent: number;
  transferred: number;
  total: number;
  overallPercent: number;
  overallEta?: number;
}
