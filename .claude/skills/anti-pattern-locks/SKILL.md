---
name: anti-pattern-locks
description: Anti-pattern hard locks for Codeplex Chronicle. Auto-load whenever working on any code, document, or output. 10 locks - no em dash, no emoji, no silent scope narrow, no silent assume, honest claim discipline, capacity respect, Greek naming, no paid services, V_n locked snapshot, per-wave auditor mandatory. Project hackathon Refactory Round 03 Telkom 12-13 May 2026 Tim Duopoly.
---

# Anti-Pattern Hard Locks (10)

These locks apply to all workers Wave 0-3 plus Pan post-Wave 3. Auditors (Eunomia / Dike / Aletheia) verify compliance per wave audit gate. Violations are remediation-required, not optional.

## Lock 1: No em dash

JANGAN pakai `--` (em dash, double hyphen) di mana pun. Output, code, comments, docs, commit message, anywhere.

Replacement:
- Comma + clause: "x, the case where y"
- Parenthesis: "x (the case where y)"
- Period: "x. The case where y"

Enforcement: `.claude/hooks/pre-write-check.sh` PreToolUse Write/Edit blocks via exit 2.

## Lock 2: No emoji

JANGAN pakai emoji apapun. Output, code, comments, docs, anywhere.

Replacement:
- `[CRITICAL]`, `[NOTE]`, `[TIP]`, `[WARN]`, `[OK]`, `[FAIL]` text labels
- ASCII markers: `[!]`, `[?]`, `[+]`, `[-]`

Enforcement: `.claude/hooks/pre-write-check.sh` PreToolUse blocks via exit 2 (unicode range check).

## Lock 3: No silent scope narrow

Kalau perlu cut feature, FERRY V1 Orch dulu. Drop authority Ghaisan / V1 Orch, BUKAN worker unilateral.

Document explicit di decision log:
- What feature dropped
- Why (capacity / scope / safety)
- Impact downstream (which worker / handoff affected)
- Alternative considered

## Lock 4: No silent assume

Kalau bake asumsi ga di-spec, document di uncertainty journal + handoff contract.

Label: `[ASSUMED]` / `[UNVERIFIED]` / `[INFERRED]` kalau ga validated empirik. Surface assumption + risk + mitigation in journal.

## Lock 5: Honest claim discipline

Mock / placeholder / stub labeled:
- `[MOCK: <reason>]` for runtime stub returning canned data
- `[PLACEHOLDER: <fill in by next cycle>]` for spec slot expecting real content
- `[STUB: <expected real impl>]` for function signature without implementation

Plus document di decision log + handoff contract. Auditor verifies no hidden mock at audit gate.

Enforcement: `.claude/hooks/post-write-check.sh` PostToolUse Write/Edit warns if `mock|fake|stub|placeholder` keyword present without `[MOCK/PLACEHOLDER/STUB]` label.

## Lock 6: Capacity respect

Tired / burnout / frustrated > 1 jam = STOP. 15 menit istirahat. Quality drop > 15 menit cost.

Hackathon konteks tim 2 orang (Ghaisan + Hafiz): sleep cycle rotation. JANGAN sama-sama begadang nonstop. Hafiz physically attend Day 2 final presentation MANDATORY (Refactory rule: absence = withdrawal).

## Lock 7: Greek mythology naming convention

Worker names dari pool Greek mythology, locked oleh Metis Section 3 roster + Wave 0 reserved (Pythia / Hephaestus / Themis) + auditor reserved (Eunomia / Dike / Aletheia, Horae sisters) + universal Pan post-Wave 3.

JANGAN invent random name atau pakai modern brand name. Multiple instance per role: `<name>_V<N>` (e.g., `Iris_V1`, `Iris_V2`).

Reserved names (NOT used as workers):
- Runtime residents: Athena, Apollo, Argus, Clio, Hermes (LOCKED PRD Section 10)
- Council pre-event: Momus, Eos, Prometheus, Mnemosyne (LOCKED Council session 2026-05-12)

Cross-ref: `_meta/contracts/_anti_collision_matrix.md`.

## Lock 8: No paid services tanpa Ghaisan approval

Free tier OK: GitHub Actions, Vercel/Netlify deploy, Supabase free, DeepSeek $5 budget Hafiz throwaway.

Kalau action butuh paid service (e.g., paid GitHub plan, OpenAI API beyond Hafiz budget, paid cloud), FERRY V1 Orch dulu untuk Ghaisan approval.

DeepSeek $5 budget Hafiz LOCKED:
- Throwaway hackathon account, accepted risk
- Real-time cost tracking via `llm_call_log` table per Demeter Wave 3
- V4-Flash + V4-Pro routing per resident (PRD Section 18.3)

## Lock 9: V_n locked snapshot per major milestone

Critical artifact (final spec, Wave-end output, locked design) di-snapshot jadi `V<n>_<artifact>_locked_<YYYYMMDD-HHMM>.md` di `_meta/orchestration_log/`.

Setelah locked, continuous edit illegal. Kalau perlu update, bikin V<n+1>.

Examples:
- `V0_pythia_contracts_locked_20260512-1700.md`
- `V0_hephaestus_prompts_locked_20260512-1930.md`
- `V0_themis_setup_locked_<timestamp>.md` (Themis Cycle 8 output pending)

## Lock 10: Per-wave auditor mandatory

Wave 1 → Eunomia audit. Wave 2 → Dike audit. Wave 3 → Aletheia audit.

Auditor clean = downstream wave unlock. Auditor flag critical = re-spawn upstream worker dengan correction. Capacity tradeoff ~5-15% per wave, NEGOTIABLE.

Audit output files:
- `_meta/audit/eunomia_wave1_audit.md` (binary PASS/FAIL + findings + ferry context if FAIL)
- `_meta/audit/dike_wave2_audit.md` (binary PASS/FAIL)
- `_meta/audit/aletheia_wave3_audit.md` (binary PASS/FAIL final)

Aletheia final audit feeds Pan handoff `_meta/contracts/aletheia-to-pan.md`.

## Self-check sebelum stop (20 items, mandatory per worker per cycle)

| # | Item | Verification |
|---|------|--------------|
| 1 | Decision log entry done untuk semua decision berbobot | `_meta/decision_log/<worker>.md` exists |
| 2 | Uncertainty journal entry done untuk medium-confidence decision | `_meta/uncertainty/<worker>-cycle<N>-*.md` exists |
| 3 | Checkpoint authored dengan state snapshot lengkap | `_meta/checkpoints/<worker>-cycle<N>.md` exists |
| 4 | Handoff contract authored kalau ada handoff downstream | `_meta/handoff_log/wave<N>_<from>_to_<to>.md` exists |
| 5 | V_n snapshot done kalau cycle produce critical artifact | `_meta/orchestration_log/V<n>_*_locked_*.md` exists |
| 6 | Lock 1: no em dash di output | grep `--` scan negative |
| 7 | Lock 2: no emoji | grep unicode range negative |
| 8 | Lock 3: no silent scope narrow | decision log entry if dropped |
| 9 | Lock 4: no silent assume | uncertainty journal entry if uncertain |
| 10 | Lock 5: mock/placeholder labeled | grep `mock\|stub\|placeholder` returns labeled hits only |
| 11 | Lock 6: capacity respected | session time vs target wall-clock |
| 12 | Lock 7: Greek naming compliant | cross-check anti-collision matrix |
| 13 | Lock 8: no paid services | grep paid-service-keyword negative |
| 14 | Lock 9: V_n snapshot critical artifact | snapshot file exists |
| 15 | Lock 10: per-wave auditor scheduled + ga di-skip | audit gate file exists in `_meta/audit/` |
| 16 | Output match Pythia contract (schema, format, fields) | grep contract `_meta/contracts/<edge>.md` reference |
| 17 | Asumsi documented di handoff contract atau uncertainty journal | journal entry per [ASSUMED]/[INFERRED] flag |
| 18 | Downstream consumer aware (handoff contract notes) | handoff contract has "Validation needed by <consumer>" section |
| 19 | Frustration check + context capacity gate < 60-70% | self-report in checkpoint |
| 20 | Meta-cognitive check: cycle perlu act atau reflect lebih lama | self-report in checkpoint |

Kalau item fail, fix dulu sebelum stop. Block fail (item 16-17): FERRY V1 Orch.

---

**Locks last updated**: 2026-05-12 16:35 WIB by Themis Wave 0
**Source authority**: V1 Orch spawn directive `/orches-v1` Mode A + sourceoftruth Section 9 + Metis md Section 11 self-check protocol
