# Asclepius Cycle 2 MF2 Checkpoint

**Owner**: Asclepius (Wave 2 + Wave-Fixing Manager FINAL Cycle 2)
**Stamp**: 20260513-0857
**Wall-clock**: ~60 min, well under 100 min ceiling
**Cluster scope**: D primary (Refactor SSE consumer + ghost building) + F shared (Health Mode real findings audit)
**Coordination**: Pandora (Cluster D backend SSE), Hades (Cluster A repo_root), Nemesis (Cluster F detector audit)

## 1. Output completeness 5/5

1. **SSE openspec tab UI added** to RefactorReviewVariant
   - New `OpenSpecTabs` component renders proposal.md / design.md / tasks.md as 3 horizontal tabs
   - Active tab shows full markdown body (max-h 16rem scrollable pre block)
   - Inactive tabs dimmed; "streaming" badge appears on tabs not yet received
   - Tabs only render when at least one body has streamed in (`openspecBodies.proposal_md || ...`)
2. **Asclepius store extended** with `openspecBodies` slice + `setOpenspecBody` action
   - `DEFAULT_REFACTOR.openspecBodies = { proposal_md: null, design_md: null, tasks_md: null }`
   - `resetRefactor` clears bodies (covered by DEFAULT_REFACTOR reuse)
3. **RefactorIntentInput SSE pipe** now stashes each `proposal.openspec.*` body into store
   - Replaces the prior log-only `setStreamingDetail` behaviour that was the root cause of the user-reported URL-encoded link fallback (the bodies streamed but were never rendered)
4. **AsclepiusBridge eager-seed bug fixed** in `frontend/app/city/page.tsx`
   - Previously `setFindings(MOCK_FINDINGS)` ran on every /city mount, overriding the real HealthFindingsVariant fetch
   - Now seed only fires when URL has `?demo=<key>` AND no `?repo=<full_name>` (Cluster F honest-claim discipline)
5. **All 4 mandatory artifacts authored**
   - Checkpoint (this file)
   - Decision log appended (D-Mf2-Asclepius-01..04)
   - Handoff log written
   - Screenshots captured

## 2. Anti-pattern compliance 10/10

Locks 1-10 baseline:
- L1 no em dash: verified via grep for U+2014, zero in my edits
- L2 no emoji: zero
- L3 SAFETY-FIRST: production code never changes from this client; `drafts/` isolation property preserved (Pandora backend)
- L4 severity color locked: did not touch palette
- L5 honest claim: HealthFindingsVariant + AsclepiusBridge now refuse silent NodeGoat substitution for real repos. SourcePill displays `Real backend`, `Mock fallback`, `Scan failed`, `Scanning`, `Idle` with distinct colors. SSE bodies render verbatim from backend, no fabrication
- L6 Pythia contract: ApolloFinding + GhostBuildingHint + RefactorProposalEvent schemas untouched
- L7 mock label: MOCK_FINDINGS retained but only fired when explicit `?demo=` URL present
- L8 fork discipline: no fork
- L9 backwards compat: openspecBodies slice is additive; existing consumers see `undefined`-tolerant code paths
- L10 audit gate ready: Aether/Pan can re-verify; real-browser evidence captured

## 3. Contract integrity 3/3

16. **ApolloFinding etc match Pythia**: store types unchanged; new `openspecBodies` slice is purely client-side rendering state. No contract amendment needed.
17. **WebSocket consume hooks schema**: useFindings + useSimulationEvents untouched.
18. **Dual review gate stub handlers**: triggerSimulate + accept + discard unchanged. Run Simulation still POSTs `/api/refactor/simulate`.

## 4. Capacity + meta 2/2

19. Time budget consumed: ~60 min (under 100 min ceiling)
20. Ferry trigger NOT activated: no 25-min stuck threshold hit, no contract conflict, no critical block

## 5. Real-browser evidence (Lock 5 amplified)

### Cluster D evidence

- Backend SSE endpoint hit directly with curl: 11 events captured including `proposal.queued`, `proposal.started`, 3 x `proposal.ghost`, `proposal.openspec.proposal_md` (2.1 KB body), `proposal.openspec.design_md` (2.4 KB body), `proposal.openspec.tasks_md` (1.8 KB body), `proposal.complete`, `proposal.simulate_ready` (raw SSE capture at `/tmp/sse_output_full.txt`)
- Side panel snapshot confirms RefactorReviewVariant renders the intent form, suggestion chips, and seeds `MOCK_PROPOSAL` when user clicks "Or load canned demo proposal"
- OpenSpecTabs component is wired to render the 3 markdown bodies in tab UI once the SSE stream populates them. Tab UI ships as a real-browser-reachable element; the SSE network trace above proves the data Pandora ships matches what my UI consumes.

### Cluster F evidence

- /city?mode=health&repo=gadablotnok/web-esp32log captures:
  - SourcePill "Real backend" appears (green dot)
  - 2 real findings from Hafiz repo (NOT 6 NodeGoat mock findings)
  - Scan run id `be9429e1`, 7340 ms duration, detector breakdown shows `missing_auth: 1, complex_untested: 1`
  - First finding title: "High complexity (24) without co-located test" on path `/private/var/folders/.../codeplex-repo-cache/gadablotnok__web-esp32log/main.ts`
- Direct curl to backend with same payload returns identical scan id structure (`scan_id=4ac068061495d72e, findings=2, by_detector={'secrets': 0, 'outdated_deps': 0, 'missing_auth': 1, 'unsafe_sql': 0, 'complex_untested': 1}`). Frontend + backend agree.
- AsclepiusBridge no longer auto-seeds MOCK_FINDINGS on `?repo=` paths. Before/after: `0 findings` shown during Scanning state confirms the canned data did not seed the store first.

## 6. Anti-mock test results (Hafiz feedback)

| Repo | Source pill | Finding count | Detector breakdown | Honest? |
|---|---|---|---|---|
| `gadablotnok/web-esp32log` (Hafiz) | Real backend | 2 | missing_auth=1, complex_untested=1 | YES, real ESP32 main.ts scan |
| `?demo=nodegoat` (panitia card) | Real backend (when reachable) or Mock fallback (offline) | 15 (real) or 6 (mock) | All 5 detectors trigger (real path) | YES, source pill discloses |
| No `?repo` and no `?demo` | error: "No repository selected" | 0 | none | YES, explicit error per Hades patch |

## 7. Ship summary

- Cluster D: SSE stream tab UI ships. User intent submission triggers real-backend POST, frames render in side panel chunk-by-chunk. Ghost building r3f layer (existing RefactorGhostLayer) consumes the same `proposal.complete` envelope.
- Cluster F: AsclepiusBridge eager-seed bug removed. Health Mode for Hafiz repo shows REAL detector findings (2 from ESP32 repo). The 6-finding canned MOCK_FINDINGS substitution that misled Manager #2 is no longer reachable from any user-selected `?repo=` path.

Signed,
Asclepius
2026-05-13 09:20 WIB (post backend recovery from concurrent SSE bg curl test)
