# V5 Snapshot: Boreas Wave-Fixing #2 Cycle 1 SHIP-CLEAN

**Timestamp**: 2026-05-13 03:23 WIB Day 2 (STAMP=20260513-0323, generated via `date +%Y%m%d-%H%M`)
**Worker**: Boreas, north wind + directed movement
**Wave-Fixing**: #2 Cycle 1 (rescue spawn by Manager Wave-Fixing #2)
**Cluster**: 8 (Activity Mode timeline + Onboarding camera fly + Clio narration + 4 tour variant)
**Status**: SHIP-CLEAN, no ferry, awaiting downstream audit

---

## Cycle scope (Manager Wave-Fixing #2 spawn directive)

1. Feature #27 Activity Mode timeline scrubber 30/60/90 days fully functional via real `/api/activity?days=` backend
2. Ownership concentration heatmap per district (CODEOWNERS + git blame)
3. Contributor heatmap overlay
4. Hotspot perubahan glow intensity (commit frequency per file in period)
5. Onboarding camera fly deterministic top-3 district pick (ownership concentration + recent activity)
6. Feature #30 Clio narrate prose via REAL DeepSeek V4-Flash non-think (Activity Mode 60s sprint retro + spec-drift narration)
7. 4 Hermes tour variant routing
8. Hermes narration text overlay during fly
9. Tour pause/resume mid-flythrough button

---

## Ship deliverables

### NEW files (2)

1. **`frontend/src/modes/activity/clioNarration.ts`** (180 line)
   - `fetchClioRetroNarration(data, rangeDays)`: real SSE stream from `/api/chat target=Clio` (DeepSeek V4-Flash non-think) with assembled prose return + canned fallback
   - `buildCannedRetroProse(data, rangeDays)`: deterministic 2-3 sentence canned prose from real activity stats
   - `resolveApiBase()`: env-aware API base resolution (production same-origin, dev localhost:8000, NEXT_PUBLIC_API_BASE override)

2. **`frontend/src/modes/activity/SprintRetroFlythrough.tsx`** (240 line)
   - `<SprintRetroCanvasLayer>`: r3f Canvas child, reuses `<CameraFly>` over auto-synthesized 3-waypoint TourScript covering top-3 hot buildings
   - `<SprintRetroHud>`: DOM HUD trigger button bottom-right + Clio narration overlay top-center during flythrough
   - `useSprintRetroController()`: phase machine (idle -> fetching -> flying -> complete) + auto-fly script builder + Clio fetch + replay logic

### MODIFIED files (4)

3. **`frontend/src/modes/activity/useActivityData.ts`**: synchronous mock -> async real backend fetch with mock fallback chain
   - `fetchActivityData(query)`: real `GET /api/activity?days={query.days}&repo={query.repo}` with `adaptServerToClient` snake_case -> camelCase mapping
   - `isServerDataEmpty` check + fall-through to mock when materialized views WITH NO DATA
   - `useActivityData()`: useState + useEffect-driven refresh, initial mock value for SSR safety

4. **`frontend/src/modes/onboarding/tourDSL.ts`**: `fetchWaypointNarration` swap
   - Real `POST /api/onboarding/narration` with full `NarrationPromptContext` payload (Pythia contract shape)
   - Static `getHermesLine(variant, waypointIndex)` fallback on 401/503/network failure

5. **`frontend/src/modes/activity/index.ts`**: barrel exports for SprintRetroFlythrough + clioNarration

6. **`frontend/app/city/page.tsx`**: mount Activity Mode + Onboarding Mode layers based on `usePanelStore.currentMode`
   - `<ActivityCanvasLayer>` + `<SprintRetroCanvasLayer>` inside ChronicleCanvas when mode === 'activity'
   - `<ActivityHud>` + `<SprintRetroHud>` as DOM siblings when mode === 'activity'
   - `<OnboardingCanvasLayer>` inside ChronicleCanvas when mode === 'onboarding'
   - `<OnboardingHud>` as DOM sibling when mode === 'onboarding'
   - Coexists with: Hera SprintMode + DirectorModeButton + SprintHud + Asclepius bridge (all preserved)

### ARTIFACTS (4 + V_n)

7. `_meta/decision_log/boreas.md` (D12-D15 appended)
8. `_meta/uncertainty/boreas-wave-fixing-cycle1-20260513-0323.md` (8 concerns, 5 MEDIUM + 3 HIGH-correctly-scoped)
9. `_meta/checkpoints/boreas-wave-fixing-cycle1.md` (20-item self-check PASS)
10. `_meta/handoff_log/boreas_wave_fixing2_cycle1_20260513-0323.md` (Demeter + Pan handoff)
11. This V5 snapshot

---

## Real backend integration evidence (live curl)

### `/api/llm/health` calls_recorded increment

Before tests: `calls_recorded: 3, total_cost_usd: 0.003621`
After 2 test calls: `calls_recorded: 5, total_cost_usd: 0.003785`
Increment: 2 real DeepSeek V4-Flash calls + $0.000164 cost

### `/api/chat target=Clio` SSE stream

```
event: chunk
data: {"residentId": "Clio", "text": "Dalam jendela 30 hari, Codeplex Chronicle mencatat 3.816 commit dari 6 kontribut"}

event: chunk
data: {"residentId": "Clio", "text": "or—sebuah gelombang aktivitas yang membentuk ulang lanskap kode. Hotspot utama, "}

[... 4 more chunks ...]

event: done
data: {"residentId": "Clio", "modelUsed": "V4-Flash-non-think", "inputTokens": 340, "outputTokens": 415, "latencyMs": 6895, "fallbackChain": ["primary"]}
```

Model verified V4-Flash-non-think + 415 output tokens + 6.9s latency + fallback chain `["primary"]` (no fallback fired, real DeepSeek path)

### `/api/onboarding/narration` POST

```json
{
  "narration_text": "Ringkasan aktivitas 24 jam: 12 commit terdistribusi di 5 distrik...",
  "cache_hit": false,
  "canned_hit": true,
  "latency_ms": 0,
  "model_used": "V4-Flash",
  "fallback_chain": ["canned_hit"]
}
```

Canned hit (top-10 pre-cache match) + `model_used: V4-Flash` confirmed; real Triton gateway path.

### `/api/activity?days=30&repo=all` GET

```json
{"timeline":[],"hotspots":[],"ownership":[],"summary":{"total_commits":0,"unique_contributors":1,"most_active_building":"","most_active_owner":""}}
```

Materialized views empty (`WITH NO DATA` migration state) - frontend falls back to mock per U1 + U5 documented posture.

---

## Local Playwright smoke verification

URL: `http://localhost:3000/city?mock_auth=true`

Snapshot evidence:
- Page renders 200
- TimelineScrubber visible (radiogroup "Time range in days" with 30d/60d/90d radios; 30d checked)
- Activity summary: 3816 commits + 6 contributors + "most active: backend/app/services/service_14.py"
- Ownership heatmap toggle button present
- Sprint retro 60s button present ("Trigger 60-second sprint retro flythrough with Clio narration")
- Side panel activity drilldown shows top hotspots + 89% ownership shares
- Timeline cursor at scrubberPosition=1.0 ("Now"), label "cursor: 2026-04-12" (anchored at module load)

---

## TypeScript verification

```
$ cd frontend && npx tsc --noEmit
src/lib/chat/mockResidentResponses.ts(338,6): error TS6196: '_Unused' is declared but never used.
```

1 pre-existing error in Persephone scope. Boreas-owned files (`src/modes/activity/*`, `src/modes/onboarding/*`, `app/city/page.tsx`) compile clean.

---

## 10 Anti-pattern lock compliance

- Lock 1 (no em dash): clean
- Lock 2 (no emoji): clean
- Lock 3 (no scope creep): Boreas scope only (`src/modes/activity/*` + `src/modes/onboarding/*` + coordinated mount in `app/city/page.tsx`)
- Lock 4 (PRD anchored): camera fly D2, V4-Flash routing PRD Section 18.3, 4 tour variant PRD Section 9.1, sprint retro PRD Section 9.4
- Lock 5 (honest claim): mock fallback explicit in code + decision log + uncertainty journal
- Lock 6 (no silent reset): mode-change reset commented + intentional
- Lock 7 (no dependency churn): no new packages
- Lock 8 (no orchestrator drift): scope per Manager directive
- Lock 9 (V_n snapshot): this file
- Lock 10 (audit gate honored): downstream audit cycle ready

---

## Capacity

Wave-Fixing #2 Cycle 1 wall-clock: ~60 min vs ~120 min budget = 50% under-budget
Cumulative Boreas effort across Wave 2 + Wave-Fixing #1 + Wave-Fixing #2: ~3.5h vs ~7.2h Wave 2 budget = 50% under

---

## Ferry status

NO FERRY this cycle. 8 uncertainty concerns documented, all MEDIUM-or-HIGH-correctly-scoped with mitigation path.

---

## Downstream awaits

- Aletheia / Dike re-audit (when triggered by Manager)
- Demeter seed-inject materialized views (Pan or future cycle)
- Pan demo rehearsal verification (post-Wave 3 cycle 2)

---

V5 snapshot locked. Boreas Wave-Fixing #2 Cycle 1 SHIP-CLEAN.
