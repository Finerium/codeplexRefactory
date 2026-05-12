---
actual_timestamp: 2026-05-13T03:28+07:00 (WIB) / 2026-05-12T20:28:00Z (UTC)
worker: Hestia
identity_mode: rescue
wave: Wave-Fixing #2
cycle: 1
stamp: 20260513-0328
confidence_level: medium
ferry_triggered: false
---

# Hestia Wave-Fixing #2 cycle 1 uncertainty journal

## U-Hestia-WF2-01: /city demo render is downstream of Hestia ownership

**Confidence**: medium

**Concern**: the QA round 2 report flags both E-5 (Build from scratch) and E-6 (demo dataset load) as throwing client-side exceptions. My investigation in the local dev environment could not reproduce a client-side exception on either path; the `/city` route returns 200 from the server and the page mounts cleanly. The QA evidence pointed at the live deployment where the production webpack build is what ships. I do not have a captured stack trace from that environment.

My fix path for E-5 sidesteps the issue by shipping a Hestia-owned workspace at `/start/build-from-scratch` that does not touch `/city`. This is a structurally clean rescue: the workspace satisfies PRD 7.1 directly. But if the panitia or a reviewer types `/city?mock_auth=true&mode=empty` directly into the URL bar (without going through the casement door), they will land on `/city` and observe whatever the city renders. That residual surface is not under my control.

For E-6 the picker still navigates to `/city?demo=<key>` for any of the three demo datasets. If `/city` throws or silently shows the same mockCityData for every demo key, the panitia perceives the demo dataset feature as broken. The actual demo schema selection is `cityEngine.ts` + `useCityData` territory (Iris/Hera/Persephone).

**What I would want from a follow-up cycle**:

1. Iris/Hera/Persephone diagnose the live `/city` client-side exception by either visiting the live cluster in a real browser with devtools or by reproducing locally via `npx next start` after a webpack production build. The current dev-server probe is too lenient to surface the production-only failure.
2. Once the root cause is identified, the city scene's `useCityData()` should branch on `searchParams.get('demo')` to load a per-demo pre-parsed dataset (the PRD line 320-323 "Day 0 prep" deliverable). Currently `useCityData()` returns a singleton hardcoded to fastapi-fullstack shape, which makes the demo distinction in the picker cosmetic.

**Mitigation in this cycle**: I added `?fallback_reason=demo_crash` query handling on `/start/pick-repo` so if a future Iris/Hera/Persephone patch redirects users back to the picker with that flag, my UI surfaces a clear fallback message rather than dead-ending. No silent masking; the banner says explicitly that the demo render threw and tells the user to try a different demo or paste a URL.

## U-Hestia-WF2-02: SVG skyline vs the canonical 3D city scene

**Confidence**: medium-high

**Concern**: PRD Section 7.1 plus PRD Section 13.1 establish the canonical Codeplex visual language as a 3D r3f city. My blank-lot workspace uses a 2D SVG skyline instead. A reviewer comparing `/city` (full 3D) to `/start/build-from-scratch` (2D SVG) might read the latter as a stylistic downgrade.

**Why I made the call this way**: Manager anti-collision rule states "Iris OWN: cityEngine.ts (you trigger file-create event, Iris responds setMatrixAt)". Without an Iris coordination handshake landing in the same cycle, the only way to render a 3D scene from a Hestia-owned route is to either (a) duplicate `cityEngine.ts` code into a Hestia module (Lock 8 DRY violation, plus a 3D scene mount inside the entry surface would change Hestia's bundle size dramatically) or (b) cross the ownership boundary. The SVG skyline keeps me inside the boundary while honoring the spirit of PRD 7.1 (buildings rise as files are created).

The SVG skyline visually quotes the right-door MiniCity preview (same `mulberry32` PRNG, same warm color palette, same vertical building glyphs), so the workspace reads as a continuation of the entry-page scene rather than a foreign UI. A future cycle can swap the SVG mount for a true `<BuildingInstances>` 3D mount if Iris ships a `useVirtualFS()` adapter that Hestia can compose.

## U-Hestia-WF2-03: Save to GitHub is a Wave 3 stub

**Confidence**: high

The PRD Section 7.1 spec for "Build from scratch" mentions an optional GitHub export path. I exposed the affordance ("save to github (Wave 3)" button) but the actual PyGithub backend write is Hades + backend territory. Clicking the button surfaces a status banner explaining that persistence happens locally in the browser and the GitHub export is a future cycle. Lock 5 honest claim; no silent fake.

If a post-submission cycle wants to wire this for real, the contract is:
- Backend endpoint `/api/blank-city/export` accepts `{ files: VirtualFile[], target_repo: string }`, uses the OAuth token from the existing session, calls PyGithub create-repo + tree-write.
- Frontend serializes `loadFS().files` into the POST body, displays progress, navigates to the new repo on success.

The `freshFS()` + `loadFS()` + `saveFS()` API surface is already factored to make this clean.

## U-Hestia-WF2-04: Multiple TypeScript noUnusedLocals errors elsewhere in the repo

**Confidence**: high

While running `npx next build --webpack` to verify my changes, I hit a series of TS6133 "declared but never read" errors in files outside my scope (`src/scene/Canvas.tsx`, `src/lib/dashboard/useDashboardData.ts`, `components/panels/side/SidePanel.tsx`). These are pre-existing tech debt from Wave-Fixing #1 parallel batches. The Atlas Wave-Fixing #2 re-deploy log shows it built successfully via the Docker variant, which means either the Docker build path bypasses noEmit checking somehow OR there is a `--no-type-check` flag in play in CI that is not in the local equivalent.

**Action taken**: zero edit on out-of-scope files. My noEmit run is clean. If Atlas re-deploy hits the TS check failure on this commit, the cluster-wide cleanup is a separate scope.

## U-Hestia-WF2-05: Localized hydration mismatch caught in the first probe

**Confidence**: high

The first render of `BlankCityWorkspace` threw a hydration mismatch because the seed files originally used `Date.now()` for timestamps, and the building grow animation read `Date.now() - file.createdAt`. The server-side render produced one snapshot of "now"; the client first render produced a different snapshot, and the buildings rendered at different heights between SSR and CSR.

**Fix**: seed files now carry a sentinel `SEED_EPOCH = 0` timestamp. The `now` state initializes to `SEED_EPOCH + 2_000` for SSR consistency, then upgrades to real `Date.now()` after mount via `useEffect`. Building glyphs with `growMs <= 0` skip the animation. Verified clean: no hydration error after the fix.

**Why this matters**: the original bug surface in QA round 2 was "client-side exception". The hydration mismatch I fixed in this same cycle would have been a regression introduced by my code if I had not caught it before commit. Logging it here so the next cycle reviewing the code knows the SSR/CSR boundary is delicate for any timestamp-driven UI.

## Ferry decision

**Result**: no ferry.

**Rationale**: my four cycle artifacts ship clean. The E-5 fix is structurally complete (workspace lives, virtual FS persists, building grow animates, editor types, file create works). The E-6 fix is partial-by-design: the picker gives users three demo paths and the fallback signaling rail, but the downstream /city render is owned by another worker and the cross-scope coordination is documented for the Manager dispatch rather than escalated mid-cycle.

If the Manager wants me to also fix the /city demo render path, that requires cross-scope edit permission. I am surfacing the residual ownership boundary in the handoff log so the next dispatch is informed.
