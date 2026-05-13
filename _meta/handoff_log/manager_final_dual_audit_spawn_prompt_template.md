# Aether + Pan Dual Audit Spawn Prompt Template (Manager FINAL Wave-Fixing 3 Cluster 15)

To be dispatched AFTER Cluster 14 Atlas redeploy completes. Aether + Pan run in parallel, cross-check verdict matrix.

## Aether final audit prompt (general-purpose)

```
You are AETHER (Manager FINAL Wave-Fixing 3 auditor identity). Cycle 15 dispatch is your FINAL DUTY: dual independent audit with Pan.

PROJECT: Codeplex Chronicle hackathon `/Users/ghaisan/Documents/codeplexRefactory`. Refactory Round 03 Day 2 submission window 11:00-13:00 WIB.

CONTEXT: Manager FINAL ship complete:
- Dockerfile + ConfigMap NEXT_PUBLIC_API_URL fixed (mass-bug root cause)
- 10 worker cluster batch shipped (Aether forensic + Iris+Daedalus visual + Persephone+Hera building click + Hestia build-scratch+demos + Pandora Refactor + Asclepius+Nemesis Health + Boreas+Demeter Activity + Selene Dashboard + Calliope Landing + Triton chat-helper)
- Atlas redeploy cycle 3 complete (image SHA new, smoke 3x PASS)

YOUR FINAL DUTY (Cluster 15 of 16):

Real-browser audit per bug per Manager FINAL directive Section 11.A.

Coverage 17 bug (9 CRITICAL + 8 HIGH):
- T-1 chat 404
- E-4 repos 404
- B-1 building click
- E-5 build scratch
- E-6 demo dataset
- R-1 refactor no-op
- HEALTH-MOCK
- DASHBOARD-MOCK
- LANDING-BUTTON
- C-2 window glow
- C-2 spacing
- TREE-PLACEMENT
- SKYSCRAPER-HEIGHT
- ACTIVITY-SCRUBBER-UX
- ACTIVITY-CARD-LAYOUT
- PER-FLOOR-COMMIT
- C-VISUAL-AUDIT-ROOT-CAUSE

Per-bug verdict explicit:
- PASS = real-browser flow success + DOM evidence + network 200 + visual match
- DEFERRED = explicit ferry log entry with reason + capacity tradeoff
- FAIL = blocker doc + ferry V1 Orch chat

Methodology MANDATORY:
- Start frontend dev `cd frontend && npm run dev` background
- Navigate http://localhost:3000 via Playwright `mcp__playwright__browser_navigate`
- Click + Type + Drag via real interaction
- Screenshot evidence saved to `_meta/audit/screenshots/aether_final_<STAMP>/`
- Network trace + console error monitor

For ROOT-CAUSE-PRE-FIXED bugs (T-1/E-4/R-1/D-1), verify Atlas redeploy actually flipped:
- POST /api/chat real SSE response (not 404)
- GET /api/repos/list 401 or 200 (not 404)
- POST /api/refactor/simulate drafts/<sim-id>/ write
- Dashboard "Connect repository" no redirect loop

For VISUAL bugs (C-2/TREE/SKYSCRAPER/PER-FLOOR), verify visual match against idea-draft H.2 baseline.

For NEW UX bugs (ACTIVITY-SCRUBBER/CARD-LAYOUT), verify Boreas integrated card + scrubber drag + commit popup.

For BACKEND-MOCK suspect (HEALTH/DASHBOARD), verify real data fetch + Convert-to-Ticket real GitHub issue created + Dashboard data from real Postgres query.

For LANDING-BUTTON, verify "view the residents" onClick handler functional (scroll/modal/navigate).

OUTPUT (mandatory):
1. `_meta/audit/aether_final_audit_<STAMP>.md` (per-bug verdict matrix + evidence trail)
2. `_meta/audit/screenshots/aether_final_<STAMP>/` (real-browser screenshot evidence)
3. Aether decision log append + checkpoint + handoff to Manager FINAL

DELIVERABLE: summary message with:
- Aggregate verdict counts (PASS / DEFERRED / FAIL / NOT-IMPLEMENTED)
- Per-bug verdict matrix
- Cross-check vs Pan secondary audit (post-Pan-completion)
- Ship verdict for V6 lock (PASS = ship, FAIL = ferry)

ANTI-PATTERN: NO em dash, NO emoji, Lock 5 AMPLIFIED. Honest claim or DEFERRED label.

Time budget: max 90 min. Ferry V1 Orch ONLY if methodology entirely blocked.

GO.
```

## Pan secondary audit prompt (subagent_type=pan)

```
CYCLE Wave-Fixing 3 Manager FINAL Cluster 15B. You're Pan dispatched for SECONDARY DUAL AUDIT paired with Aether (primary).

PROJECT: Codeplex Chronicle hackathon `/Users/ghaisan/Documents/codeplexRefactory`. Day 2 submission window 11:00-13:00 WIB.

Manager FINAL complete:
- Dockerfile + ConfigMap mass-bug fix shipped
- 10 worker cluster batch shipped
- Atlas redeploy cycle 3 complete

Aether primary audit running parallel. Your role: INDEPENDENT cross-check fresh perspective.

YOUR DUTY:
- Real-browser sweep ALL 5 mode + Landing + Entry + Dashboard + OAuth + 3 demo + Build from scratch
- Independent verdict per bug (Pan's own judgment, not Aether's)
- Surface bugs Aether missed (different methodology angle)
- Cross-check verdict discrepancy

Methodology MANDATORY:
- Playwright real-browser via local dev `cd frontend && npm run dev`
- Screenshot evidence saved `_meta/audit/screenshots/pan_final_<STAMP>/`

OUTPUT:
1. `_meta/audit/pan_final_audit_<STAMP>.md` (per-bug verdict matrix)
2. Pan decision log + checkpoint + handoff to Manager FINAL

DELIVERABLE: summary with:
- Aggregate verdict counts
- Per-bug verdict matrix
- Cross-check delta vs Aether (highlight discrepancy)
- Ship verdict

Time budget: max 90 min. Ferry V1 Orch ONLY if blocked.

GO.
```

## Dispatch pattern

Spawn BOTH Aether (general-purpose) + Pan in single message, both run_in_background=true. Wait for both to complete. Then Manager FINAL integrates verdict.

## Cross-check verdict matrix template

| Bug ID | Aether verdict | Pan verdict | Discrepancy | Manager FINAL ship verdict |
|---|---|---|---|---|
| T-1 | [P/D/F] | [P/D/F] | [Y/N] | [Ship/Ferry] |
| E-4 | ... | ... | ... | ... |
| ... | | | | |

Discrepancy = Y → ferry V1 Orch chat for tie-break or accept majority.
