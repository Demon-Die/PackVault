export const schema = `
CREATE TABLE IF NOT EXISTS packages (
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  size INTEGER NOT NULL,
  cache_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (name, version)
);

CREATE TABLE IF NOT EXISTS bundles (
  name TEXT PRIMARY KEY,
  packages TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS peers (
  ip TEXT PRIMARY KEY,
  hostname TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at);
`;
