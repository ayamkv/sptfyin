# sptfy.in Local Development Setup

This guide explains how to set up a complete local development environment with a local PocketBase instance.

## Architecture Overview

| Component | Production                | Local Dev                   |
| --------- | ------------------------- | --------------------------- |
| Frontend  | Cloudflare Pages          | `pnpm dev` (localhost:5173) |
| Backend   | VPS (PocketBase v0.23.12) | Local PocketBase binary     |
| Database  | Production SQLite         | Fresh local SQLite          |

## Prerequisites

- Node.js 18+
- pnpm
- PocketBase v0.23.12 binary (see setup below)

---

## Quick Start

```bash
# 1. Start PocketBase (in a separate terminal)
cd pocketbase
./pocketbase serve

# 2. First time only: Set up PocketBase admin & Spotify OAuth
#    Open http://127.0.0.1:8090/_/

# 3. Start SvelteKit dev server
pnpm dev

# 4. Open http://127.0.0.1:5173
```

---

## First-Time Setup

### 1. Download PocketBase v0.23.12

**IMPORTANT:** Use v0.23.12 to match production. Later versions may have breaking changes.

Download from: https://github.com/pocketbase/pocketbase/releases/tag/v0.23.12

| OS                    | File                                   |
| --------------------- | -------------------------------------- |
| Windows               | `pocketbase_0.23.12_windows_amd64.zip` |
| macOS (Intel)         | `pocketbase_0.23.12_darwin_amd64.zip`  |
| macOS (Apple Silicon) | `pocketbase_0.23.12_darwin_arm64.zip`  |
| Linux                 | `pocketbase_0.23.12_linux_amd64.zip`   |

Extract the `pocketbase` (or `pocketbase.exe`) binary into the `pocketbase/` folder.

### 2. Start PocketBase

```bash
cd pocketbase

# Windows: Use the batch file (sets required env vars)
start-dev.bat

# Linux/macOS:
CF_SECRET_KEY=1x0000000000000000000000000000000AA ./pocketbase serve
```

The `start-dev.bat` script sets the `CF_SECRET_KEY` environment variable (Turnstile test key) before starting PocketBase.

First run will:

- Create `pb_data/` directory
- Load hooks from `pb_hooks/`

### 3. Create Admin Account

1. Open http://127.0.0.1:8090/_/
2. Create your admin email/password
3. This is your local admin - use any credentials you want

### 4. Import Schema from Production

The `pb_migrations/` folder is empty by default. You need to import the schema from production:

1. Go to production PocketBase admin: `https://pbbase.sptfy.in/_/`
2. Go to **Settings** > **Export collections**
3. Click **Export** to download the JSON file
4. In local PocketBase admin (`http://127.0.0.1:8090/_/`):
   - Go to **Settings** > **Import collections**
   - Upload the JSON file
   - Click **Review** then **Confirm import**

This imports all collections (users, random_short, analytics, etc.) with their rules and fields.

### 5. Configure Spotify OAuth Provider

In PocketBase Admin UI:

1. Go to **Settings** > **Auth providers**
2. Enable **Spotify**
3. Enter your Spotify App credentials:
   - **Client ID:** (from Spotify Developer Dashboard)
   - **Client Secret:** (from Spotify Developer Dashboard)
4. **IMPORTANT:** Make sure your Spotify app has this redirect URI:
   ```
   http://127.0.0.1:5173/auth/spotify/callback
   ```

### 5. Environment Variables

The `.env.development` file should have:

```env
VITE_DEBUG_MODE=false

# Turnstile test keys (always pass)
VITE_CF_SECRET=1x0000000000000000000000000000000AA
VITE_CF_SITE_KEY=1x00000000000000000000AA

# Local PocketBase
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# IMPORTANT: Use 127.0.0.1, NOT localhost (Spotify requirement since April 2025)
VITE_APP_URL=http://127.0.0.1:5173
```

---

## Directory Structure

```
sptfyin/
├── pocketbase/
│   ├── pocketbase.exe      # PocketBase binary (download separately, gitignored)
│   ├── pb_data/            # Database files (created on first run, gitignored)
│   ├── pb_hooks/           # Server-side hooks (committed)
│   │   ├── main.pb.js      # Custom routes
│   │   └── random.pb.js    # Turnstile, record protection, OAuth hooks
│   ├── pb_migrations/      # Schema migrations (committed)
│   │   └── *.js
│   └── pb_public/          # Static files served by PocketBase
├── src/                    # SvelteKit app
├── .env.development        # Dev environment variables
└── ...
```

---

## PocketBase Hooks

The `pb_hooks/` folder contains server-side JavaScript hooks:

### `random.pb.js`

| Hook                                   | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| `onRecordCreateRequest` (analytics)    | Logs IP geolocation on record creation                |
| `onRecordCreateRequest` (random_short) | Validates Turnstile token before creating short links |
| `onRecordUpdateRequest`                | Protects fields from unauthorized modification        |
| `onRecordAuthRequest` (users)          | Extracts Spotify user ID on OAuth login               |

### `main.pb.js`

Custom API routes (e.g., `/hello/{name}` test endpoint).

---

## Turnstile in Development

Local dev uses Cloudflare's **test keys** that always pass verification:

| Key        | Value                                 |
| ---------- | ------------------------------------- |
| Site Key   | `1x00000000000000000000AA`            |
| Secret Key | `1x0000000000000000000000000000000AA` |

These are official Cloudflare test keys - no actual verification occurs.

---

## Common Issues

### "localhost is not allowed as redirect URI"

Spotify changed their rules in April 2025. Use `127.0.0.1` instead of `localhost`:

- In `.env.development`: `VITE_APP_URL=http://127.0.0.1:5173`
- In browser: Access via `http://127.0.0.1:5173`
- In Spotify Dashboard: Use `http://127.0.0.1:5173/auth/spotify/callback`

### "PocketBase connection refused"

Make sure PocketBase is running:

```bash
cd pocketbase && ./pocketbase serve
```

### "Migrations failed"

If migrations fail, you may need to start fresh:

```bash
cd pocketbase
rm -rf pb_data
./pocketbase serve
```

### Hooks not loading

Check PocketBase console output. Hooks are loaded from `pb_hooks/` on startup.
File must end in `.pb.js` to be recognized.

---

## Docker Alternative (Optional)

If you prefer Docker, create `docker-compose.dev.yml`:

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:0.23.12
    container_name: sptfyin-pocketbase-dev
    ports:
      - '8090:8090'
    volumes:
      - ./pocketbase/pb_data:/pb_data
      - ./pocketbase/pb_hooks:/pb_hooks
      - ./pocketbase/pb_migrations:/pb_migrations
      - ./pocketbase/pb_public:/pb_public
    environment:
      CF_SECRET_KEY: '1x0000000000000000000000000000000AA'
```

Run with:

```bash
docker compose -f docker-compose.dev.yml up -d
```

---

## Syncing with Production

### Schema Changes

When you make schema changes in production:

1. Export migrations from prod PocketBase
2. Copy new migration files to `pocketbase/pb_migrations/`
3. Restart local PocketBase to apply

### Hook Changes

Hooks in this repo should be the source of truth:

1. Edit `pocketbase/pb_hooks/*.pb.js`
2. Test locally
3. Deploy to VPS when ready

---

## Related Files

| File                           | Purpose                      |
| ------------------------------ | ---------------------------- |
| `.env.development`             | Dev environment variables    |
| `.env.development.local`       | Local overrides (gitignored) |
| `AGENTS.md`                    | AI coding agent guidelines   |
| `src/lib/dev_task/tasklist.md` | Development task tracking    |
