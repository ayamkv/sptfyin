# Documentation Hub

Use this page as the single entry point for project docs.

## Core docs

| Area             | Path                            | Purpose                                               |
| ---------------- | ------------------------------- | ----------------------------------------------------- |
| Product          | `docs/product/roadmap.md`       | Monetization, feature strategy, and rollout phases    |
| Development      | `docs/dev/local-development.md` | Local setup, PocketBase dev workflow, troubleshooting |
| Operations       | `docs/ops/migration-runbook.md` | PocketBase VPS migration and maintenance runbook      |
| Agent rules      | `AGENTS.md`                     | Coding agent behavior and workflow requirements       |
| Project overview | `README.md`                     | External-facing intro, infra summary, and entry links |

## Documentation standards

All new docs should:

1. Live under `docs/<area>/...` when they are team/process docs.
2. Use kebab-case file names.
3. Include a short metadata block at the top:

```md
Owner: <team/person>
Last updated: YYYY-MM-DD
Audience: <who should read this>
Status: draft | active | archived
```

4. Link to related docs using repo-relative paths.
5. Avoid duplicating source-of-truth content across multiple files.

Template: `docs/templates/doc-template.md`

## What stays outside docs/

- `README.md` and `AGENTS.md` stay at repo root for discoverability.
- Content markdown used directly by the app stays in `src/lib/about/*.md`.

## Legacy and archive

Historical path mappings and archived docs live in `docs/archive/README.md`.
