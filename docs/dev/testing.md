# Testing

Owner: @ayamkv
Last updated: 2026-06-05
Audience: developers and coding agents
Status: active

Use PowerShell 7 for local commands on Windows.

## Automated checks

Run these before opening a PR or ending a code-changing session:

```powershell
pnpm test
pnpm test:coverage
pnpm build
pnpm lint
```

`pnpm test:coverage` is a signal, not a release gate. Use it to find risky untested server modules and route handlers. Do not treat the total percentage as a product-health number while component and browser coverage are not included.

## Manual smoke checks

Start the app:

```powershell
pnpm dev
```

For data-backed routes, start local PocketBase first:

```powershell
cd pocketbase
.\start-dev.bat
```

Then verify these flows in a browser:

- `/` loads without console error noise and can create a short link.
- A created `/<slug>` redirects to the expected Spotify URL.
- `/<slug>/s` loads stats for an existing slug and shows a useful error for a missing slug.
- `/@/login` and `/@/register` load for logged-out users and redirect away for logged-in users.
- `/@/dash/links` loads for a logged-in user, creates a link, deletes one owned link, and handles refresh/load-more without duplicate rows.
- `/@/admin` rejects non-admin users and loads metrics for an admin user.

## Known gaps

- The Vitest suite mostly mocks PocketBase and `fetch`, so it does not prove live PocketBase schema compatibility.
- There are no automated browser or E2E tests yet.
- Coverage includes broad `src` files, so route/server files are more useful to inspect than the overall percentage.
