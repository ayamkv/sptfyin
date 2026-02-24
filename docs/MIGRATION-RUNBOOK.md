# PocketBase VPS Migration Runbook (v2)

Battle-tested migration guide for moving PocketBase between VPS providers with minimal downtime and a clean rollback path.

## Goal

- Keep redirect service available for users
- Freeze write traffic only for a short cutover window
- Avoid silent data drift during final sync
- Preserve a fast rollback path

---

## Current Production Context

| Component              | Details                              |
| ---------------------- | ------------------------------------ |
| Backend runtime        | PocketBase in Docker (`~/pb-docker`) |
| Reverse proxy          | Nginx -> `127.0.0.1:8091`            |
| Primary backend domain | `https://pb.sptfy.in`                |
| Legacy backend domain  | `https://pbbase.sptfy.in`            |
| Frontend               | Cloudflare Pages                     |
| Status page            | `https://status.sptfy.in`            |

> Security note: keep direct VPS IPs out of committed docs.

---

## 0) Fill Variables First

Set these values in your shell/session notes before starting.

- `OLD_HOST` old VPS IP/host
- `NEW_HOST` new VPS IP/host
- `OLD_USER` old VPS user
- `NEW_USER` new VPS user
- `APP_DIR=~/pb-docker`
- `PB_DOMAIN=pb.sptfy.in`
- `PB_IMAGE_PIN=ghcr.io/muchobien/pocketbase:0.23.12` (or current production version)

---

## 1) Pre-Flight Checklist (must all pass)

- [ ] SSH to both old and new VPS works
- [ ] Docker + Compose installed on new VPS
- [ ] Repo cloned to `~/pb-docker` on new VPS
- [ ] `docker-compose.yml` image pinned (no `latest` during migration)
- [ ] New VPS has `.env` with required secrets (`CF_SECRET_KEY`)
- [ ] Nginx configured on new VPS for `pb.sptfy.in` -> `127.0.0.1:8091`
- [ ] TLS cert valid on new VPS (`certbot`)
- [ ] NSG inbound allows only `22`, `80`, `443`
- [ ] SSH deploy key for GitHub Actions tested
- [ ] Optional but recommended: 2G swap enabled on 1G RAM VM

Recommended quick checks:

```bash
docker compose version
grep 'image:' docker-compose.yml
sudo nginx -t
sudo certbot certificates
free -h
df -h
```

---

## 2) Warm Sync (No Downtime)

Run this before maintenance to reduce final cutover time.

```bash
rsync -avz --progress OLD_USER@OLD_HOST:~/pb-docker/pb_data/ ~/pb-docker/pb_data/
rsync -avz --progress OLD_USER@OLD_HOST:~/pb-docker/pb_public/ ~/pb-docker/pb_public/
```

Notes:

- Do not use `--delete` yet on warm sync.
- A first warm sync may still copy active WAL files while old DB is live; that is expected.

---

## 3) Maintenance Window Setup

Set maintenance env vars in Cloudflare Pages and redeploy.

```env
PUBLIC_MAINTENANCE_MODE=false
PUBLIC_MAINTENANCE_TYPE=migration
PUBLIC_MAINTENANCE_NOTE=Link creation is temporarily paused while infrastructure is migrated.
PUBLIC_MAINTENANCE_SCHEDULED=<ISO timestamp>
PUBLIC_MAINTENANCE_END=<ISO timestamp>
PUBLIC_STATUS_PAGE_URL=https://status.sptfy.in
```

Mode behavior:

- `PUBLIC_MAINTENANCE_MODE=true` -> force ON now
- `PUBLIC_MAINTENANCE_MODE=off` -> force OFF now
- `PUBLIC_MAINTENANCE_MODE=false` -> only ON inside scheduled window

---

## 4) Cutover (Short Freeze)

This is the critical path. Keep it short and boring.

### 4.1 Freeze writes

1. Stop new PocketBase (avoid destination mutations during final sync):

```bash
cd ~/pb-docker
docker compose down
```

2. Stop old PocketBase (authoritative write freeze):

```bash
ssh OLD_USER@OLD_HOST 'cd ~/pb-docker && docker compose down'
```

### 4.2 Fix destination permissions once

If you previously synced as root or saw rsync code 23, run:

```bash
sudo chown -R NEW_USER:NEW_USER /home/NEW_USER/pb-docker/pb_data /home/NEW_USER/pb-docker/pb_public
```

### 4.3 Final authoritative sync

Now use `--delete` so destination mirrors source exactly:

```bash
rsync -avz --delete --progress OLD_USER@OLD_HOST:~/pb-docker/pb_data/ /home/NEW_USER/pb-docker/pb_data/
rsync -avz --delete --progress OLD_USER@OLD_HOST:~/pb-docker/pb_public/ /home/NEW_USER/pb-docker/pb_public/
```

### 4.4 Start new backend

```bash
cd ~/pb-docker
docker compose up -d
docker compose ps
docker exec pocketbase /usr/local/bin/pocketbase --version
curl -sf http://localhost:8091/api/health
curl -sf https://pb.sptfy.in/api/health
```

---

## 5) Go / No-Go Checklist

Do not lift maintenance until all pass:

- [ ] `curl -sf http://localhost:8091/api/health`
- [ ] `curl -sf https://pb.sptfy.in/api/health`
- [ ] Admin panel loads at `https://pb.sptfy.in/_/`
- [ ] Existing redirect works
- [ ] New short link creation works
- [ ] `/recent` and `/top` load correctly

---

## 6) GitHub Actions Update

Workflow expects plain SSH host/user/key values:

- `VPS_HOST`: IP or DNS-only hostname (no `http://`, no path)
- `VPS_USER`: SSH username (example: `freq-azure`)
- `VPS_SSH_KEY`: full private key contents, including BEGIN/END lines

Cloudflare note:

- Do not use an orange-cloud proxy hostname for SSH.
- Use raw IP or DNS-only hostname for `VPS_HOST`.

---

## 7) Post-Cutover Hardening

1. In Azure NSG inbound rules:
   - Keep only `22`, `80`, `443`
   - Restrict SSH (`22`) source to `MY_PUBLIC_IP/32`
2. Confirm `8091` is not publicly exposed
3. Keep old VPS on standby for 24-72h (optional)
4. Disable maintenance mode and redeploy frontend
5. Monitor logs and health for 1-2 hours

---

## 8) Rollback (Fast)

If anything fails after cutover:

```bash
# Stop new
ssh NEW_USER@NEW_HOST 'cd ~/pb-docker && docker compose down'

# Start old
ssh OLD_USER@OLD_HOST 'cd ~/pb-docker && docker compose up -d'

# Revert DNS if needed
```

Keep maintenance ON until old path is verified healthy.

---

## 9) Known Pitfalls

- Hitting VM IP directly may show default Nginx page if your PocketBase block is domain-only (`server_name pb.sptfy.in`).
- `rsync --delete` before write freeze can remove/replace files mid-write.
- `rsync code 23` usually means destination permission mismatch; run `chown -R` then retry.
- Avoid `latest` image tags during migration; pin exact version, upgrade later.

---

## 10) Useful Commands

```bash
# Health
curl -sf http://localhost:8091/api/health
curl -sf https://pb.sptfy.in/api/health

# Compose
cd ~/pb-docker
docker compose ps
docker compose logs -f
docker compose restart

# DNS checks
dig +short pb.sptfy.in
nslookup pb.sptfy.in
```

---

## 11) Session Close Checklist

- [ ] Maintenance disabled
- [ ] Traffic validated end-to-end
- [ ] GH Action deploy tested once
- [ ] SSH restricted to your IP
- [ ] Old VPS decision recorded (keep/retire date)
- [ ] Notes captured in PR/changelog
