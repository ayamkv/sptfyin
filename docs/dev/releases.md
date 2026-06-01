Owner: ayamkv
Last updated: 2026-06-01
Audience: maintainers
Status: active

# Releases

Releases use two layers:

1. `release-please` handles version bumps, GitHub releases, and `CHANGELOG.md` from conventional commits.
2. `src/lib/updates/*.md` handles the public, personal update notes shown on `/@/updates`.

## Normal workflow

1. Merge normal PRs with conventional titles like `feat: add account links` or `fix: handle login redirect`.
2. `release-please` opens or updates a release PR on `main`.
3. Before merging the release PR, edit the latest web note in `src/lib/updates/` if you want a personal intro, GIF, or extra context.
4. Merge the release PR.
5. The new version deploys and the homepage update chip appears for the release notification window.

## Web update notes

Each public update needs:

- metadata in `src/lib/updates/releases.js`
- a markdown/mdsvex note in `src/lib/updates/`
- a component import in `src/lib/updates/components.js`

Use the latest release entry's `chip` text for the short homepage notification.
