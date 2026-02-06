# AGENTS.md - Coding Agent Guidelines

## Build/Test Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm format` - Format code with Prettier
- Test command: Use `vitest` for testing (see src/lib/**tests**)

## Tech Stack

SvelteKit + Svelte 5 (runes), PocketBase, Tailwind CSS, Shadcn-Svelte components

## Code Style

- Use tabs for indentation, single quotes, no trailing commas (see .prettierrc)
- **Svelte 5 only**: Use `$state()`, `$derived()`, `$props()` runes - NO `let`/`export let`
- Import shadcn components from `$lib/components/ui/`
- Use PocketBase functions from `$lib/pocketbase.js`
- Iconify icons: `<iconify-icon icon="lucide:icon-name">`
- File naming: kebab-case for components, +page.svelte for routes

## Error Handling

- Use try/catch blocks for async operations
- Display errors via AlertDialog with title/description/icon pattern
- Toast notifications for success states using svelte-sonner

## Key Patterns

- Reactive state: `let variable = $state(initialValue)`
- Computed values: `let computed = $derived(expression)`
- Props: `const { propName } = $props()`
- Form submissions: `onsubmit={preventDefault(handleSubmit)}`
- Protected routes array validation for custom slugs

Note: dont forget to use Context7 if not sure.

## Checkpoint Commits

**Commit early, commit often.** Long coding sessions and context switching lead to forgotten commits. Use checkpoint commits to prevent lost work.

**When to Commit:**

- After completing any logical unit of work (even partial)
- Before switching to a different issue/task
- After 30+ minutes of active coding
- When 5+ files have been modified
- Before ending any session (mandatory)

**Commit Message Prefixes:**

- `wip: <description>` - Work in progress, can be squashed later
- `checkpoint: <description>` - Savepoint, stable but incomplete
- `feat: <description>` - New feature (complete)
- `fix: <description>` - Bug fix
- `chore: <description>` - Maintenance, config, dependencies
- `refactor: <description>` - Code restructuring
- `docs: <description>` - Documentation only

**Example Checkpoint Flow:**

```bash
# After 30 mins of work on a feature
git add -A && git commit -m "wip: add user profile component structure"

# Before switching to fix a bug
git add -A && git commit -m "checkpoint: profile page layout complete, styles pending"

# When feature is done
git add -A && git commit -m "feat: add user profile page with avatar upload"
```

## Merge and Release Strategy

**Current Strategy (PR-based Workflow):**

1. Create focused feature branch from main
2. Make checkpoint commits as you go
3. When complete → Create PR to main
4. PR description = changelog entry
5. Squash merge to main (clean history)
6. Delete feature branch

> **Note:** We transitioned to this strategy after merging `feature/link-management` early (Feb 2026). The large feature branch approach proved difficult to manage with multiple parallel workstreams.

**Direct Commits to Main:**

Only allowed for:

- Hotfixes (critical bugs in production)
- Documentation updates
- Config/dependency updates

**What Triggers a Release:**

- Merge/push to `main` branch triggers:
  - GitHub Action deploys PocketBase to VPS
  - Cloudflare Pages auto-deploys frontend
- Both deploy together for consistency

**PR Quality Gates (Automatic):**

- `pnpm lint` must pass
- `pnpm build` must pass

## Pull Request Workflow

**When to Create a PR:**

- Feature is complete and tested locally
- All quality gates pass (`pnpm lint`, `pnpm build`)
- Ready for review or merge
- NOT for work-in-progress (use feature branches with checkpoint commits instead)

**PR Title Format:**

Use the same prefixes as commit messages:

- `feat: add user profile page`
- `fix: resolve login redirect issue`
- `chore: update dependencies`

**PR Description Template:**

```markdown
## Summary

Brief description of what this PR does and why.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Tested locally with `pnpm dev`
- [ ] Build passes (`pnpm build`)
- [ ] Lint passes (`pnpm lint`)

## Screenshots (if UI changes)

<!-- Add screenshots here -->
```

**Squash Merge Policy:**

We use **squash merges** for all PRs to main:

- Keeps main branch history clean (one commit per feature/fix)
- PR title becomes the commit message
- Individual commits preserved in PR for context
- Use "Squash and merge" button in GitHub

**After Merge:**

1. Delete the feature branch (GitHub offers this automatically)
2. Pull latest main locally: `git pull origin main`
3. Close related beads issues: `./bd.exe close <issue-id>`

## Emergency Rollback Procedures

**Contact:** @ayamkv (primary)

**Monitoring:** BetterStack status page auto-alerts on DB issues

### Frontend Rollback (Cloudflare Pages)

1. Go to Cloudflare Dashboard → Pages → sptfyin
2. Select previous deployment from history
3. Click "Rollback to this deployment"
4. Instant - no downtime

### Backend Rollback (PocketBase VPS)

**Policy:** Forward-fix preferred over rollback due to migration constraints

**If forward-fix possible:**

1. Create hotfix branch from main
2. Fix the issue
3. Test locally
4. PR → squash merge → auto-deploy

**If rollback required:**

1. SSH to VPS: `ssh user@your-vps`
2. Stop container: `docker compose down`
3. Restore database from backup (automated via PocketBase → Cloudflare R2)
4. Rollback git: `git checkout <previous-commit>`
5. Restart: `docker compose up -d`
6. Verify: `curl http://localhost:8091/api/health`

**Database Backups:**

- Automated via PocketBase built-in backup feature
- Destination: Cloudflare R2 (S3-compatible storage)
- Recovery: Download from R2 and restore to VPS

## Issue Tracking with Beads

This project uses **beads** (bd) for issue tracking. Beads is a git-native, graph-based issue tracker designed for AI coding agents.

**Key Commands:**

```bash
# Show ready work (no blockers)
./bd.exe ready

# List all issues
./bd.exe list

# Create new issue
./bd.exe create "Issue title" -p 1 -t task

# Update issue status
./bd.exe update <id> --status in_progress
./bd.exe update <id> --status closed

# Close completed issue
./bd.exe close <id>

# Sync beads with git (run before push)
./bd.exe sync
```

**Priority Levels:** P1 (critical), P2 (medium), P3 (low)  
**Types:** task, bug, feature, docs, refactor  
**Workflow:** Check `bd ready` → Pick issue → Work → `bd close` → `bd sync` → `git push`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create beads issues for anything unfinished:
   ```bash
   ./bd.exe create "Description of remaining work" -p 2 -t task
   ```
2. **Run quality gates** (if code changed) - Tests, linters, builds:
   ```bash
   pnpm build
   pnpm lint
   ```
3. **Update issue status** - Close finished work in beads:
   ```bash
   ./bd.exe close <issue-id>
   ```
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   ./bd.exe sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
- Always run `./bd.exe sync` before pushing to sync issue tracking with git

## Deployment

**Architecture:**

- Frontend: SvelteKit on Cloudflare Pages (auto-deploys on push to main)
- Backend: PocketBase in Docker on VPS (GitHub Action deploys on push to main)

**Deployment is triggered by:**

- Push to `main` branch
- Changes to `pocketbase/pb_hooks/**`, `pocketbase/pb_migrations/**`, or `docker-compose.yml`

**Manual Deployment (if needed):**

1. Go to GitHub → Actions → "Deploy PocketBase" → Run workflow
2. Or SSH to VPS and run:
   ```bash
   cd ~/pb-docker
   git pull origin main
   docker compose up -d
   ```

**VPS PocketBase Location:** `~/pb-docker/`

**Health Check:** `curl http://localhost:8091/api/health`
