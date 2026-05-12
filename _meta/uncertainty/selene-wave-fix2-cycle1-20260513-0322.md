# Selene Wave-Fixing #2 Cycle 1 Uncertainty Journal

**Author**: Selene Wave-Fixing #2 cycle 1 rescue identity
**Actual timestamp**: 2026-05-13 03:22 WIB (Day 2 dini hari)
**STAMP**: `20260513-0322`
**Confidence level**: medium-high (proceeded under)

---

## Uncertainty 1: backend not running during smoke test

**Concern**: I executed Playwright smoke test against the dev server at `localhost:3000` while the FastAPI backend at `localhost:8000` was not running. The dashboard fetch logged 2 console errors (404 on `/api/dashboard?range=...`) but the mock fallback kicked in and the UI rendered all 7+ panels correctly.

**Risk**: I have NOT verified the `normalizeBackendDashboard` function against a real backend response. The Pydantic shape derivation is based on reading `backend/app/services/dashboard_query.py` (DashboardData model + KPIMetric + VelocityPoint + etc.) but the actual JSON output could differ if FastAPI applies any response transformer in middleware.

**Mitigation**: The function is a best-effort overlay; on field absence it preserves the mock value. The fetch wrapper falls back to mock on any failure including shape mismatch (returns null from normalizer). So worst case = mock data rendered (same as before this cycle).

**Decision**: Proceed. Real backend integration test deferred to a later cycle that has the backend up. Lock 5 honest disclosure: ship claim is "frontend integration WIRED + mock fallback ALWAYS SAFE", NOT "real backend response validated end-to-end".

---

## Uncertainty 2: `authedAs` modal header is empty

**Concern**: The `RepoPickerModal` accepts `authedAs?: string` for the header "signed in as <login>" copy, but `DashboardClient` passes `undefined` because I avoided coupling to `frontend/lib/auth.ts` `fetchSession()` to keep the modal mount path simple. The modal header falls back to "connect a repository" which is correct but less informative.

**Risk**: Cosmetic only. The OAuth chain is fully wired (Hades + Hestia), session JWT is the source of truth, and the modal still functions correctly via the 401 branch.

**Mitigation**: Pulled from scope. Future cycle can `import { fetchSession }` and wire `useEffect` to populate `authedAs` if Manager flags this as user-visible regression.

**Decision**: Proceed without session fetch. Document the gap.

---

## Uncertainty 3: dropdown trailing item visual regression

**Concern**: Wave-Fixing #1 used an `<a>` element styled as a menu item. Wave-Fixing #2 wraps a `<button>` styled to look identical when `onRequestConnect` is wired. There may be subtle visual drift (focus ring, hover state) between the anchor styling and the button styling.

**Risk**: Low. I applied inline style overrides (`width: 100%`, `textAlign: left`, `cursor: pointer`, `font: inherit`) to match the anchor's natural inline behavior inside the menu container. The `.menuItem` class hover state still triggers via the existing `:hover` rule.

**Mitigation**: Verified via real-browser Playwright snapshot that dashboard renders cleanly. The dropdown trigger button itself wasn't expanded during test (no click tool surface available); a manual demo verification is recommended.

**Decision**: Proceed. Pan post-Wave-Fixing visual sweep can flag if any regression.

---

## Uncertainty 4: PRD matrix re-author scope

**Concern**: Manager dispatch line 8 says "PRD matrix re-author honest verdict per Q1/Q2/Q3 post Cluster 1-9 ship". I have visibility into my cluster (Cluster 4) but limited visibility into Clusters 1-3 + 5-9 outcomes. Risk: re-authoring the matrix with stale or speculative cluster status.

**Risk**: Medium. Manager dispatch said "Cluster 10 Atlas/Eunomia-rescue will trigger your re-audit". This suggests I should prepare a TEMPLATE re-author scaffolded for the cluster outcomes but NOT publish a final verdict until Cluster 10 trigger fires.

**Mitigation**: I will scaffold the re-author template in a new file `_meta/audit/prd_feature_verification_20260513-0322.md` with cluster-status placeholders + my own cluster verdict, and explicitly mark the document as "Cluster 4 only re-audit; Clusters 1-3 + 5-9 verdicts await Cluster 10 trigger".

**Decision**: Author Cluster 4 scope only + template structure for Cluster 10 to fill in. Lock 5 honest discipline.

---

## Confidence reasoning

Confidence level: medium-high.

- High confidence on: D-1 fix (modal session-aware, correct 401 -> /start only branch), Feature #32 view toggle (verified rendering), Feature #33 fetch + fallback (verified mock works on backend-down).
- Medium confidence on: real backend shape match for normalizeBackendDashboard (unverified end-to-end), authedAs cosmetic gap (low risk).

No ferry trigger fired. Proceed conservative.
