# Contributing

Thanks for helping improve sptfyin. This repo is a SvelteKit app with a PocketBase backend, so most changes touch either the frontend in `src/`, the PocketBase files in `pocketbase/`, or docs in `docs/`.

For AI coding agents and repo operators, read `AGENTS.md` too. That file has the detailed tracker, checkpoint commit, release, and session-completion rules.

## Local Development

Prerequisites:

- Node.js 18+
- pnpm
- PocketBase v0.23.12 for full local backend testing

Install dependencies:

```bash
pnpm install
```

Start the frontend:

```bash
pnpm dev
```

For data-backed routes like `/recent`, `/top`, and `/dash/links`, start local PocketBase before testing browser behavior:

```bash
cd pocketbase
start-dev.bat
```

On Linux or macOS:

```bash
cd pocketbase
CF_SECRET_KEY=1x0000000000000000000000000000000AA ./pocketbase serve
```

See `docs/dev/local-development.md` for the full local setup, OAuth notes, migrations, and environment variables.

## Development Flow

Use focused branches for changes:

```bash
git checkout -b feat/short-description
```

Keep pull requests scoped to one feature, fix, or maintenance task when possible. Small PRs are easier to review and safer to ship.

Direct commits to `main` should only be used for critical hotfixes, docs updates, or config/dependency maintenance.

## Issue Tracking

This project uses Beads (`bd`) for issue tracking.

Useful commands:

```bash
bd ready
bd list
bd create "Issue title" -p 2 -t task
bd close <issue-id>
bd sync
```

Run `bd sync` before pushing if issue state changed, so `.beads/issues.jsonl` stays in sync with Git.

## Code Style

Core conventions:

- Use tabs for indentation.
- Use single quotes.
- Do not add trailing commas.
- Use Svelte 5 runes: `$state()`, `$derived()`, and `$props()`.
- Do not use legacy Svelte `export let` props.
- Import shadcn-svelte components from `$lib/components/ui/`.
- Use PocketBase helpers from `$lib/pocketbase.js`.
- Use Iconify icons as `<iconify-icon icon="lucide:icon-name">`.
- Keep component filenames kebab-case.

Run formatting when needed:

```bash
pnpm format
```

## Quality Gates

Before opening a PR, run:

```bash
pnpm lint
pnpm test
pnpm build
```

For narrow test work, a targeted Vitest run is fine during development:

```bash
pnpm exec vitest run <path>
```

The full gates should pass before review or merge.

## Pull Requests

Use a clear title with the same style as commit prefixes:

- `feat: add user profile page`
- `fix: resolve login redirect issue`
- `chore: update dependencies`
- `docs: update local development guide`

PR descriptions should include:

- What changed
- Why it changed
- How it was tested
- Screenshots for UI changes

Use squash merge for PRs into `main`.

## Deployment Notes

Production deploys are triggered from `main`:

- Frontend deploys through Cloudflare Pages.
- PocketBase deploys through GitHub Actions when backend deploy paths change.

Backend deploy paths include:

- `pocketbase/pb_hooks/**`
- `pocketbase/pb_migrations/**`
- `docker-compose.yml`
- `.github/workflows/deploy.yml`

Do not mix unrelated deploy-sensitive changes into a PR unless they are part of the same release.

## Security

Do not commit secrets, tokens, production credentials, database files, or local PocketBase data.

Use `.env.development` for local development values. If a new environment variable is needed, update `.env.example` and relevant docs.

For anything that could affect authentication, redirects, analytics, or database rules, include tests or a clear manual verification note in the PR.
