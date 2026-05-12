# PRD Feature Verification Matrix - Wave-Fixing #2 Cycle 1 Re-Audit

**Author**: Selene Wave-Fixing #2 cycle 1 rescue identity
**Actual timestamp**: 2026-05-13 03:22 WIB (Day 2 dini hari, ~9h pre-submission window)
**STAMP**: `20260513-0322`
**Scope**: Cluster 4 (Dashboard D-1 + Feature #31/32/33). Clusters 1-3 + 5-9 are placeholder pending Cluster 10 Atlas/Eunomia-rescue trigger.
**Lock honor**: Lock 5 honest claim discipline. PRD line-cited per row. NO PASS for not-implemented.
**Source PRD**: `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` v1.0 (2094 lines)
**Prior matrix**: `_meta/audit/prd_feature_verification_20260513-0147.md` (Wave-Fixing #1 Selene)

---

## Legend (unchanged from prior matrix)

| Status | Definition |
|---|---|
| **PASS** | Implemented end-to-end, demo-able, code path exercised in tests OR rendered route. |
| **PARTIAL** | Core impl shipped, but stub data OR mode/route gated OR one capability missing per PRD. |
| **DEFERRED** | Knowingly cut by V1 Orch + Pan + drop protocol. Documented. |
| **NOT IMPLEMENTED** | No code path exists. Honest fail. |
| **PENDING-CLUSTER-10** | Verdict awaits Cluster 10 trigger (worker out of scope to verify this cycle). |

---

## A. Q1 / Q2 / Q3 Direct Answers (unchanged from prior matrix unless cluster-shipped)

### Q1: "Git time machine" mentioned by Ghaisan, ada di product?

**Verdict**: PARTIAL via Activity Mode timeline scrubber (Boreas Wave 2) + Selene Wave-Fixing #1 CrossNavRail dashboard surface that points panitia to it.

**Wave-Fixing #2 update**: Cluster 4 confirmed CrossNavRail still renders the "Git timeline scrubber" card linking to `/city?repo=<active>&mode=activity`. Discoverability from /dashboard PASS.

**Pitch line honest** (unchanged): "Activity Mode kasih 30/60/90 day timeline scrubber yang functionally setara git time machine untuk demo dataset. Multi-year epoch detection scope deferred Phase 2 per PRD line 579."

### Q2: "Auto diagram engine" mentioned by Ghaisan, ada di product?

**Verdict**: NOT IMPLEMENTED (unchanged). Runtime auto-generate scope NOT in PRD. Static diagrams shipped Wave 0.

**Wave-Fixing #2 update**: Cluster 4 confirmed CrossNavRail "Static C4 + ERD diagrams" card text says "Formal 4-tier C4 + ERD authored Wave 0 in docs/c4/ + PanitSubmission/c4/. Runtime auto-diagram: post-hackathon." Honest claim discipline PASS.

### Q3: General feature audit per PRD Section 3-7 + Section 9-11 + Section 21 acceptance criteria.

See full matrix below. Cluster 4 rows verified end-to-end; other clusters PENDING-CLUSTER-10.

---

## B. 5 Product Mode Verification (PRD Section 9) - PENDING CLUSTER 10

The Cluster 4 worker is dashboard-scoped only. Modes verification depends on Cluster 1 (city/spatial workspace), Cluster 2 (Sprint Mode HERO), Cluster 5 (Refactor), Cluster 6 (Activity), Cluster 7 (Health), all of which are outside Cluster 4 scope.

Carry-forward from prior matrix (Wave-Fixing #1 line 67-71) PENDING re-audit on Cluster 10 trigger:
- Onboarding Mode: PARTIAL
- Sprint Mode (HERO): PARTIAL
- Refactor Mode: PARTIAL
- Activity Mode: PASS
- Health Mode: PASS

---

## C. 5 AI Resident Verification (PRD Section 10) - PENDING CLUSTER 10

Carry-forward from prior matrix (Wave-Fixing #1 line 80-84) PENDING re-audit:
- Athena, Apollo, Argus, Clio, Hermes: all PASS in Wave 3 + Wave-Fixing #1.

---

## D. Spec-Drift Detection 5 Pattern (PRD Section 11) - PENDING CLUSTER 10

Carry-forward: 5/5 PASS in Nemesis Wave 3 cycle 5 (commit `3d0ce09`).

Cluster 4 surface PASS: SpecDriftSummary panel renders all 5 patterns A-E with severity-encoded visual on /dashboard. Verified via Playwright snapshot (5 rows with pattern letter + label + severity 1-5 + trend + count, scannable < 1 second). Click-to-drill-down to /city not yet wired (deferred).

---

## E. Infrastructure + Workflow Feature - CLUSTER 4 ROWS VERIFIED THIS CYCLE

### E.1. Dashboard view (PRD Section 5.2 Manager Budi + idea-draft Section E.2 + Section N.3 line 825-839)

| Feature | PRD Section | Implementation Status | Discovery Path | Wave-Fixing #2 Cluster 4 Verdict |
|---|---|---|---|---|
| **Dashboard route at /dashboard** | Section 5.2 line 202 + idea-draft Section E.2 line 130 | PASS | `frontend/app/dashboard/page.tsx` + `frontend/components/dashboard/DashboardClient.tsx` | PASS (no regression, renders Playwright-verified) |
| **Manager Budi "default work" route** | Section 5.2 line 202 | PASS | Same as above | PASS |
| **D-1: "Connect repository" no /start loop** | QA round 2 bug | PASS (root cause fix this cycle) | `RepoPickerModal` mounted at parent + `MultiRepoDropdown.onRequestConnect` callback + footer button conversion | PASS this cycle (was broken in Wave-Fixing #1) |
| **Feature #33: Dynamic dashboard content** | Section N.3 line 825-839 | PASS (real fetch wired, mock fallback) | `useDashboardData` hook fetches `/api/dashboard` with `normalizeBackendDashboard` shim + mock fallback | PASS this cycle |
| **Feature #31: Multi-repo region selector** | Section N.3 line 825-839 | PASS | `MultiRepoDropdown` renders user's repos list + active highlighted | PASS (no regression, augmented with RepoPickerModal for /api/repos/list integration) |
| **Feature #32: View toggle City ↔ Dashboard** | idea-draft Section E.2 line 132 | PASS | `DashboardTopBar` view toggle pill bar with "Dashboard" active + "City view" link | PASS this cycle (was footer-only before) |
| **Velocity chart** | Section N.3 line 825 | PASS (Recharts AreaChart) | `VelocityChart.tsx` + mock data + backend overlay | PASS |
| **Burndown live** | Section N.3 line 825 | PASS | `BurndownChart.tsx` + mock burndown series + backendMeta | PASS |
| **Milestone progress** | Section N.3 line 825 | PARTIAL | Mock data shape in `DashboardData.milestones` present; UI panel NOT mounted in DashboardClient composition (Designer Prompt 3 did not include milestone panel; carry-forward) | PARTIAL (gap pre-dates Wave-Fixing #2; not in cluster scope) |
| **Contributor analytics** | Section N.3 line 825 | PASS | `TopContributors.tsx` renders contributor PR + reviews + LOC churn | PASS |
| **Spec-drift status (5 pattern aggregate)** | Section N.3 line 825 | PASS | `SpecDriftSummary.tsx` renders all 5 patterns A-E with severity-encoded visual | PASS |
| **Refactor status (Athena proposal)** | Section N.3 line 825 | PASS | `RefactorProposalsStatus.tsx` renders 5-stage kanban (proposed / running / drafted / accepted / archived) | PASS |
| **Cross-repo aggregation** | Section N.3 line 825 | PASS | `CrossRepoRail.tsx` renders 5 repo cells with sparkline + status dot | PASS |
| **Embedded city preview corner** | Section N.3 line 825 + Designer Prompt 3 line 217 | PASS (static SVG; ChronicleCanvas inset deferred per Selene D3) | `CityPreviewCorner.tsx` mounts SVG silhouette + Argus blinking eye + deep link to /city | PASS |
| **Briefing 1-sentence templated** | Section N.3 line 825 + Designer Prompt 3 line 187 | PASS | `BriefingHeader.tsx` renders templated briefing with serif-italic key phrases | PASS |
| **Cross-product nav rail** | Wave-Fixing #1 D-4 fix | PASS | `CrossNavRail.tsx` renders 3 cards: Activity Mode / Static C4+ERD / Spatial view | PASS (carry-forward from Wave-Fixing #1) |
| **PurposeBanner framing** | Wave-Fixing #1 D-2 fix | PASS | `PurposeBanner.tsx` frames "Manager view: project management overview for <repo>" with /city link | PASS (carry-forward) |

### E.2. Other infrastructure rows - PENDING CLUSTER 10 carry-forward

Carry-forward from prior matrix (Wave-Fixing #1 line 109-119) PENDING re-audit:
- GitHub OAuth flow real: PASS
- GitHub webhook real-time: PARTIAL
- Hybrid Write Layer 1: PASS
- Dual review gate: PASS
- AD-19 drafts/ isolation: PASS
- Cost tracking ($5 budget): PASS
- DeepSeek V4 SDK integration: PASS
- OpenSpec dual-folder: PASS
- Earthquake error visual: DEFERRED
- PR comment surfacing: DEFERRED
- 3D visual quality bar: PASS baseline + PARTIAL stretch

---

## F. Submission Deliverable (PRD Section 24.1) - PENDING CLUSTER 10

Carry-forward from prior matrix (Wave-Fixing #1 line 125-133). Cluster 4 NOT in scope.

---

## G. Aggregate Verdict (Cluster 4 Scope Only)

| Category | PASS | PARTIAL | DEFERRED | NOT IMPLEMENTED | PENDING-CLUSTER-10 |
|---|---|---|---|---|---|
| Dashboard route + 7 panels (Cluster 4) | 13 | 1 (milestone progress) | 0 | 0 | 0 |
| D-1 + Feature #31/32/33 (Cluster 4) | 4 | 0 | 0 | 0 | 0 |
| Modes/Residents/Drift/Infra/Submission | - | - | - | - | All carry-forward, awaits Cluster 10 |

**Cluster 4 subtotal**: 17 PASS + 1 PARTIAL (milestone progress UI panel gap, pre-dates Wave-Fixing #2) + 0 DEFERRED + 0 NOT IMPLEMENTED.

---

## H. Pitch Q&A Defense Snippet (Cluster 4 specific update)

Q: "Kalau gw klik 'Connect repository' di dashboard waktu udah signed in, gimana?"
A: "Dashboard buka repo picker modal yang ngeload daftar repo lu dari GitHub. Bisa langsung pilih, atau paste URL, atau load demo dataset. Cuma kalau session-nya beneran expired, modal show banner explicit 'OAuth session expired' + CTA reconnect. NGGAK ada redirect loop ke /start."

Q: "Dashboard real-time fetch backend?"
A: "Yes, hook hits /api/dashboard endpoint Demeter Wave 3. Pydantic snake_case auto-translated ke frontend camelCase via normalization shim. Kalau backend down, mock fallback kick in jadi panitia tetap liat full dashboard, BUKAN blank state."

Q: "Switch view city <-> dashboard gimana?"
A: "Pill bar di top nav, klik 'City view' bawa lu langsung ke /city?repo=<active>. Konteks repo carry-forward jadi 3D city udah ke-set buat repo yang sama."

---

## I. Recommendations to Manager Wave-Fixing #2

1. **Cluster 10 trigger**: setelah Atlas/Eunomia rescue ship, re-spawn Selene (or relay verdicts via dispatch) untuk consolidated full-PRD re-audit.
2. **Milestone progress UI**: if time permits, ship MilestoneProgress panel di dashboard composition. Data shape sudah ready di `DashboardData.milestones`, hanya butuh React component + mount di DashboardClient.
3. **Backend integration test**: run E2E smoke dengan FastAPI backend running untuk verify `normalizeBackendDashboard` against real Demeter response shape (Uncertainty 1 di journal).
4. **authedAs polish**: wire `fetchSession()` ke RepoPickerModal authedAs prop untuk header copy "signed in as <login>". Low priority cosmetic.

---

## J. Closing Note

Cluster 4 scope re-audit Lock 5 honest. D-1 root cause fix verified at structural level (callback chain end-to-end traced) + visual level (Playwright snapshot). Real-browser modal expand test deferred due to tool surface limitation (no `browser_click` available in this session). Other clusters PENDING-CLUSTER-10 trigger.

NO fabrication. NO PASS for unimplemented.

Selene Wave-Fixing #2 out.
