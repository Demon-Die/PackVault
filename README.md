# PackVault

PackVault is an offline-first package caching and distribution CLI for JavaScript developers. It downloads npm package tarballs once, stores them in a durable local vault, installs from that cache without internet access, and can expose the cache to other machines on your LAN.

## Features

- Sync npm metadata and tarballs into `~/.packvault/cache`
- Lockfile-aware sync (`--from-lockfile`) for npm, Yarn, and pnpm
- SemVer-aware install from cached packages
- SHA-512 / shasum integrity verification on sync and install
- Transparent proxy registry (`serve`) with offline fallback
- Per-project offline readiness report (`doctor --project`)
- Parallel concurrent downloads with incremental skip
- Custom user-defined bundles (save, list, delete)
- Scheduled auto-sync daemon
- Private registry and scoped registry support
- Portable vault export / import
- Shell auto-completion (bash, zsh, fish)
- Audit log, vault search, and pruning
- mDNS peer discovery and bidirectional peer sync
- Peer authentication tokens
- Web UI at `/ui` when serving
- Offline vulnerability audit
- Package allowlist / blocklist policy
- Project snapshots and per-project config
- Bundle diff and classroom/workshop mode
- Create offline starter projects from local templates
- Connect to another PackVault node and import missing tarballs
- Track package, bundle, peer, log, and advisory metadata in SQLite

## Install

After PackVault is published to npm:

```bash
npm install -g packvault
```

Install directly from this GitHub repository:

```bash
npm install -g github:Demon-Die/PackVault
```

For local development:

```bash
npm install
npm run build
npm link
```

## Quick Start

```bash
npm install -g packvault
packvault bundle frontend
packvault create react my-app --install
cd my-app
```

To prepare broad framework support before going offline:

```bash
packvault bundle frameworks
```

To share your cached packages on the same Wi-Fi/LAN:

```bash
packvault share
```

Another machine can import your cached packages:

```bash
packvault connect <your-ip>
```

## Basic Workflow

Create an offline starter app with a Vite-style wizard:

```bash
packvault create
```

Example wizard:

```text
Project name (my-packvault-app):
Select a framework
  1. React
  2. Vue
  3. Svelte
  4. Solid
  5. Preact
  6. Qwik
  7. Angular
  8. Next.js
  9. Nuxt
  10. SvelteKit
  11. Astro
  12. Remix
  13. Express API
  14. Fastify API
  15. NestJS API
  16. Node.js
Choose a number: 1
Select a variant
  1. TypeScript + Vite
  2. JavaScript + Vite
Choose a number: 1
```

You can also pass the project name first:

```bash
packvault create my-app
```

Or start directly with a framework:

```bash
packvault create react
packvault create react my-react-app
packvault create vue my-vue-app
packvault create svelte my-svelte-app
packvault create next web-app
packvault create astro docs-site
packvault create fastify api-server
```

Or skip the wizard by choosing a template directly:

```bash
packvault create react-vite my-app
packvault create react-vite-js my-js-app
packvault create vue-vite vue-app
packvault create svelte-vite svelte-app
packvault create solid-vite solid-app
packvault create preact-vite preact-app
packvault create qwik qwik-app
packvault create angular angular-app
packvault create nextjs web-app
packvault create nuxt nuxt-app
packvault create sveltekit sveltekit-app
packvault create astro astro-site
packvault create remix remix-app
packvault create express-api api-server
packvault create fastify-api fast-api
packvault create nest-api nest-api
packvault create node-ts worker
```

Cache packages once while online:

```bash
packvault sync react vite tailwindcss
packvault sync --from-lockfile
packvault sync --from-lockfile ./path/to/package-lock.json
packvault sync --concurrency 10
packvault sync my-private-pkg --registry https://npm.mycompany.com --token ghp_xxx
```

`sync` also caches runtime dependencies by default. Use `--no-dependencies` to cache only the requested package tarballs. With no arguments, `sync` reads `packages` from `packvault.config.js`.

Install later without internet:

```bash
packvault install react
packvault install --from-package-json
packvault install vite
```

Cache a full bundle while online:

```bash
packvault bundle frontend
packvault bundle frameworks
```

Then install cached packages offline:

```bash
packvault install react
packvault install vite
```

Check vault health and project offline readiness:

```bash
packvault doctor
packvault doctor --project ./my-app
packvault doctor --fix
```

Create and install cached template dependencies in one step:

```bash
packvault create react my-app --install
```

## Usage Examples

```bash
packvault sync react vite tailwindcss
packvault install react
packvault create react-app my-app
packvault doctor
packvault bundle frontend
packvault serve
packvault share
packvault connect 192.168.1.25
```

## Vault Layout

PackVault stores durable state under:

```text
~/.packvault/
  cache/
  templates/
  bundles/
  database/
  exports/
  config.json
```

## Configuration

### Per-project: `packvault.config.js`

```js
export default {
  bundle: 'frontend',
  packages: ['react', 'vite@5', 'tailwindcss', 'zustand'],
  registry: 'https://registry.npmjs.org',
  concurrency: 8,
};
```

Scaffold with `packvault init`.

### Global: `~/.packvault/config.json`

Stores schedule settings, registry tokens, scoped registry mappings, trusted peer tokens, and allow/block policy.

## Commands

### `packvault sync [packages...]`

Downloads package metadata and tarballs. Flags:

- `--from-lockfile [path]` — sync all pinned versions from a lockfile
- `--no-dependencies` — cache only requested roots
- `--concurrency <n>` — parallel downloads (default 5, max 20)
- `--registry <url>` / `--token <token>` — private registry auth

### `packvault install [package]`

Installs cached packages with SemVer range resolution. Flags:

- `--from-package-json` — install all deps from `package.json`
- `-v, --version <version>` — exact version
- `-d, --directory <path>` — target project

### `packvault bundle`

Manage and sync bundles:

```bash
packvault bundle save my-stack react vite tailwindcss
packvault bundle list
packvault bundle delete my-stack
packvault bundle frontend
packvault bundle --concurrency 8
```

Built-in bundles: `frontend`, `backend`, `fullstack`, `frameworks`.

### `packvault serve` / `packvault share`

Smart proxy registry with offline fallback. Flags: `--port`, `--token`.

```bash
packvault serve
npm config set registry http://localhost:4873
```

Web UI: `http://localhost:4873/ui`

### `packvault connect [ip]`

Import packages from a peer. Flags: `--port`, `--token`, `--bidirectional`.

With no IP, opens an interactive picker from mDNS discovery.

### `packvault discover`

Scan LAN for PackVault nodes via mDNS.

### `packvault doctor`

Vault health report with bundle breakdown, orphan detection, and `--fix`. Use `--project [path]` for per-project offline readiness.

### `packvault search [query]`

Search cached packages. Flags: `--all`, `--versions`.

### `packvault prune`

Remove unused packages. Flags: `--older-than 90d`, `--keep-latest`, `--dry-run`.

### `packvault export` / `packvault import`

```bash
packvault export -o my-vault.tar.gz
packvault export --bundle frontend -o frontend.tar.gz
packvault export --packages react,vite -o subset.tar.gz
packvault import my-vault.tar.gz
```

### `packvault log`

View audit log. Flags: `--last 50`, `--action sync`, `--clear`.

### `packvault audit`

Offline vulnerability report. Flags: `--project ./my-app`, `--fix`.

### `packvault policy`

```bash
packvault policy allow react vite
packvault policy block lodash
packvault policy list
packvault policy clear
```

### `packvault diff`

Show vault changes. Flags: `--since 7d`, `--bundle frontend`.

### `packvault schedule`

```bash
packvault schedule --every 24h
packvault schedule --status
packvault schedule --disable
```

### `packvault snapshot`

```bash
packvault snapshot --project ./my-app -o my-app.vault
packvault snapshot restore my-app.vault
```

### `packvault classroom`

```bash
packvault classroom --host
packvault classroom --join
```

### `packvault completion`

```bash
packvault completion --shell bash >> ~/.bashrc
packvault completion --shell zsh >> ~/.zshrc
```

### `packvault init`

Scaffold `packvault.config.js` in the current directory.

### `packvault create [template] [project-name]`

Creates a project from a local template and replaces `__PROJECT_NAME__` tokens.

Use `--install` to install cached dependencies from the generated template's `package.json`.

Available templates:

- `react-vite`
- `react-vite-js`
- `react-app` alias for `react-vite`
- `vue-vite`
- `vue-vite-js`
- `svelte-vite`
- `svelte-vite-js`
- `solid-vite`
- `solid-vite-js`
- `preact-vite`
- `preact-vite-js`
- `qwik`
- `angular`
- `nextjs`
- `nuxt`
- `sveltekit`
- `astro`
- `remix`
- `express-api`
- `fastify-api`
- `nest-api`
- `node-ts`

### `packvault doctor` (global)

Reports vault health, storage breakdown by bundle, oldest/newest packages, and orphan detection.

### `packvault bundle <name>` (legacy)

Syncs a predefined bundle — see `packvault bundle` subcommands above.

## Security

- **Integrity verification**: Every tarball is verified against npm `dist.integrity` or `dist.shasum` on sync. Re-verified before every install.
- **Offline audit**: Security advisories fetched at sync time and queryable offline via `packvault audit`.
- **Policy**: Allowlist/blocklist enforced at sync and install time.
- **Peer auth**: Optional `--token` on `serve`/`share`/`connect`.

## Database Schema

```sql
CREATE TABLE packages (
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  size INTEGER NOT NULL,
  cache_path TEXT NOT NULL,
  dependencies TEXT NOT NULL DEFAULT '{}',
  dist_tarball TEXT,
  integrity TEXT,
  shasum TEXT,
  accessed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (name, version)
);

CREATE TABLE bundles (name TEXT PRIMARY KEY, packages TEXT NOT NULL);
CREATE TABLE peers (ip TEXT PRIMARY KEY, hostname TEXT NOT NULL, last_seen TEXT NOT NULL);
CREATE TABLE schema_version (version INTEGER PRIMARY KEY);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  detail TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE advisories (
  package_name TEXT NOT NULL,
  version_range TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Migrations run automatically on startup (v1→v5).

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
