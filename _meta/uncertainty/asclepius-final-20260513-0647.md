# Asclepius uncertainty journal Wave-Fixing 3 Manager FINAL

**Authored**: 2026-05-13 06:47 WIB
**Worker**: Asclepius (paired with Nemesis on HEALTH-MOCK-SUSPECT)
**Cycle**: Wave-Fixing #3 single-cycle FINAL
**Trigger**: Manager directive HEALTH-MOCK-SUSPECT + Refactor ghost building visual

## High-confidence claims (no ferry)

- **HF-1**: The HealthFindingsVariant always rendered MOCK_FINDINGS before
  the fix because the seed `useEffect` fired on first render before any
  backend call could land. Verified by reading the prior commit content of
  the file in this same session. Lock 5 honest claim discipline says I
  surface this as the root cause, which I did in `_meta/decision_log/
  asclepius.md` D-Asclepius-WF3-01.
- **HF-2**: The fix is correct because Playwright shows the variant entering
  the `Scanning` state with tooltip `POST /api/findings/scan in flight`
  immediately on tab switch + the backend curl returns 15 real findings on
  the same fixture path. Snapshot file:
  `.playwright-mcp/page-2026-05-12T23-44-30-997Z.yml` lines 117-130.
- **HF-3**: Ghost connection lines are visual-only and do not touch any
  production code path. Lock 3 SAFETY-FIRST holds.

## Medium concerns (uncertainty journal, no ferry)

- **MC-1**: The mock fallback is still in `__mock__/findings.ts`. Honest
  argument for keeping: when backend is unreachable (DROP-A degradation, K8s
  pod restart in the middle of demo), mock fallback keeps the demo flow alive
  with a clearly-labeled amber pill. Honest argument for removing: the bug
  came from this fixture being seeded too eagerly; some future careless
  worker might re-introduce the seed. Decision: keep + label + cover via the
  pill copy + label via test. If a future cycle removes it entirely the
  fallback path becomes a hard error which is also defensible.

- **MC-2**: The local backend scan takes ~40 seconds because the OSV API
  calls are not cached on this machine. In K8s the response is sub-second
  for cached scans (`scan_run_id` reused). For the demo I would either
  pre-warm with one `POST /api/findings/scan` call at boot, OR ship a
  realistic-finding seed via the existing `POST /api/demo/seed` endpoint so
  the initial render is instant. Decision: surface this in the handoff to
  Pan for demo rehearsal.

- **MC-3**: My URL `?mode=` helper only fires once on mount. If a user
  shares a link to `/city?mode=health` and the side panel default already
  switched to refactor due to a prior click, the param will not re-fire. I
  could write the param into the store via a custom router-aware hook but
  that would touch panelStore + the Activity scrubber + the Sprint Mode HUD
  hide toggle. Scope keeps to mount-only; future Persephone rescue can
  generalise.

- **MC-4**: Connection lines use `useBuildingById` which returns undefined
  when the target id is not in the Iris mockCityData. The component gracefully
  short-circuits to `null`. In production with a real CityData stream from
  Demeter, ghost targets generated from Athena should always resolve. If
  they do not, the line silently does not render which is the safe
  default but might be confusing during demo if the proposal references a
  file not yet in the city. Suggestion to Pandora: validate ghost
  connection target ids against the active CityData before publishing.

- **MC-5**: The ConvertToTicket button still uses the optimistic UI pattern
  with a flying packet animation, then attempts the real POST in parallel.
  When ENABLE_WRITE_OPS=false the deep link opens in a new tab. Real GitHub
  issue creation requires a logged-in user with write:issues scope on the
  target repo, which the demo flow may not have unless we ship an OAuth
  flow before pitch. Honest fallback (deeplink) keeps the demo unblocked.

## Confidence-based action

All concerns above are medium. No ferry trigger fired:
- No critical block (HEALTH-MOCK-SUSPECT root cause located + fixed).
- No contract conflict (ApolloFinding wire shape camelCased per Pythia).
- No anti-pattern violation (Lock 1-5 audit clean on owned files).
- No decision out of scope (every artifact stayed within Asclepius
  ownership: modes/health, modes/refactor visual, panels/side variant).
- No downstream cascade risk (Nemesis cycle 5 ship-clean; Pandora cycle 2
  ship-clean; my changes preserve the existing wire surfaces).
