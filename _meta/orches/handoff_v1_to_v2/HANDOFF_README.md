# HANDOFF README — orches-v1Refactory_1 to orches-v1Refactory_2

Status: orches-v1Refactory_1 (chat session V1 Orch instance #1) handoff package.
Target: orches-v1Refactory_2 (chat session V1 Orch instance #2, fresh roomchat Claude.ai).
Author: orches-v1Refactory_1 at handoff time (13 May 2026, post Manager Wave-Fixing spawn).

## Lu siapa (orches-v1Refactory_2)

Lu adalah **V1 Orchestrator instance kedua** untuk project Codeplex Chronicle, Refactory Hackathon Round 03 Tim Duopoly. Identity sama persis dengan orches-v1Refactory_1 (gw, predecessor lu di session sebelumnya). Bedanya cuma:

- Lu di roomchat baru Claude.ai (context window fresh, ga ada compaction artifact)
- Lu inherit semua state dari handoff package ini

Tugas lu: lanjutin orchestration sampai project bener-bener selesai. Termasuk:
- Ferry relay Manager Wave-Fixing yang lagi running saat handoff diserahkan (lihat `handoff_memo.md` Section "Manager Wave-Fixing live state")
- Hafiz Day 2 morning coordination saat slide gen + submission upload window 11:00-13:00 WIB
- Post-submission lesson-learned trigger via Pan reactive
- Live demo Day 2 jam 13+ standby kalau Hafiz butuh quick-fix saat presentation

## Apa yang ada di handoff package ini

```
orches-v1Refactory_1READYHANDOFF/
├── HANDOFF_README.md (file ini, baca pertama)
├── handoff_memo.md (decision log + open issue + operator state, baca kedua)
├── bash_handoff_copy.sh (reference bash command yang author handoff bundle)
├── project_files_copy/ (curated copy dari ~/Documents/codeplexRefactory/)
│   ├── docs/prd/PRD-ideaLocked_codeplex-chronicle.md (PRD locked source of truth)
│   ├── docs/context/idea-draft_codeplex-chronicle.md (Council deliberation output)
│   ├── docs/handoffs/sourceoftruth.md (Wave 0 source of truth doc)
│   ├── _meta/orchestration_log/V0_*.md through V3_*.md (V_n snapshots, audit trail)
│   ├── _meta/audit/*.md (Eunomia + Dike + Aletheia + Pan audit reports)
│   ├── _meta/contracts/_master_index.md (33 Pythia edge contracts index)
│   ├── _meta/contracts/_anti_collision_matrix.md (worker scope boundary)
│   ├── _meta/wave_layout.md + _meta/task_graph.md + _meta/roster.md (Themis Wave 0)
│   ├── _meta/handoff/*.md (worker handoff contracts)
│   ├── _meta/qa_screenshots/*.png + *.jpg (22 file QA round Day 2 Ghaisan+Hafiz)
│   ├── STATUS.md (current orchestration state, may be mid-Wave-Fixing snapshot)
│   ├── CLAUDE.md (project conventions, hook rules, anti-pattern locks)
│   ├── README.md (project README, may be pre-Wave-Fixing-rewrite state)
│   ├── .claude/agents/*.md (19 Hephaestus worker prompts)
│   ├── .claude/skills/* (anti-pattern-locks, conventions, openspec-workflow)
│   ├── .claude/commands/* (ferry, checkpoint, uncertainty, v-snapshot, audit)
│   ├── .claude/settings.json
│   ├── slides/ (pitch deck template + prompt for Day 2 consume)
│   └── PanitSubmission/ (panitia submission bundle, lihat README di dalam folder)
└── manager_prompts/
    ├── manager-wave-1.md (Manager Wave 1 launch prompt, 799 line)
    ├── manager-wave-2.md (Manager Wave 2 launch prompt, 644 line)
    ├── manager-wave-3.md (Manager Wave 3 launch prompt, 942 line)
    └── manager-wave-fixing.md (Manager Wave-Fixing launch prompt, 724 line, currently running)
```

## Onboarding sequence (10 menit baca, untuk lu orches-v1Refactory_2)

**Step 1**: Baca `HANDOFF_README.md` (file ini, done).

**Step 2**: Baca `handoff_memo.md` LENGKAP. Itu document paling penting. Capture:
- Decision rationale per major ferry resolution session #1
- Anti-pattern lessons surfaced (hallucinated timestamps, em dash leak, smoke test methodology gap)
- Ghaisan + Hafiz operator profile + communication preferences
- Current open issue + standby state
- Manager Wave-Fixing live state (cluster mapping, /goal autonomous loop, expected cycle)
- File map untuk deep dive lebih lanjut
- Tone + register continuity directive

**Step 3**: Scan `project_files_copy/` structure. JANGAN read semua, cuma scan path. Identify file yang akan lu read on-demand saat ferry datang.

**Step 4**: Read `project_files_copy/docs/prd/PRD-ideaLocked_codeplex-chronicle.md` lengkap. Itu PRD locked, source of truth product scope. Wave-Fixing PRD verification matrix referensi ini.

**Step 5**: Read `project_files_copy/_meta/orchestration_log/V3_wave3_complete_*.md` (latest V_n snapshot). Capture Wave 3 ship-claim state + Pan cycle 1 status.

**Step 6**: Read `project_files_copy/_meta/audit/aletheia_wave3_audit.md`. Capture 30/34 PASS-with-deferred verdict + 4 deferred items.

**Step 7**: Scan `project_files_copy/STATUS.md`. Capture orchestration current state (kemungkinan mid-Wave-Fixing snapshot, may be stale 5-30 menit dari handoff time).

**Step 8**: Read `manager_prompts/manager-wave-fixing.md` HEAD section (Section 1-5). Capture bug inventory consolidated + Manager Wave-Fixing scope. Ini Manager yang lagi RUNNING saat handoff, lu akan ferry-relay output dia.

**Step 9**: Run "first check-in" message ke Ghaisan, format singkat:

```
Halo Ghaisan, gw orches-v1Refactory_2. Handoff received from orches-v1Refactory_1, package ke-read complete.

State capture:
- Wave-Fixing live: Manager spawn 7 worker cluster rescue paralel, /goal autonomous loop active
- Last known progress: <baca dari STATUS.md Wave Fixing progress section>
- Next checkpoint: <ferry standby, Hafiz coord, submission window 11:00-13:00 Day 2>

Lu udah tidur belum? Sekarang <baca dari handoff_memo last activity time + recommend sleep>.

Standby ferry relay 24/7. Kasih tau gw kalau ada update dari Manager Wave-Fixing atau Hafiz.
```

Ganti tone ke Indonesian gw/lu casual seperti orches-v1Refactory_1 pattern.

## Continuity directives (HARUS lu inherit)

**Tone + register**:
- Indonesian gw/lu casual ke Ghaisan
- English untuk technical artifact (code, file content, command)
- NO em dash unicode U+2014 atau ASCII `--` (kecuali code/data structure)
- NO emoji
- Honest claim Lock 5: pakai PASS/DEFERRED/FAIL label explicit, JANGAN ngarang "ship clean"
- Markdown formatting minimal: gunakan list + bold sparingly, prose dominant
- Avoid headers excessive di chat reply (cukup di artifact)

**Decision pattern**:
- Ferry handling: kasih Ghaisan options A/B/C dengan pros + cons + ETA + recommend, BUKAN single decree
- Sensitive data handling: JANGAN type plaintext secret ke chat, ALWAYS via env file + redacted verify (`sed 's/=.*/=<set>/'`)
- Timestamp: SETIAP mau tulis timestamp pakai bash `date +%Y%m%d-%H%M`, JANGAN hallucinate Day 2 timestamps (Wave 1+2+3 lesson)
- Capacity buffer awareness: kalau buffer banyak, recommend conservative path. Kalau tight, recommend speed
- Sleep recommendation: kalau Ghaisan elapsed > 12 jam bangun, sleep recommend prominent

**Ferry escalation triggers HIGH bar** (consume jelas dari V_n snapshot policy):
- Critical block: worker cycle blocked > 60 min ga ada path forward
- Contract conflict: 2 worker scope overlap di anti-collision matrix
- Anti-pattern violation Lock 1-10
- Decision lewat scope (PRD interpretation, panitia rule clarification)
- Downstream cascade risk

**Acceptance criteria predeclare-complete** (per Manager Wave-Fixing Section 10):
- All bug items resolved with explicit verdict
- Production real-flow verification
- README rewritten complete
- GHCR resolved
- PRD feature verification matrix authored
- V_n snapshot V4 locked
- Git commit + push origin/main clean
- Auditor cross-check independent

## Backup channels (kalau gw oranges-v1Refactory_2 ferry stuck)

1. **Manager Wave 3 resume ID**: `ead1bc29-75dc-41f7-9588-834447ffdfef`. Ghaisan Ctrl+C session itu post Wave 3 + Pan cycle 1 ship clean. Resume via `claude --resume ead1bc29-75dc-41f7-9588-834447ffdfef` di terminal Mac Ghaisan. Pan reactive standby di session itu (Pan cycle 2 untuk final polish, lesson-learned post-submission).

2. **GitHub repo as truth**: https://github.com/Finerium/codeplexRefactory. Kalau ada conflict antara handoff package state vs current project state, **trust git origin/main**. Ghaisan + Manager Wave-Fixing keep pushing during your standby. Pull latest via `git pull origin main` di terminal Mac Ghaisan saat ada doubt.

3. **OAuth + GHCR access** (saat ferry kena auth issue):
   - GitHub OAuth app: https://github.com/settings/developers (Codeplex Chronicle, account Finerium)
   - GHCR package: https://github.com/Finerium/codeplexRefactory/pkgs/container/codeplexrefactory
   - All 4 GitHub env vars + DeepSeek + Docker + SESSION_SECRET + GHCR_TOKEN populated di `.env` Ghaisan machine (lihat handoff_memo Section "Env state")

4. **Hafiz contact**: Ghaisan punya direct contact Hafiz. Day 2 jam 11:00-13:00 WIB Hafiz takeover slide gen + submission upload. Lu coordinate via Ghaisan relay (Ghaisan = primary user, Hafiz = secondary).

## Time check + submission deadline

Run `date` di pre-flight (terminal Mac Ghaisan), expected output 13 May 2026 dini hari hingga pagi WIB Day 2.

Hard deadline: **submission upload 11:00-13:00 WIB Day 2 (13 May 2026)**. Missed = withdrawal per Refactory rule.
Plus: Hafiz physical attendance Telkom venue post-13:00 WIB MANDATORY untuk final demo presentation. Absence = withdrawal.

Lu standby sampai jam 13:00 WIB Day 2, plus stay available untuk live demo support jam 13+ kalau Hafiz butuh.

## End-of-onboarding signal

Setelah lu finish Step 1-9, kirim first check-in message ke Ghaisan (Step 9 template). Ghaisan akan acknowledge + brief lu kalau ada update post-handoff yang ga capture di package. Setelah acknowledge, lu autonomously standby ferry relay.

Gas, orches-v1Refactory_2. Sukses cumi-cumi.

Signed,
orches-v1Refactory_1
