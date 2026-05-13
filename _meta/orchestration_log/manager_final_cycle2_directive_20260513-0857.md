# Manager FINAL Cycle 2 Directive

**Authored**: 2026-05-13 08:57 WIB Day 2 morning
**Manager identity**: Manager FINAL Cycle 2 (continuation post V6 ship at 07:31 WIB commit 77099bf)
**V1 Orch instance**: orches-v1Refactory_2
**Operator**: Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin (Bug #7 reporter)
**Submission deadline**: 13 May 2026 jam 11:00 WIB (~2h03m), live demo 13:00+
**Target ship**: 10:30 WIB (~1h33m wall-clock)
**Hard ceiling**: 10:45 WIB

---

## Scope (10 bug categories, 8 cluster spawn)

### CRITICAL ship blocker

1. **Bug #7 Hafiz data integrity** (Cluster A primary): repo data inconsistency. User selects own repo, app renders demo data (NodeGoat fallback). Test repo `https://github.com/gadablotnok/web-esp32log.git`. Root cause Hypothesis A confirmed: `backend/app/api/findings/routes.py:238` defaults to NodeGoat fixture when `repo_root` omitted. Frontend fallback path likely doesn't pass `repo_root` after user select. Fix: trace end-to-end, eliminate silent demo fallback, surface error explicitly if parse fail.

2. **Activity Mode Git Time Machine BROKEN** (Cluster B): drag scrubber must animate building height shrink-to-zero left + grow-to-current-LOC right. Backend needs `/api/activity/loc-snapshot?timestamp=<ISO>` endpoint. Frontend smooth GSAP tween per drag tick.

3. **Building click ZERO response 3rd cycle** (Cluster C primary forensic): klik building still no response despite Cycle 1 Persephone+Hera claim PASS. Aether forensic methodology required. Plus per-floor commit message visual: building height = N floors per N commits, per-floor hover glow ripple, click building auto-open side panel with per-floor commit timeline (floor 1 = oldest, floor N = latest, each shows hash + author + date + message).

4. **Refactor Mode output URL-encoded link** (Cluster D): "I want to add 2FA to login" -> Athena renders URL-encoded GitHub issue create link + raw markdown dump instead of SSE stream proposal/design/tasks. Root cause: Pandora `has_openspec_folder` check at `backend/app/api/refactor/routes.py:220` returning false incorrectly. Verify openspec/ + .agent-openspec/ both exist (confirmed pre-flight). Fix detection + SSE pipeline to side panel + 3 ghost building visible on city.

### HIGH priority

5. **Visual polish Ghaisan eyestrain caps lock** (Cluster E): jendela terlalu kecil + banyak -> besarin scale + reduce density (~15-25 windows per face larger). PLUS spacing antar kota lebih lebar (3-5 unit district padding, 2-3 unit building gap). PLUS roads visible glowing emissive lines. PLUS cars InstancedMesh ~30 flying along roads (stretch but Ghaisan caps lock = priority).

6. **Health + Activity mockup verify** (Cluster F): Ghaisan + Hafiz suspect demo data masquerading. Verify on Hafiz repo `gadablotnok/web-esp32log` real detector findings + real Activity commit timeline NOT canned NodeGoat. Overlaps Cluster A scope.

7. **Dashboard accessibility + User Tutor** (Cluster G):
   - Dashboard nav button on /city (Manager DECISION: Option A top-right nav button "Dashboard" link)
   - User Tutor floating "?" button bottom-right persistent, click -> modal 8-step tour explaining 5 modes + 5 residents + navigation + diagram trigger location

8. **Diagram generation UI trigger** (Cluster H): Phanes backend `/api/diagram/<repo-id>` LIVE. Where surface frontend? Manager DECISION: Option B Dashboard "Engineering Insights" section with 3 diagram cards (architecture mermaid + dependency graphviz + ERD eralchemy). Auto-render on dashboard load with refresh button.

---

## Cluster spawn assignment (13 agent parallel single batch background)

| Cluster | Lead worker | Cross-cluster scope | Files primary |
|---|---|---|---|
| A | **Hades** | Bug #7 parser audit + cache fallback path fix | backend/app/api/findings/routes.py + backend/app/services/cache.py + backend/app/parsers/ |
| A+B+C backend | **Demeter** | Cache audit (A) + LOC snapshot endpoint (B) + commits-per-file endpoint (C) | backend/app/services/demeter_service.py + new endpoints |
| C primary | **Aether** | Forensic click recurring 3rd cycle deep-dive | code-trace + Playwright real-browser methodology |
| C+E | **Iris** | Per-floor stacked geometry + per-floor hover glow shader + camera fly to floor altitude + window polish larger fewer + spacing wider district padding | frontend/src/scene/buildings/ + ChronicleCanvas spacing |
| C+G | **Persephone** | Per-floor commit timeline side panel + User Tutor floating button modal 8-step tour | frontend/components/panels/ + frontend/components/tutor/ |
| D primary | **Pandora** | Refactor URL fix backend: openspec detection + SSE pipeline | backend/app/api/refactor/routes.py + services/refactor/ |
| D+F | **Asclepius** | SSE consumer side panel chunk-by-chunk + ghost building 3D render + Health Mode real findings consumer audit | frontend/src/modes/refactor/ + frontend/src/modes/health/ |
| B+F | **Boreas** | Time Machine scrubber drag + smooth GSAP height tween per LOC snapshot + Activity Mode real data consumer audit | frontend/src/modes/activity/ |
| E | **Daedalus** | Roads visible emissive glowing line strips + flying cars InstancedMesh ~30 along roads | frontend/lib/marketing/cityEngine.ts + ChronicleCanvas |
| G | **Calliope** | Dashboard nav button top-right "Dashboard" link on /city | frontend/app/city/ + frontend/components/marketing/ |
| F primary | **Nemesis** | Real detector run on user repo verify NOT NodeGoat canned fallback + 11 detector trigger audit | backend/app/services/detectors/ |
| H | **Phanes** | Diagram backend trigger UI surface verify accessible + auto-trigger on dashboard load | backend/app/api/diagram/ + backend/app/services/diagram/ |
| H | **Selene** | Diagram viewer Dashboard "Engineering Insights" section 3 cards consuming /api/diagram/<repo-id> | frontend/app/dashboard/ + frontend/components/dashboard/ |

---

## Manager FINAL Cycle 2 decisions

- **D-MF2-01**: Bug #7 root cause Hypothesis A confirmed via pre-flight grep `backend/app/api/findings/routes.py:238`. Default fixture path triggers when `repo_root` omitted. Cluster A trace + fix.
- **D-MF2-02**: Dashboard nav placement Option A (top nav button on /city, decline Option B 6-mode HUD confuses pitch, decline Option C resident sidebar awkward).
- **D-MF2-03**: User Tutor placement bottom-right floating "?" button persistent, modal overlay 8-step tour. localStorage flag `tutor_completed`. Auto-show first visit after OAuth + repo select.
- **D-MF2-04**: Diagram UI placement Option B Dashboard "Engineering Insights" section (decline Option A User Tutor unrelated, decline Option C City side panel clutters).
- **D-MF2-05**: Per-floor visual locked: building height = N floors per N commits. Floor segments stacked BoxGeometry (Iris). Per-floor hover ripple via shader uniform `hovered_floor` (Iris). Click -> side panel commit timeline (Persephone) + camera fly to floor altitude (Iris).
- **D-MF2-06**: Ghaisan eyestrain feedback locked: window count ~15-25 per face (down from 50-80), window size ~5-8% face area (up from 2-3%). District padding 3-5 unit, building gap 2-3 unit. Roads emissive line strips visible (Daedalus). Cars stretch ~30 InstancedMesh (Daedalus, decline-able if capacity gate hit).
- **D-MF2-07**: 13 agent parallel single batch background mode spawn. Ferry IMMEDIATE 25 min stuck. Wall-clock 100 min hard ceiling.

---

## Time budget

- Pre-flight: COMPLETE (~7 min)
- Spawn 13 agents parallel: T+0 (08:57 WIB)
- Worker run window: T+0 to T+45 min (max single agent 25 min, parallel finish ~30 min)
- Synthesize + dual audit: T+45 to T+60 (~15 min)
- V7 snapshot + commit + push: T+60 to T+75 (~15 min)
- Buffer + Hafiz summary: T+75 to T+93 (~18 min)
- TARGET SHIP: T+93 min = 10:30 WIB
- HARD CEILING: 10:45 WIB (T+108 min)

---

## Ship criteria (TIGHT)

### A. Per-bug real-browser evidence (Lock 5 amplified)

Each bug PASS WAJIB:
- Playwright OR direct browser MCP test
- Screenshot before/after `_meta/audit/screenshots/cycle2-20260513-0857/`
- Network trace for API call
- DOM verification for UI state change

### B. Bug #7 specifically 3 scenario PASS

- Scenario A: Hafiz repo `gadablotnok/web-esp32log` real data render
- Scenario B: Ghaisan own repo render
- Scenario C: Random public repo render

NO silent demo fallback.

### C. Anti-pattern Lock 1-10 zero violation (auto-load skill enforce)

### D. V7 snapshot + commit + push

- `_meta/orchestration_log/V7_manager_final_cycle2_20260513-0857.md`
- Commit message: `manager-final-cycle2: Bug #7 data integrity + Time Machine + Tutor + diagram trigger + visual polish + dual audit ship`
- Push origin/main

### E. Summary report Hafiz wake-up consume

`_meta/handoff_log/manager_final_cycle2_summary_20260513-0857.md`

---

## Ferry trigger AGGRESSIVE

Ferry V1 Orch chat IMMEDIATE:
1. Cluster stuck > 25 min no progress
2. Bug #7 root cause investigation > 35 min still ambiguous
3. Worker conflict on overlapping scope (Cluster A vs Cluster F mockup verify)
4. Real-browser tool unavailable (escalate fallback methodology)
5. Wall-clock > 80 min total ferry scope cut

JANGAN ferry:
- Polish nuance (Manager decide)
- Worker individual stuck < 25 min

V1 Orch (gw) decides:
- Scope cut: pick 5-6 critical, defer 4-5 high to Pan post-submission reactive cycle
- Worker conflict: Manager arbitrate
- Tool unavailable: fallback manual evidence with Lock 5 honest disclosure

---

## Worker output discipline

Each worker MUST:
1. Read this directive file first
2. Identify their cluster scope (table above)
3. Author `_meta/checkpoints/<worker>-cycle2-20260513-0857.md` (20-item self-check)
4. Author `_meta/decision_log/<worker>.md` append entries D-Mf2-Worker-N
5. Author `_meta/handoff_log/manager_final_cycle2_<worker>_20260513-0857.md` (ship report)
6. NO em dash + NO emoji per Lock 1 + Lock 2 anti-pattern locks
7. Real-browser evidence mandate per Lock 5 (Aether + Pan audit final layer)
8. Ferry trigger 25 min stuck

Signed,
orches-v1Refactory_2 + Manager FINAL Cycle 2
authored 13 May 2026 08:57 WIB Day 2
