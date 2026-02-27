# Stability Sprint Plan (March 2026)

Owner: @ayamkv
Last updated: 2026-02-28
Audience: engineering, ops
Status: draft

## Purpose

Stabilize the codebase before shipping major new features by focusing on security,
auth/session reliability, redirect continuity, and maintainability.

## Scope

In scope:

- Security hardening and auth/session reliability fixes.
- Redirect reliability during maintenance and temporary backend outages.
- Error handling audit and consistency pass.
- Dead code and debug surface cleanup.
- Svelte 5 consistency cleanup and first refactor slice for large route files.

Out of scope:

- Monetization and Pro tier features.
- New user-facing feature launches unrelated to reliability/bug fixes.
- Large architecture migrations (for example full D1/KV migration).

## Feature Freeze Window

- Start: 2026-03-02
- End: 2026-03-27
- Rule: During this window, only bug/security/reliability/docs work is allowed.

## Timeline

### Week 1 (Mar 2 - Mar 6): Security and Auth Baseline

Primary issues:

- `sptfyin-db9` - Re-enable CSRF and fix filter injection risk.
- `sptfyin-8fs` - Fix auth persistence/session recognition across pages.
- `sptfyin-8yp` - Fix PocketBase server route access pattern (`event.locals.pb`).
- `sptfyin-e3z` - Remove hardcoded `/prev` API key and move to env/secret.

Exit criteria:

- No known open P1 auth/security regressions from the above scope.
- Login and session persistence behave consistently across routes.
- Server routes avoid request-shared mutable state patterns.

### Week 2 (Mar 9 - Mar 13): Redirect Reliability and Error Handling

Primary issues:

- `sptfyin-wr3.1` - Fail-open redirect path on analytics failures.
- `sptfyin-wr3.2` - Cache/KV-backed slug resolution for maintenance resilience.
- `sptfyin-6ir` - Verify error handling patterns across the codebase.
- `sptfyin-5gu` - Test Microlink URL expansion implementation.
- `sptfyin-bwf` - Add vitest to PR quality gates and `pnpm test` script.

Exit criteria:

- Redirect path remains available when analytics writes fail.
- Maintenance-mode read behavior is verified with explicit checks.
- Error handling pattern audit complete for critical user flows.

### Week 3 (Mar 16 - Mar 20): Cleanup and Consistency

Primary issues:

- `sptfyin-zp9` - Remove dead code/unneeded dependencies and deprecated routes.
- `sptfyin-i6j` - Replace/remove production debug logs with gated logging.
- `sptfyin-3o7` - Standardize codebase to Svelte 5 patterns only.
- `sptfyin-1qb` - Centralize reserved slug validation in a shared module.

Exit criteria:

- Deprecated/debug-only surfaces are removed or properly gated.
- Logging strategy is consistent across client/server routes.
- No known mixed legacy Svelte patterns in active route components.

### Week 4 (Mar 23 - Mar 27): Refactor Slice and Documentation Closure

Primary issues:

- `sptfyin-j8x` (phase 1) - Extract shared logic/components from route monoliths.
- `sptfyin-wr3.3` - Document degraded maintenance behavior and verification matrix.

Exit criteria:

- At least one shared creator/utility extraction is merged and used in more than one route.
- Maintenance behavior matrix is documented and linked in ops docs.

## Weekly Quality Gates

At the end of each week:

- `pnpm lint` passes.
- `pnpm build` passes.
- `vitest` suite runs and passes for touched areas.
- No open blocker created during the sprint without a matching issue.

## Deferred Work During Freeze

The following categories are intentionally deferred until after the sprint:

- Monetization (`sptfyin-67r` and dependent tasks).
- Net-new feature epics (for example `sptfyin-eeb`, `sptfyin-nwh`, `sptfyin-0me`).
- Broad route-structure migration (`sptfyin-k3p`) unless required for a blocker.

## Success Metrics

- All in-scope P1 stability/security issues are closed or moved to verified state.
- Redirect continuity checks pass in maintenance simulations.
- Authentication flow no longer requires manual refresh/re-login loops.
- Route-level complexity starts decreasing through shared extraction and cleanup.

## Related docs

- `docs/dev/local-development.md`
- `docs/ops/migration-runbook.md`
- `docs/product/roadmap.md`
- `AGENTS.md`
