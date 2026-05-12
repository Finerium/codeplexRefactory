---
actual_timestamp: 2026-05-13T01:47+07:00 (WIB) / 2026-05-12T18:47:00Z (UTC)
agent: Hestia
identity_mode: rescue
wave: Wave-Fixing
cycle: 1
stamp: 20260513-0147
scope_bugs: [E-1, E-2, E-3]
verdict_per_bug:
  E-1: FIXED
  E-2: FIXED
  E-3: PARTIAL (ship-blocking path delivered, Hades cross-scope review requested)
code_files_touched:
  frontend:
    - frontend/components/entry/EntryApp.tsx
    - frontend/app/start/build-from-scratch/page.tsx
    - frontend/app/start/pick-repo/page.tsx
    - frontend/components/entry/RepoPickerStep.tsx
  backend:
    - backend/app/api/__init__.py
    - backend/app/api/auth/github.py
    - backend/app/api/repos.py
deferred_reasons:
  E-3_backend_ownership: |
    Backend endpoint POST equivalent and Demeter-DB-backed token retrieval
    flagged for Hades review. Current implementation uses a short-lived
    HTTP-only cookie (oauth_access_token_enc, 30 min, Fernet-encrypted) as
    the carrier between OAuth callback and /api/repos/list. Hades cycle 2
    should migrate the lookup to Demeter users.encrypted_access_token keyed
    by the session JWT sub once the real Demeter persist lands.
ferry_surfaced: |
    E-3 partial: Hades coordinate /api/repos/list ownership transfer + DB
    token retrieval. Demo-ship safe via cookie path delivered this cycle.
---

# Hestia Wave-Fixing Cycle 1 Handoff

Wave-Fixing dispatch from Manager-Wave-Fixing post QA round Day 2. Three /start
bugs assigned to Hestia rescue identity. Submission window approximately 10h
ahead at the time of this handoff (Day 2 11:00 to 13:00 WIB).

## Bug E-1 CRITICAL: "Build from Scratch" 404

### Root cause

`frontend/components/entry/EntryApp.tsx` line 35 defined
`BLANK_CITY_TARGET = "/blank"` but no route exists at
`frontend/app/blank/`. The right casement door fired `window.location.href`
to a non-existent path, yielding the Next.js default 404 page captured in
`_meta/qa_screenshots/BuildFromScratch.png`.

### Fix

Two changes, both shipped:

1. `EntryApp.tsx`: retarget `BLANK_CITY_TARGET` to
   `/city?mock_auth=true&mode=empty`. This is the Manager-recommended
   Option (a) clean redirect to the existing city demo, with the
   `mode=empty` query reserved for future "empty city scaffold" behaviour
   when the city page reads it.
2. New file `frontend/app/start/build-from-scratch/page.tsx`. Server
   Component that calls `redirect("/city?mock_auth=true&mode=empty")` so
   the literal URL `/start/build-from-scratch` (shared deep link, external
   reference) resolves to the same destination. No client bundle for this
   route.

### Verification path

- Manual click on right door from `/start` should bounce through the
  casement-open animation (2.2s) then navigate to `/city`.
- Direct hit on `/start/build-from-scratch` should 307 redirect to
  `/city?mock_auth=true&mode=empty` before any HTML ships.
- Browser back button from `/city` to `/start` should not display the
  former overlay (see E-2 fix).

### Verdict

FIXED.

## Bug E-2 CRITICAL: "entering city view" overlay stuck forever

### Root cause

`EntryApp.tsx` held `opening` as local React state. Navigation away from
`/start` was a hard `window.location.href` assignment, but the browser
back button (especially Safari with bfcache) could restore the page
with `opening` still set to "left" or "right". With `opening !== null`
the Stage component renders the loading pill ("breaking ground on a
blank lot . entering city view...") indefinitely because nothing in the
component lifecycle ever sets `opening` back to null. Only a hard reload
clears the in-memory state.

### Fix

`EntryApp.tsx`: new `useEffect` with empty deps that does two things on
mount:

1. Force `setOpening(null)` immediately. A fresh mount of the entry
   should never start with the overlay visible.
2. Subscribe to the `pageshow` event and reset opening when
   `event.persisted === true`. This is the documented Safari bfcache
   restore signal and the canonical way to invalidate stale UI state
   when the browser swaps a cached page back in (back/forward cache
   never re-runs initial component mount but does fire pageshow).

The existing keyboard `useEffect` is unchanged; the new effect is
additive.

### Verification path

- Click right door, wait through the animation, land on `/city`.
- Press browser back. Land on `/start`. Overlay should NOT be visible.
  Window cards focusable, no spinner.
- Repeat for left door (OAuth path) once Hades flow lands and the user
  back-navigates from the callback chain.
- Console clean across the bfcache restore.

### Verdict

FIXED.

## Bug E-3 HIGH: GitHub OAuth has no post-consent repo picker

### Root cause

`backend/app/api/auth/github.py` callback handler issued a direct 302 to
`/city` after Demeter upsert, skipping any repo selection. The user was
funneled into the demo city regardless of which repository they
intended to inspect.

### Fix

Three coordinated changes, all shipped:

1. **Backend new endpoint `backend/app/api/repos.py`**. GET
   `/api/repos/list` returns up to 50 GitHubRepoSummary entries by
   forwarding to `https://api.github.com/user/repos?per_page=50&sort=updated`
   with the Bearer token decrypted from the `oauth_access_token_enc`
   cookie. Returns 401 if the cookie is missing or decrypt fails, 502
   if the GitHub upstream errors.
2. **Backend OAuth callback patch `backend/app/api/auth/github.py`**.
   - Now sets the `oauth_access_token_enc` cookie (Fernet-encrypted
     access token, HTTP-only, SameSite=lax, 30 min max-age) alongside
     the long-lived `hades_session` JWT cookie.
   - Redirect target changed from `/city` to `/start/pick-repo` so
     the user lands on the picker.
3. **Frontend new route `frontend/app/start/pick-repo/page.tsx`** and
   client component `frontend/components/entry/RepoPickerStep.tsx`.
   Renders three paths:
   - User's GitHub repos (filterable search, click row to
     `/city?repo=<full_name>`).
   - Manual paste of `owner/name` or `https://github.com/owner/name`.
   - Two demo datasets (NodeGoat, fastapi-template) for panitia
     fallback when GitHub fetch fails or user has no repos.
   Surface explicit `unauthenticated` and `error` states with
   readable copy directing the user to the demo fallback rather than
   silently dead-ending.

### Cross-scope ownership note (FERRY surface)

The `app/api/repos.py` endpoint is logically Hades territory (OAuth
+ session domain). Hestia authored it under Wave-Fixing because the
demo window is tight and the frontend path was blocking. Two items
for Hades cycle 2 / Aletheia review:

- Move `repos.py` into `app/api/auth/` or under a `users` namespace
  if Hades prefers consolidating identity routes.
- Swap the cookie-based token transport for a Demeter
  `users.encrypted_access_token` DB lookup keyed by the session JWT
  sub. The cookie path is a deliberate hackathon-scope compromise
  documented in `repos.py` module header (Lock 5 honest claim).

### Verification path

- Full OAuth happy path: `/start` left door, GitHub consent, callback
  lands on `/start/pick-repo`, list renders.
- Cookie missing case: hit `/start/pick-repo` directly without OAuth.
  RepoPickerStep shows the `unauthenticated` warning state.
- Upstream error case: GitHub rate limit or network failure surfaces
  the `error` banner; demo dataset fallback still clickable.
- Manual paste: enter `OWASP/NodeGoat` or full GitHub URL, navigate
  to `/city?repo=OWASP%2FNodeGoat`.

### Verdict

PARTIAL. Ship-blocking demo path delivered. Backend ownership +
DB-backed token transport flagged to Hades for cycle 2 review.

## Smoke verification performed in this cycle

1. **Frontend tsc on touched files**: `npx tsc --noEmit -p tsconfig.json`
   produced zero errors for `EntryApp.tsx`,
   `build-from-scratch/page.tsx`, `pick-repo/page.tsx`,
   `RepoPickerStep.tsx`. Pre-existing unrelated errors in
   `src/lib/dashboard/useDashboardData.ts` are out of Wave-Fixing
   scope.
2. **Backend module import**: `.venv/bin/python -c "from app.api import api_router"`
   completes clean. Aggregate router contains `/repos/list` and all
   four `/auth/github/*` paths after the cycle's edits.
3. **Callback edit spot-check** via python AST scan: confirmed
   `oauth_access_token_enc` cookie name present, redirect target now
   `/start/pick-repo`, old `RedirectResponse(url="/city",
   status_code=302)` removed from the success branch.

Full end-to-end click-through smoke (Playwright) deferred to the next
QA round; the static + import-level smoke is sufficient to confirm
the code paths wire correctly.

## Lock compliance

- Lock 1 (no em dash): clean across all touched files.
- Lock 2 (no emoji): clean across all touched files.
- Lock 5 (honest claim): E-3 PARTIAL verdict declared explicitly,
  cookie-vs-DB token transport flagged in source headers and this
  handoff. E-1 and E-2 verdicts FIXED with verification paths.

## Recommended next actions (parent / Manager)

1. Run Playwright click-through across all three bugs once the
   frontend dev server is up (`cd frontend && npm run dev`).
2. Loop Hades on the `repos.py` cross-scope ownership question
   before Aletheia Wave 3 final audit.
3. Confirm the `/city` page handles the new query parameters
   (`repo=`, `demo=`, `mode=empty`) gracefully even if it only
   logs them today; the actual data-source swap is a Wave 3
   Hades/Demeter task.
