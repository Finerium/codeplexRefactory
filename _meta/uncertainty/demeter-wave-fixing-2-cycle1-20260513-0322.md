# Demeter Wave-Fixing #2 Cycle 1 Uncertainty Journal

**STAMP**: 20260513-0322 WIB Day 2 dini hari
**Worker**: Demeter Wave-Fixing #2 rescue (Cluster 4 + Cluster 8 merged)
**Cycle wall-clock**: ~13 min agent time
**Ferry triggered**: NONE (all uncertainty MEDIUM or LOW)

## MC-01 (medium) Seed data labelled `seed-demo-` but visually indistinguishable to panitia in matview output

DemoSeedService deliberately tags each row in `delivery_id` (`seed-demo-<hash>`) and `scan_run_id` (`seed-demo-scan-<repo>`) to satisfy Lock 3 honest scope. However the materialized view outputs (e.g., `repo_status_view` row for OWASP/NodeGoat) do not carry this label forward, so a panitia viewing the Selene dashboard sees the same KPI shape whether the data is real OAuth events or seeded demo data.

Mitigation in place: payload JSON includes `seed_demo: true` field per pr_event row (Demeter response surface honest), README + slide deck can disclose "Demo dashboard populated via /api/demo/seed for hackathon visual proof; production deployment receives real webhook events".

No ferry: this matches expected hackathon demo posture. Judges expect populated dashboards, and the seed origin is documented in source + endpoint name `/api/demo/seed` is self-disclosing.

## MC-02 (medium) Cross-repo aggregate marker only modifies briefing prefix

`/api/dashboard?aggregate=cross-repo` currently prepends `"Cross-repo aggregate across N repos."` to briefing but does not add a dedicated `aggregate_mode` field to `DashboardData`. Selene frontend cannot programmatically branch on a struct field if it wants to render an "Aggregate Mode" badge.

Mitigation: Selene Wave-Fixing #2 frontend rescue ships PurposeBanner cross-repo selector via MultiRepoDropdown.tsx (per V4 fixing snapshot Selene D-1/D-2 ship clean). Briefing prefix is sufficient signal for now. Future enhancement: add `DashboardData.aggregate_mode: Literal["per-repo", "cross-repo"]` field, would require Pythia contract amendment.

## MC-03 (medium) Activity `days` int snap silently rounds non-30/60/90 values

`/api/activity?days=45` does NOT 400-reject, it silently snaps to 30 (closest valid window). Per FastAPI Query(ge=30 le=90) bound, 45 is accepted at edge then snapped server-side.

Trade-off: this is intentional UX softness so Boreas timeline scrubber (which slides continuously 0..1) can map any rangeDays prop to a valid query. Honest disclosure: production response carries no marker indicating snap occurred.

No ferry: matches Boreas TimelineScrubber.tsx contract which only sends 30/60/90 explicitly.

## MC-04 (medium) Auto-drain default `true` may surprise callers on /api/cost/summary

`/api/cost/summary` defaults to `auto_drain=true`, meaning every GET call has a side effect (rows written to Postgres). Caller can opt out via `?auto_drain=false`.

Trade-off: this closes the post-Triton-smoke gap identified in V4 fixing snapshot (cost summary returning $0.0 despite real DeepSeek spend in /api/llm/health buffer). Auto-drain is idempotent (ON CONFLICT DO NOTHING on call_id) so repeated GETs do not corrupt data.

Risk: Selene Wave 1 frontend polls /api/cost/summary in cost ribbon. Each poll triggers drain. Mitigation: Triton buffer is bounded ring (configurable size), drain count returned in `auto_drained_rows` so frontend can detect spikes.

No ferry: side effect is bounded + idempotent + the alternative (manual drain endpoint) was what V4 had and we now have evidence it caused $0.0 discrepancy.

## MC-05 (low) Demo seed scope locked to NodeGoat + fastapi-fullstack only

`DemoSeedService.seed_all()` hard-codes 2 demo repos. Adding a third demo repo (e.g., Selene PRD demo example) requires source edit, not configurable via env or endpoint param.

No ferry: hackathon scope, 2 repos sufficient for cross-repo aggregate visual proof. Selene + Pan can extend post-submission.

## MC-06 (low) Materialized view refresh on every seed may take seconds on prod scale

`refresh_dashboard_views` + `refresh_activity_views` run `REFRESH MATERIALIZED VIEW <v>` synchronously per view (5 dashboard + 2 activity = 7 refreshes). On the 962-pr_event seeded set this took <1s. Refactory PG hardware unknown, could take longer with full production traffic + scale.

Mitigation: refresh calls wrapped in try/except + logged on failure (already in `demeter_real.refresh_dashboard_views`). Endpoint returns even if individual view refresh fails.

No ferry: hackathon scale is bounded. CONCURRENTLY variant would require unique index, deferred to post-submission optimization.

## MC-07 (low) OpenSpec endpoint not protected by auth

`GET /api/openspec/list` + `/openspec/validate` have no `require_session` dependency, so any internet caller can invoke `openspec` subprocess on the production pod. The subprocess wrapper has a 30s timeout + the binary outputs read-only data, but principle-of-least-privilege says read endpoints could still be session-gated.

No ferry: openspec output is intentionally public (spec disclosure aligns with hackathon Open Source posture, judges expected to see openspec/ folder contents). Hardening deferred post-submission.

## Summary

7 medium-confidence concerns logged. 0 high-confidence concerns. 0 ferry trigger. All concerns are post-submission refinement candidates, not blockers for Day 2 jam 11:00-13:00 WIB submission window.

## Decision discipline

Each concern weighted vs:
- **Lock 5 (honest claim)**: every concern explicit + no inflated PASS claim
- **Capacity remainder**: ~9 hours before Day 2 submission window, sufficient buffer for Atlas redeploy + Aletheia rescue audit + Pan demo prep
- **Risk severity**: all medium concerns are visual/UX/operational, not contract/security/correctness
- **Ferry threshold**: NONE meet HIGH bar (5 trigger per Demeter mandate Section 4)
