# PackVault Development Roadmap

## Phase 1: Core Offline JavaScript Workflow

- Sync npm package metadata and tarballs
- Store package records in SQLite
- Install cached tarballs into `node_modules`
- Seed and create offline project templates
- Provide bundle sync for common stacks
- Serve cached packages over LAN

## Phase 2: Registry Compatibility

- Add scoped package metadata routes such as `/@scope/name`
- Add npm-compatible tarball URLs for direct npm client use
- Add package integrity verification from registry metadata
- Cache dependency graphs, not only requested package roots
- Add lockfile-aware offline install mode

## Phase 3: Peer Discovery and Trust

- Add mDNS discovery for PackVault nodes
- Add UDP broadcast fallback
- Add signed package manifests
- Add peer allowlists and import policies
- Add resumable tarball transfers

## Phase 4: Multi-Ecosystem Support

- Python package cache adapter
- Rust crate cache adapter
- Go module cache adapter
- Ecosystem-specific metadata tables
- Unified `packvault sync --ecosystem` CLI option

## Phase 5: Local Intelligence

- Local package recommendations based on cached metadata
- Offline documentation indexing
- Vulnerability advisory snapshots
- Project template suggestions
- Bundle optimization and deduplication
