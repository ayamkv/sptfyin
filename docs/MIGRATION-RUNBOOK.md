# PocketBase VPS Migration Runbook

Emergency migration guide for moving PocketBase from one VPS to another with minimal downtime.

## Prerequisites

Before starting, ensure you have:

- [ ] New VPS running (DigitalOcean, Fly.io, Azure, etc.)
- [ ] SSH access to both old and new VPS
- [ ] Docker installed on new VPS
- [ ] This repo cloned on new VPS

## Current Production Setup

> Security note: direct old VPS IP is intentionally redacted in repository docs.

| Component          | Details                           |
| ------------------ | --------------------------------- |
| **Old VPS**        | IDCloudHost Jakarta (IP redacted) |
| **Server spec**    | 2 vCPU / 2 GB RAM / 20 GB disk    |
| **Reverse proxy**  | Nginx -> `127.0.0.1:8091`         |
| **Data location**  | `~/pb-docker/` (~988MB)           |
| **Docker Compose** | `~/pb-docker/docker-compose.yml`  |
| **PocketBase URL** | `https://pbbase.sptfy.in`         |
| **Frontend**       | Cloudflare Pages (auto-deploys)   |
| **Status page**    | `https://status.sptfy.in`         |

Webmin-related files may exist on the VPS, but the active production path is only `~/pb-docker` plus Nginx config.

---

## Phase 1: Pre-Migration (Do This Ahead of Time)

### 1.1 Set Up New VPS

```bash
# SSH to new VPS
ssh user@new-vps-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group to take effect

# Clone the repo
git clone https://github.com/YOUR_REPO/sptfyin.git
cd sptfyin/pocketbase
```

### 1.2 Lower DNS TTL (Optional but Recommended)

If you have time to prepare:

1. Go to Cloudflare DNS for `sptfy.in`
2. Find the A record for `pb.sptfy.in`
3. Lower TTL to **1 minute** (or minimum allowed)
4. Wait at least 24 hours for old TTL to expire

### 1.3 Test New VPS Setup (Without Data)

```bash
# On new VPS, start PocketBase to verify Docker works
cd ~/sptfyin/pocketbase
docker compose up -d

# Check it's running
curl http://localhost:8091/api/health

# Stop it for now
docker compose down
```

---

## Phase 2: Migration Window

### 2.1 Enable Maintenance Mode

**In Cloudflare Pages → Settings → Environment Variables:**

```
PUBLIC_MAINTENANCE_MODE = false
PUBLIC_MAINTENANCE_TYPE = migration
PUBLIC_MAINTENANCE_NOTE = Link creation is temporarily paused while infrastructure is migrated.
PUBLIC_MAINTENANCE_SCHEDULED = 2026-02-25T10:00:00Z
PUBLIC_MAINTENANCE_END = 2026-02-25T11:00:00Z
PUBLIC_STATUS_PAGE_URL = https://status.sptfy.in
```

Then trigger a redeploy (push an empty commit or use Cloudflare dashboard).

With `PUBLIC_MAINTENANCE_MODE=false`, maintenance auto-runs only inside the schedule window (`SCHEDULED` -> `END`).
Manual overrides:

- `PUBLIC_MAINTENANCE_MODE=true` forces maintenance ON immediately.
- `PUBLIC_MAINTENANCE_MODE=off` forces maintenance OFF immediately.

Supported `PUBLIC_MAINTENANCE_TYPE` values: `migration`, `database`, `infrastructure`, `security`, `incident`, `general`.
Supported `PUBLIC_MAINTENANCE_MODE` values: `true`, `off`, `false` (or empty).

**Verify:** Visit sptfy.in and confirm:

- Maintenance toast appears
- "Short It!" button is disabled
- Existing redirects still work
- "View server status" link opens your status page

### 2.2 Stop Old PocketBase

```bash
# SSH to old VPS
ssh freq@<OLD_VPS_HOST_REDACTED>

# Stop PocketBase
cd ~/pb-docker
docker compose down

# Verify it's stopped
docker ps
```

### 2.3 Transfer Data to New VPS

**Option A: Direct rsync (fastest)**

```bash
# From your local machine or old VPS
rsync -avz --progress freq@<OLD_VPS_HOST_REDACTED>:~/pb-docker/ user@new-vps-ip:~/pb-docker/
```

**Option B: Via your local machine**

```bash
# Download from old
rsync -avz --progress freq@<OLD_VPS_HOST_REDACTED>:~/pb-docker/ ./pb-backup/

# Upload to new
rsync -avz --progress ./pb-backup/ user@new-vps-ip:~/pb-docker/
```

**Option C: If rsync isn't available**

```bash
# On old VPS
cd ~
tar -czvf pb-backup.tar.gz pb-docker/

# Download locally
scp freq@<OLD_VPS_HOST_REDACTED>:~/pb-backup.tar.gz .

# Upload to new VPS
scp pb-backup.tar.gz user@new-vps-ip:~/

# On new VPS
tar -xzvf pb-backup.tar.gz
```

### 2.4 Start PocketBase on New VPS

```bash
# SSH to new VPS
ssh user@new-vps-ip

cd ~/pb-docker
docker compose up -d

# Verify it's running
docker ps
curl http://localhost:8091/api/health
```

### 2.5 Test via sslip.io (Instant DNS)

Before switching DNS, test the new server using sslip.io:

```
http://NEW_VPS_IP.sslip.io:8091/api/health
```

Or test a redirect:

```
http://NEW_VPS_IP.sslip.io:8091/YOUR_SHORT_SLUG
```

**For HTTPS testing** (if you need it):

- sslip.io supports Let's Encrypt certificates via HTTP-01 challenge
- You can temporarily configure your frontend to point to the sslip.io domain

### 2.6 Update DNS

**In Cloudflare DNS:**

1. Find the A record for `pb.sptfy.in`
2. Update the IP to your new VPS IP
3. Keep Proxy Status: **DNS only** (gray cloud) for now
4. Save

**Check propagation:**

```bash
# Should return new IP
dig +short pb.sptfy.in
nslookup pb.sptfy.in
```

Or use: https://www.whatsmydns.net/#A/pb.sptfy.in

### 2.7 Update GitHub Actions Secrets

If your deployment workflow uses VPS credentials:

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Update these secrets with new VPS details:
   - `VPS_HOST` (new IP)
   - `VPS_USER` (if different)
   - `VPS_SSH_KEY` (if different)

### 2.8 Verify Everything Works

```bash
# Test PocketBase API via domain
curl https://pb.sptfy.in/api/health

# Test a redirect
curl -I https://sptfy.in/YOUR_TEST_SLUG
```

---

## Phase 3: Post-Migration

### 3.1 Disable Maintenance Mode

**In Cloudflare Pages → Environment Variables:**

```
PUBLIC_MAINTENANCE_MODE = false
PUBLIC_MAINTENANCE_TYPE = (clear/delete)
PUBLIC_MAINTENANCE_NOTE = (clear/delete)
PUBLIC_MAINTENANCE_SCHEDULED = (clear/delete)
PUBLIC_MAINTENANCE_END = (clear/delete)
PUBLIC_STATUS_PAGE_URL = (optional, keep default or clear)
```

If you need to immediately bypass a scheduled window, set `PUBLIC_MAINTENANCE_MODE = off`.

Trigger redeploy.

### 3.2 Verify Full Functionality

- [ ] Create a new short link (homepage)
- [ ] Create a short link (dashboard, if logged in)
- [ ] Test a redirect
- [ ] Check recent/top pages load

### 3.3 Restore DNS TTL

In Cloudflare DNS, set TTL back to **Auto** or your preferred value.

### 3.4 Monitor for Issues

Check for errors in:

- Cloudflare Pages deployment logs
- New VPS Docker logs: `docker compose logs -f`
- BetterStack or your monitoring tool

---

## Rollback Procedure

If something goes wrong:

### Quick Rollback (< 30 min into migration)

```bash
# Stop new VPS PocketBase
ssh user@new-vps-ip
cd ~/pb-docker && docker compose down

# Restart old VPS PocketBase
ssh freq@<OLD_VPS_HOST_REDACTED>
cd ~/pb-docker && docker compose up -d

# Revert DNS to old IP
# (In Cloudflare DNS)

# Keep maintenance mode on until confirmed working
```

### If Data Was Modified on New Server

You'll need to decide:

1. **Accept data loss**: Revert to old server, lose any links created on new
2. **Forward-fix**: Debug and fix the issue on new server
3. **Merge data**: Export new data, merge with old, restore (complex)

---

## Emergency Contacts

- **Primary**: @ayamkv
- **Monitoring**: BetterStack status page

---

## Appendix: Useful Commands

### Docker Commands

```bash
# View logs
docker compose logs -f

# Restart PocketBase
docker compose restart

# Check container status
docker ps

# Enter container shell
docker compose exec pocketbase sh
```

### PocketBase Admin

- Admin UI: `https://pb.sptfy.in/_/`
- API health: `https://pb.sptfy.in/api/health`

### Cloudflare Pages

- Dashboard: https://dash.cloudflare.com
- Environment variables: Pages → sptfyin → Settings → Environment variables

### Backup Locations

- Automated backups: Cloudflare R2 (via PocketBase backup feature)
- Manual backup on old VPS: `~/pb_backup_oct.zip`
