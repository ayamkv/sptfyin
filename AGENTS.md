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
