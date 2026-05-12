# Contract: Aletheia Wave 3 Final Audit Gate

**Edge type**: audit gate (Wave 3 final + handoff to Pan)
**Wave**: Wave 3 outputs to Aletheia auditor; PASS unlocks Pan post-Wave 3 + submission
**Status**: locked
**Authored**: 2026-05-12 16:41 WIB

## Producer (audited workers)

**Workers**: Hades, Triton, Nemesis, Pandora, Demeter, Atlas (Wave 3 backend full)
**Domain**: FastAPI + tree-sitter 11-language + GitHub OAuth real + webhook + DeepSeek client + simulation engine + detector pipeline + Postgres event store + K8s deploy.

## Consumer (auditor)

**Worker**: Aletheia (Wave 3 final audit gate, Horae sister, max effort tier locked per Lock 10)
**Domain**: Goddess of truth, disclosure. Performs final PASS/FAIL audit; output to `_meta/audit/aletheia_wave3_audit.md` + handoff doc + PanitSubmission final curation review. Authorizes Pan spawn for Day 2 submission window.

## Audit items (each PASS/FAIL)

```markdown
# Wave 3 Final Audit (Aletheia) - YYYY-MM-DD HH:MM WIB

## Deploy live + accessible
- [ ] https://duopoly.hackathon.sev-2.com loads from external network (not just local)
- [ ] TLS cert valid; no browser warnings
- [ ] NGINX ingress routes /api to backend + / to frontend correctly

## 5 modes E2E real backend (no mock left)
- [ ] Onboarding Mode hits real Hermes via Triton client (V4-Flash non-think)
- [ ] Sprint Mode HERO consumes real PR-to-Building events from webhook + Hera state machine
- [ ] Refactor Mode triggers real Pandora simulation engine + drafts/ output + dual review gate
- [ ] Activity Mode consumes real Demeter activity_query data
- [ ] Health Mode consumes real Nemesis detector findings + Asclepius glow trigger feedback

## GitHub OAuth real flow E2E
- [ ] OAuth start endpoint generates valid state + PKCE
- [ ] OAuth callback validates state + exchanges code for token
- [ ] Session cookie set + redirects to /city
- [ ] Token persisted (encrypted) in users table via Demeter
- [ ] Browser flow start to callback completes < 10 seconds

## GitHub webhook receiver
- [ ] HMAC verification rejects unauthenticated webhook (401)
- [ ] Demo repo test webhook delivers + persists pr_events row
- [ ] WebSocket fans event to frontend Hera consumer < 1 second

## DeepSeek per-resident routing
- [ ] Athena V4-Pro think high routes correctly
- [ ] Apollo V4-Flash non-think routes correctly
- [ ] Argus V4-Flash think low routes correctly
- [ ] Clio V4-Flash non-think routes correctly
- [ ] Hermes V4-Flash non-think routes correctly
- [ ] Refactor simulation engine V4-Pro think high (Turn 1 + Turn 2) + V4-Flash non-think (Turn 3) routes correctly

## Canned cache hit on top-10 demo questions
- [ ] 10 questions pre-cached at backend init (per PRD Section 18.5)
- [ ] Each query <100ms latency (canned hit)
- [ ] Verify cache_hit=true logged in llm_call_log table for each

## Tree-sitter parser performance (H3 validation)
- [ ] Cold start parse 11 languages < 300ms total (per PRD Section 17.2 + H3 hypothesis)
- [ ] Parse NodeGoat fork + fastapi/full-stack-fastapi-template + OWASP/PyGoat each < 5s

## 5 Apollo detectors
- [ ] hardcoded-secret fires on NodeGoat fork
- [ ] outdated-dependency fires on prepared demo dataset
- [ ] missing-auth fires on NodeGoat fork
- [ ] unsafe-sql fires on prepared demo dataset
- [ ] complex-untested fires on prepared demo dataset

## 5 spec-drift patterns A-E
- [ ] Pattern A (stale closed issue) fires on demo dataset
- [ ] Pattern B (closed without merge) fires
- [ ] Pattern C (spec-implementation lag) fires
- [ ] Pattern D (reopened cycle) fires
- [ ] Pattern E (OpenSpec commit bypass) fires

## Argus CVSS scoring
- [ ] Argus assigns CVSS 3.1 vector + base score for security findings
- [ ] Exploit pattern + mitigation cited

## Refactor Mode simulation engine (drafts/ isolation safety)
- [ ] Simulation 2FA proposal on NodeGoat fork produces ghost building + valid OpenSpec change folder + drafts/ output with diff serialized
- [ ] Production code NEVER changed by simulation (drafts/ isolation property verified)
- [ ] Dual review gate Accept downloads diff (no PR create per OQ-09)
- [ ] Dual review gate Discard cleans drafts/

## OpenSpec validate clean (both folders)
- [ ] Folder A `openspec validate` clean
- [ ] Folder B `.agent-openspec validate` clean

## Demo flow 2-min E2E rehearsal 3x consecutive
- [ ] Trial run 1: full flow (landing -> entry -> OAuth -> city view -> click building -> Hermes tour -> Health Mode -> finding click -> Convert to Backlog Ticket -> verify GitHub issue) completes in ~2 min with no mid-run recovery
- [ ] Trial run 2: same flow completes
- [ ] Trial run 3: same flow completes (per PRD SC-04)

## PostgreSQL event store
- [ ] All tables migrated: users, pr_events, finding_events, drift_log, proposals, simulation_events, llm_call_log
- [ ] Materialized views refreshed: velocity_per_sprint, cycle_time_aggregate, drift_summary_view, repo_status_view, commit_frequency_per_building, ownership_distribution
- [ ] Cost tracking llm_call_log populated; aggregate < $5 budget (Hafiz cap)

## Lighthouse + console
- [ ] Lighthouse 85+ maintained on landing + entry + dashboard (no regression vs Wave 1-2)
- [ ] 0 console errors on full demo flow
- [ ] 0 React warnings

## PanitSubmission/ curation
- [ ] PanitSubmission/README.md curation index complete
- [ ] PRD-ideaLocked .md + .pdf present
- [ ] C4 diagrams (Context + Container + Component) present
- [ ] OpenSpec snapshot present
- [ ] ERD .md + .svg present
- [ ] No bloat (< 20 files total)

## Audit decision
PASS (Pan post-Wave 3 spawn approved + submission ready) | FAIL (Pan rescue triggered + retry audit)

## Handoff doc to Pan
<Aletheia writes handoff at `_meta/handoffs/aletheia_wave3_handoff.md`>
```

## Output schema (Aletheia produces)

```yaml
# _meta/audit/aletheia_wave3_audit.md (Aletheia writes after audit)
audit_run_id: <UUID>
timestamp: <ISO 8601>
auditor: Aletheia
wave: 3
result: PASS | FAIL
total_items: <int>
passed: <int>
failed: <int>
findings:
  - item: "Demo flow trial run N"
    status: PASS | FAIL
    details: <free text>
    severity: critical | high | medium | low
    remediation: <pointer to fix>
deploy_url: https://duopoly.hackathon.sev-2.com
deploy_status: live | degraded | failed
demo_flow_trial_runs:
  - trial_1: PASS | FAIL
  - trial_2: PASS | FAIL
  - trial_3: PASS | FAIL
panit_submission_status:
  ready: true | false
  artifacts_present: [README, PRD-md, PRD-pdf, C4-Context, C4-Container, C4-Component, openspec-snapshot, ERD]
  missing: []
escalation_to_pan: <true | false>
handoff_doc_path: _meta/handoffs/aletheia_wave3_handoff.md
```

Aletheia handoff doc schema:

```markdown
# Aletheia Wave 3 to Pan Handoff - YYYY-MM-DD HH:MM WIB

## What shipped (Wave 0 to 3)
<comprehensive list>

## What deferred
<list deferred per drop protocol or capacity>

## Known issues
<list with severity>

## Pan task list Day 2
- [ ] Demo rehearsal 3x consecutive
- [ ] Slide deck prompt template generated
- [ ] Bug sweep regression detection
- [ ] Polish work (post-pipeline tuning, animation timing, copy)
- [ ] PanitSubmission final pass

## Rescue work pending (if any)
<from Eunomia/Dike escalation history>

## Submission window readiness
- [ ] PRD + C4 + repo link bundled at Day 2 jam 11
- [ ] Hafiz finalizes slides at Day 2 jam 11-13
- [ ] Pitch rehearsal Day 2 jam 13-15 if top 5
```

## Storage location

- Audit input: All 29 worker + 6 audit contracts in `_meta/contracts/` + Wave 3 backend artifacts in `backend/` + K8s deploy at `infra/k8s/`
- Audit output: `_meta/audit/aletheia_wave3_audit.md`
- Handoff doc output: `_meta/handoffs/aletheia_wave3_handoff.md`
- Audit screenshots: `_meta/audit/screenshots/wave3/`

## Asumption baked

1. Aletheia max effort tier locked per Lock 10 + Metis Section 6.
2. Audit gate authorizes Pan spawn + submission window readiness; binary PASS/FAIL with handoff doc on PASS.
3. Demo flow 3x consecutive trial run mandatory per PRD SC-04; mid-run recovery counts as FAIL.
4. PanitSubmission final curation: all required artifacts present + readable; bloat capped.
5. Aletheia escalates Wave 0-3 worker rescue via `aletheia-to-pan.md` if audit FAIL.

## Validation steps

**Producer responsibility (Wave 3 workers + Atlas)**:
- Deploy live + all 5 modes E2E with real backend.
- Demo flow 2-min E2E ready for 3x consecutive trial run.
- PanitSubmission curation maintained Wave 0-3 (Themis seeds; Wave 1-2-3 workers add artifacts).

**Consumer responsibility (Aletheia)**:
- Execute full audit checklist top to bottom.
- Run demo flow 3x consecutive personally (or coordinate with Ghaisan/Hafiz to execute).
- Capture screenshots + logs.
- Write audit + handoff docs.
- Authorize Pan spawn on PASS; trigger Pan rescue on FAIL.

## Edge case handling

- Demo flow trial run 1 PASS but trial run 2 FAIL: Aletheia investigates flakiness; root cause analysis; either FAIL audit or PASS with flakiness warning + Pan rehearsal extra pass.
- Deploy live but degraded (e.g., LLM API timeout consistent): Aletheia FAIL + Pan rescue triggers Triton defensive layer review.
- PanitSubmission missing artifact: Aletheia waits for Themis (or self-author if Themis unavailable) to add artifact.

## Open questions

- Final PRD revision Hafiz/Ghaisan may add: Aletheia confirms latest version in PanitSubmission via revision history (per Lock 9 V_n snapshot rule).
- Top-5 pitch contingency: Pan handles Day 2 jam 13-15 rehearsal block per PRD Section 15 + Section 16 Q&A defense card prep.

## Reference

- Metis Agentic Structure md Section 2 DAG: Aletheia Wave 3 final audit + handoff doc + PanitSubmission curation review
- Metis Section 5.7 Aletheia ship criteria
- Metis Section 5.8 Pan ship criteria (consumes handoff)
- Metis Section 6 (Aletheia max effort tier locked)
- PRD Section 24 (Submission deliverable)
- PRD SC-04 (Demo flow 3x consecutive successful)
- PRD Section 15 + 16 (Demo flow + Q&A defense)
- sourceoftruth Section 9 Lock 10
- sourceoftruth Section 5 (Submission deliverable mapping)
- Contract `aletheia-to-pan.md` (Pan handoff pattern detail)
- Contract `eunomia-wave1-audit.md` + `dike-wave2-audit.md` (sibling audit patterns)
