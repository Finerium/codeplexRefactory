# Contract: Aletheia to Pan

**Edge type**: handoff (Wave 3 audit pass to Pan post-Wave 3)
**Wave**: Wave 3 final audit to Pan universal worker
**Status**: locked
**Authored**: 2026-05-12 16:44 WIB

## Producer

**Worker**: Aletheia (Wave 3 final auditor, Horae sister)
**Domain**: Wave 3 final audit + handoff doc + PanitSubmission curation review. Aletheia produces handoff document for Pan that summarizes shipped state, deferred scope, known issues, rescue context (if escalated from Eunomia/Dike), and Day 2 task chain.

## Consumer

**Worker**: Pan (post-Wave 3, universal worker)
**Domain**: Demo rehearsal 3x consecutive + slide deck generation prompt template + bug sweep + polish + rescue work when auditor escalates. Pan consumes Aletheia's handoff to execute Day 2 work chain or rescue task chain.

## Output schema (producer to consumer)

Handoff document follows Pythia template Section 11 mandatory artifact #4 (handoff contract).

```markdown
# Handoff: Aletheia to Pan (Wave 3 to Post-Wave 3)

**Date**: <YYYY-MM-DD HH:MM WIB>
**Trigger**: <Wave 3 audit PASS | Wave N audit FAIL escalation>

## Output produced (Wave 0-3 inheritance)

### Wave 0 specialists
- Pythia: 33 contracts + 2 index files in `_meta/contracts/`
- Hephaestus: 16 worker + auditor prompts in `.claude/agents/` + PromptOpening at project root
- Themis: `_meta/orches/` canonical + `docs/c4/` + `openspec/` enriched + ERD + PanitSubmission seeded + STATUS.md initialized + GitHub OAuth app created + Webhook secret generated

### Wave 1 builders
- Daedalus: 3D scene scaffold at `frontend/src/scene/Canvas.tsx`
- Iris: 5 archetype InstancedMesh buildings + treemap layout at `frontend/src/scene/buildings/`
- Calliope: Landing page at `frontend/app/page.tsx`
- Hestia: Entry page at `frontend/app/start/page.tsx`
- Selene: Dashboard at `frontend/app/dashboard/page.tsx`

### Wave 2 visual modes
- Hera: Sprint Mode HERO 14 PM concept overlay at `frontend/src/modes/sprint/`
- Asclepius: Health glow + Refactor ghost at `frontend/src/modes/{health,refactor}/`
- Boreas: Onboarding + Activity at `frontend/src/modes/{onboarding,activity}/`
- Persephone: Chat + ticket + side panels at `frontend/components/panels/` + parallel route slots

### Wave 3 backend
- Hades: FastAPI + tree-sitter parser + OAuth + webhook + WebSocket at `backend/app/api/{auth,webhook,websocket,parser}.py` + `backend/app/parsers/`
- Triton: DeepSeek V4 client + defensive layer at `backend/app/services/{llm_client,semantic_cache,canned_responses,circuit_breaker}.py`
- Nemesis: 5 Apollo detector + Argus CVSS + 5 spec-drift A-E at `backend/app/services/detectors/`
- Pandora: Athena proposal + simulation engine + drafts/ + OpenSpec generator at `backend/app/services/{proposal_author,simulation_engine}.py`
- Demeter: Postgres event store + materialized views + cache + 1-click ticket + OpenSpec runtime at `backend/app/services/{demeter_service,dashboard_query,activity_query,cache}.py`
- Atlas: Docker multi-arch + K8s manifests + smoke test E2E at `infra/{docker,k8s}/` + `scripts/deploy.sh`

## Asumption baked (Wave 0 to 3 cumulative)

<List asumsi yang baked through workers; per-worker contract Asumption baked sections aggregate here>

1. r3f@9.6 + Three.js 0.184 + Next.js 16 React 19 stack stable (Phase B Topic D anchor).
2. tree-sitter-language-pack 11 grammars MIT permissive (Phase B Topic 3c anchor).
3. DeepSeek V4 OpenAI ChatCompletions API compat; 1M context per model; thinking-mode toggle per resident routing locked PRD Section 18.3.
4. Postgres connection via DATABASE_URL URL-encoded (Refactory pre-provisioned per sourceoftruth Section 3.3).
5. K8s namespace `duopoly` + ingress NGINX + TLS termination Refactory-managed.
6. Drafts isolation safety property (PRD AD-19): production code NEVER changes by simulation engine.
7. Never replay reasoning_content from prior turns (Phase B Topic E critical quirk LOCKED).
8. 5 product modes mock data Wave 1-2; real backend Wave 3; demo flow E2E real backend per Aletheia audit gate.

## Known limitations (post-Wave 3)

- Build from scratch flow stub: Hestia Wave 1 stub redirects to placeholder `/blank`; Wave 3 may keep stub or drop per OQ-15 (deferred drop protocol scope cut).
- Layer 2 Refactor Mode write ops: drafts/ + dual review gate + Accept download-diff implemented; PR create deferred (would require `repo` scope, NOT in PRD Section 19.3 minimal scope).
- Multi-language simulation: Wave 3 demo focuses on TypeScript/JavaScript (NodeGoat) + Python (PyGoat); other 9 languages parser-supported but simulation engine not extensively tested.
- Periodic scan: Wave 3 manual trigger via "Scan repo" button + webhook PR merged. Periodic nightly deferred Pan Day 2.

## Validation done by Aletheia

<Check audit findings from `_meta/audit/aletheia_wave3_audit.md`>

- Demo flow 3x consecutive trial run: <PASS | FAIL>
- 5 modes E2E real backend: <PASS | FAIL>
- DeepSeek per-resident routing: <PASS | FAIL>
- 5 Apollo detectors fire on NodeGoat fork: <PASS | FAIL>
- 5 spec-drift patterns fire on demo dataset: <PASS | FAIL>
- Lighthouse + console clean: <PASS | FAIL>
- PanitSubmission curation: <PASS | FAIL>

## Pan task list Day 2

### If Wave 3 audit PASS (normal completion)

**Day 2 jam 11-13 submission window**:
- [ ] Generate slide deck prompt template at `slides/codeplex-chronicle-pitch-template.md` (9-slide outline per Metis Section 5.8)
- [ ] Hafiz consume slide template, finalize manually
- [ ] Bug sweep regression detection on full E2E demo flow
- [ ] Log bug sweep at `_meta/audit/pan_bug_sweep.md`
- [ ] PanitSubmission/ final pass: confirm artifacts present, update README with submission timestamp
- [ ] Submission deliverable bundling: PRD + C4 + repo link + slides

**Day 2 jam 13-15 rehearsal block (if top 5)**:
- [ ] Demo flow 2-min walkthrough rehearsal 3x consecutive (per PRD Section 15)
- [ ] Q&A defense card review (10 questions per PRD Section 16)
- [ ] Pitch language Indonesian primary + English code-switch natural

**Day 2 jam 15-17 pitch window (if top 5)**:
- [ ] Live presentation by Hafiz physically attending
- [ ] Ghaisan remote support (slide nav, demo backup)

### If Wave N audit FAIL (rescue work)

**Rescue trigger**:
- Aletheia escalates with `escalation_context` from `aletheia_wave3_audit.md`
- Pan inherits failed worker prompt + audit findings
- Pan applies surgical fix targeting failed audit item
- Pan re-validates ship criteria
- Pan re-triggers audit (Eunomia/Dike/Aletheia as needed)

## Validation needed by Pan

- Pan executes 20-item self-check before declaring Day 2 work complete (per Pythia self-check Section 16 template, adapted for Pan).
- Pan capacity gate: if Day 2 work exceeds 1.9h budget (Metis Section 4 Pan allocation 8% capacity), Pan ferries Ghaisan/Hafiz for scope cut decision.
- Demo rehearsal 3x consecutive ship criteria: 0 mid-run recovery; if recovery needed, rehearsal counts FAIL.

## Open questions for Pan

- Day 2 slide deck Hafiz preference: outline only or full draft? Pan defaults outline only per Hafiz hands-off mode (Hafiz finalizes manually). Override if Hafiz requests full draft.
- Mobile responsive polish: PRD demo target desktop M-series. Mobile responsive out-of-scope Wave 3; Pan Day 2 stretch if rehearsal feedback demands.
- Pan rescue boundary: Pan inherits failed worker prompts but does NOT re-author from scratch. If rescue requires deep architectural rewrite, Pan ferries Ghaisan/Hafiz for scope cut decision (drop protocol activate).

## Reference

- Metis Agentic Structure md Section 5.7 Aletheia ship criteria (handoff doc + PanitSubmission curation)
- Metis Section 5.8 Pan ship criteria
- Metis Section 6 (Pan max effort tier locked)
- PRD Section 12 (drop protocol triggers)
- PRD Section 15 + 16 (demo flow + Q&A defense)
- PRD Section 24 (submission deliverable)
- sourceoftruth Section 6 (hands-off mode operator role 3-only)
- sourceoftruth Section 7 (locked decisions, JANGAN re-litigate)
- Contract `aletheia-wave3-audit.md` (audit checklist that drives handoff content)
- Contract `eunomia-wave1-audit.md` + `dike-wave2-audit.md` (rescue trigger sources)
