# Codeplex Chronicle: Idea Draft (Locked)

**Project**: Codeplex Chronicle
**Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Hackathon**: Refactory Hackathon Round 03 × Telkom University Bandung
**Date**: 12-13 Mei 2026 (24 jam)
**Theme**: Engineering Productivity x AI
**Pre-provisioned domain**: `https://duopoly.hackathon.sev-2.com`
**Cluster**: K8s namespace `duopoly`, PostgreSQL credentials provided
**Document version**: idea-draft v1.0 (LOCKED)
**Authored by**: Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin (Tim Duopoly)
**Authored date**: 9-10 Mei 2026 (pre-event brainstorming + research)
**Downstream consumption**: dokumen ini di-attach ke Council session hari-H (12 Mei) → produces PRD-ideaLocked → consumed by Metis (agentic structure) + Designer (UI prompts) + Orches (Wave execution) + Pan (universal worker)

---

## A. Mandate untuk Council Hari-H (BACA DULU)

Dokumen ini adalah output brainstorming pre-event Ghaisan + Hafiz (9-10 Mei 2026), hasil dari 8+ ronde diskusi konfirmasi plus 1 round deep research comprehensive. Ide sudah locked, tidak ada lagi diskusi sama Ghaisan di hari-H.

**Mandate Council hari-H:**

1. **Deep research expansion** untuk topic yang gap-nya masih open per dokumen ini (lihat Section P "Open Questions Council Hari-H Consume"). Most critical sekarang: tanya Brian/Andika di WhatsApp grup atau DM IG @refactory.id soal Round 02 UNAIR winner pattern (juara 1+2 belum publik). Refactory rules formal sudah RESOLVED pre-event (lihat Section P.1).

2. **Generate PRD comprehensive** sesuai standar industri untuk dikonsumsi Metis (agentic structure architect) + Designer-v1 (UI prompt author) + Orches-v1 (Wave executor) + Pan (universal worker). Kalau hari-H Ghaisan kasih tambahan poin spesifik untuk PRD (kemungkinan ada clarification dari panitia atau requirement tambahan), Council pakai itu juga. Kalau ga ada tambahan, generate PRD as-is dari dokumen ini sesuai standar industri.

**Constraint Council hari-H**:
- Tidak diskusi sama Ghaisan untuk re-debate ide. Ide LOCKED, fixed final.
- Tidak pivot atau push back substansi yang udah ditetapkan di dokumen ini.
- Tidak spawn persona deliberation untuk re-validate concept (sudah dilakukan di brainstorming pre-event 9 Mei, output ringkasan di Section R).

**Council hari-H boleh**:
- Refine wording PRD untuk clarity.
- Add detail spesifik yang muncul dari technical meeting hari-H (kalau ada surprise rule dari panitia).
- Surface risk baru yang muncul karena context hari-H (e.g., kalau ada perubahan domain plus credential plus team setup).

---

## B. Hands-Off Mode Declaration

Ghaisan plus Hafiz **TIDAK MENYENTUH KODE** selama 24 jam hackathon. Workflow agentic Ghaisan (Council → Metis → Designer → Orches → Pan) handle semuanya. Operator role untuk Ghaisan plus Hafiz cuma 3:

1. **Relay handoff antar agent**: paste output dari satu agent ke konteks agent berikutnya, drive workflow forward.
2. **Decision approval**: kalau ada gate approval (e.g., Athena propose major refactor di simulation, Hephaestus minta feature flag toggle), Ghaisan approve.
3. **Ferry knowledge**: capture insight dari satu agent ke konteks agent lain via handoff document (ClaudePrompter framework standar Ghaisan).

**Yang Claude Code handle (BUKAN Ghaisan/Hafiz)**:
- Folder structure setup
- Dependency install (npm, pip, OpenSpec init)
- Code generation full
- File operations (create, edit, delete, refactor)
- Git operations (init, commit, push)
- OpenSpec cycles full (`/opsx:propose` → `/opsx:apply` → `/opsx:archive`)
- K8s deployment ke `duopoly.hackathon.sev-2.com` (dockerize, push image, kubectl apply, ingress config)
- Database schema setup PostgreSQL
- Slide deck presentasi Day 2 jam 11-13 submission window
- Demo dataset preparation (fork repo, populate Milestones+issues+PR via GitHub API script)
- Smoke test plus debug

**Operator activity Ghaisan plus Hafiz selama 24 jam**:
- Day 1 jam 10-11: spawn Council hari-H, baca PRD output, paste ke Metis input
- Day 1 jam 11-13: spawn Metis, generate AGENT_STRUCTURE.md, paste ke Designer plus Orches
- Day 1 jam 13 onwards: drive Wave 0 → Wave 1 → Wave 2 → Wave 3, paralel paste handoff antar worker, approve gate
- Day 1 plus Day 2 sleep cycle: Hafiz handle saat Ghaisan tidur, Ghaisan handle saat Hafiz tidur, gantian
- Day 2 jam 11-13: spawn slide generator agent, paste demo flow ke prompt, output deck
- Day 2 jam 13-15: pre-pitch rehearsal, monitor smoke test
- Day 2 jam 15-17: pitch session (kalau top 5)

Hafiz role: **gantian operator dengan Ghaisan**, sleep-cycle handoff. Bukan domain split, bukan tugas spesifik. Hafiz physically attend Day 2 final presentation (Refactory rule: absence = withdrawal).

---

## C. Workflow Sequencing Mandate (CRITICAL untuk Metis Hari-H)

Metis hari-H **WAJIB** sequence wave dengan filosofi **visual frontend-first**, BUKAN paralel frontend+backend pattern NERIUM/Foresight standar.

**Reasoning**: visual paling susah direvisi kalau backend duluan. Kalau visual selesai dulu, backend bisa adapt ke contract data shape yang visual butuhkan, BUKAN sebaliknya. Pattern reverse ini specific untuk Codeplex Chronicle karena:

1. 3D city visual quality bar = differentiator utama, harus mencapai NYC/Dubai-tier (gedung tinggi plus iconic landmark plus cinematic).
2. Iterasi visual butuh waktu real-time render plus camera rehearsal, ga bisa di-rush.
3. Backend (FastAPI parser, GitHub OAuth, webhook receiver) relatif standar pattern, bisa di-spawn paralel di akhir.

**Sequencing yang Metis arrange:**

- **Wave 0 (planning)**: standar (Pythia contract, Hephaestus prompt). Visual plus backend semua agent specs di-author.
- **Wave 1 (foundation visual)**: workers fokus visual full. Three.js scene boilerplate, camera setup, lighting plus fog plus HDRI, building geometry, district layout, idle drift cinematic. Backend di tahap ini cuma stub mock data (hardcoded JSON yang represent 1 demo repo). Worker count generous untuk paralelism visual: 1 worker scene+camera+post-processing, 1 worker building+geometry+InstancedMesh, 1 worker landing page (Designer-v1 prompt result execute), 1 worker entry page (Designer-v1 prompt result execute), 1 worker dashboard (Designer-v1 prompt result execute).
- **Wave 2 (modes plus interaction visual)**: workers fokus visual modes. Sprint Mode overlay (scaffolding plus crane plus blueprint plus banner plus inspector NPC), Health Mode glow window, Onboarding Mode camera fly script, Activity Mode timeline scrubber, Refactor Mode ghost building plus draft simulation visual. AI residents chat panel UI, ticket panel UI, side panel UI. Backend di tahap ini masih mock (lebih kaya, multi-repo demo dataset stub).
- **Wave 3 (backend plus integration plus deploy)**: workers fokus backend full. FastAPI parser tree-sitter multi-language, GitHub OAuth flow real, webhook receiver, simulation engine (Gemini multi-turn coordination untuk Refactor Mode write ke `drafts/` folder), OpenSpec runtime integration, Apollo+Argus detector real, Postgres event store, K8s deploy ke `duopoly.hackathon.sev-2.com`, smoke test, slide deck.
- **Wave 3+ buffer**: bug sweep, demo rehearsal, polish.

**Worker design philosophy**: setiap worker pintar dengan pekerjaan banyak per worker. NERIUM/Foresight-style multi-task per worker, paralelism efektif. BUKAN granular 1-task-per-worker yang bikin overhead spawn-handoff terlalu tinggi.

---

## D. Executive Summary

Codeplex Chronicle adalah **AI-resident development environment untuk understanding, refactoring, dan securing real production codebases, divisualisasikan sebagai kota 3D yang lu jelajahi bersama 5 expert AI**. Kotanya BUKAN value proposition, kotanya **interface plus memory hook**. Value proposition real ada di 5 product modes yang nyelesaiin engineering productivity pain real: onboarding engineer baru, agile sprint tracking, refactor exploration safely, activity intelligence, dan code health monitoring.

Tagline plus differentiator (3 angle, dipakai sesuai konteks pitch):

- **Angle 1 (philosophical)**: *"Other tools tell you what is in your code. Codeplex Chronicle tells you what your code promised vs what it actually delivered."*
- **Angle 2 (concrete)**: *"Flat ticket lists don't show where work lives. Static code maps don't show what's planned. Codeplex Chronicle is one map of cities: your codebase, your sprint, and the gap between what you planned and what you shipped."*
- **Angle 3 (closing punchline)**: *"AI yang ngarang itu mahal. Refactor yang salah bisa break production. Codeplex Chronicle ngasih AI ruang untuk eksplorasi tanpa risiko: tiap proposal Athena dan tiap eksekusi refactor jalan di drafts/, BUKAN production code lu. Lu lihat blast radius lengkap dengan visual ghost-to-solid, lu baca diff dengan tenang, lu accept atau lu discard. Production code lu cuma berubah saat lu yang decide."*

Landing page tagline (visual locked dari screenshot prototype Ghaisan):
> **YOUR CODEBASE, ALIVE**
> Codeplex Chronicle: A code editor that turns your repository into a 3D city. Files become buildings, folders become districts, and errors become earthquakes you can feel.

---

## E. Core Idea

### E.1. The Big Picture

Codeplex Chronicle merepresentasikan literally entire codebase sebagai kota 3D interaktif yang hidup. User import repo via GitHub OAuth, kotanya auto-generate dari struktur file plus git history. Kota itu BUKAN cuma visual showpiece, tapi **operating canvas** yang berfungsi sekaligus sebagai 5 workspace berbeda dalam satu surface tunggal:

1. **Onboarding workspace** untuk engineer baru yang join codebase
2. **Spatial agile project management workspace** dimana sprint, ticket, plus team activity di-overlay langsung di atas kota (BUKAN flat list seperti Jira atau Linear)
3. **Spec-driven refactor workspace** dimana user describe intent in plain language, AI agent propose ghost buildings plus auto-generate OpenSpec change folder, AI execute simulation di `drafts/` folder
4. **Code health diagnosis workspace** dimana tech debt visible literal sebagai glowing red windows
5. **Activity intelligence workspace** dimana git history evolution visible sebagai contributor heatmap, ownership concentration, plus hotspot tracking

Kota berfungsi sebagai **shared navigational surface**, BUKAN source of truth mutlak. Tiap konsep agile, tiap finding Apollo, tiap proposal Athena, tiap drift detection muncul spatially di atas gedung tempat kerja sesungguhnya berlangsung.

### E.2. Audience: Engineer + Manager Dual

Codeplex Chronicle serve **dua audience** lewat **dual view architecture** yang co-exist di product yang sama, switchable di top nav.

- **Engineer (default)** bekerja primarily di **City View** dengan 3D city plus PM overlay plus Refactor Mode plus ticket panel plus AI residents chat
- **Manager** bekerja primarily di **Dashboard View** dengan flat 2D dashboard berisi velocity plus burndown plus milestone progress plus contributor analytics plus embedded city preview di corner

Toggle switching ada di top navigation, jadi engineer bisa zoom ke Dashboard kalau butuh velocity numbers cepet, manager bisa zoom ke City View kalau butuh konteks visual untuk specific district atau ticket pas one-on-one dengan engineer.

### E.3. Filosofi AI (LOCKED, kritis untuk Q&A defensibility)

AI berperan sebagai **summarizer** (terjemah deterministic detector output menjadi prosa readable), **navigator** (jawab query human soal struktur codebase), **context provider** (surface dependency awareness, git history insight, spec evolution), plus **proposal author dengan execution di sandbox** (generate OpenSpec proposal plus design plus tasks dari intent, execute refactor di `drafts/` folder BUKAN production).

**Semua insight grounded** di static analysis output, git/ticket metadata, OpenSpec proposal, atau deterministic detector. **Decision tetap di tangan human** via review gate sebelum apply (worker self-review proposal sebelum `/opsx:apply`, user review fix sebelum implement, manager review velocity sebelum sprint planning).

**Critical safety design**: Athena execute Refactor Mode beneran (Gemini multi-turn coordination: test gen → implementation gen → diff serialization), TAPI execution **write ke `drafts/<simulation-id>/` folder**, BUKAN ke production code. User pilih:
- **Accept changes**: apply diff ke real code, commit
- **Done viewing simulation**: keep as draft, simulation lives in `drafts/` for later review atau eventual discard

Production code **HANYA** berubah saat user explicit click "Accept changes". AI tidak unilateral landing kode di production, EVER.

Refactor Mode workflow: **propose, review, execute simulation, accept-or-discard, archive**. Tiap stage ada human checkpoint. Filosofi compliance maintained dengan tambahan visual demo punch (real refactor execution visible di simulation, BUKAN pre-recorded animation).

### E.4. GitHub Backbone + OpenSpec First-Class

**Backbone tickets = pure GitHub.** Sprint = Milestone, Backlog = open issues, Story = issue dengan label, PR = native pull request. OAuth flow simple, gratis, scope read plus selective write. Tidak ada custom ticket database, tidak ada parallel system yang user harus sync manually. **Ticket lives where the work lives.**

**Spec layer = OpenSpec first-class** kalau repo punya `openspec/` directory. Untuk repo tanpa OpenSpec, fallback ke GitHub Issues sebagai informal spec source. Pattern ini **progressive degradation** (BUKAN progressive enhancement), artinya OpenSpec adalah default, GitHub Issues adalah fallback.

**Konteks Refactory hackathon**: OpenSpec mandate dari komite (confirmed via WhatsApp Andika "wajib membuat spesifikasinya terlebih dahulu sebelum memberi instruksi kepada AI" plus DM Instagram official "wajib menggunakan OpenSpec untuk generate code nya"). Round 01 UGM eksplisit themed "OpenSpec × AI", Round 03 inherits theme. Demo dataset dipilih fork yang punya `openspec/` directory pre-populated untuk full Refactor Mode flow, atau di-init fresh saat Day 0 prep.

**Workflow Council → Metis → Designer → Orches → Pan ALSO mandatory pakai OpenSpec** untuk satisfy Refactory rule "wajib spesifikasi sebelum AI generate code". Tapi panitia eksplisit minta **dual-folder OpenSpec strategy** (dikonfirmasi pre-event), karena output OpenSpec dari workflow agentic Ghaisan bakal banyak (puluhan plus ratusan markdown) plus bisa confuse panitia saat baca spec feature utama:

**Folder A: `openspec/` (PANITIA-FACING, PRIMARY SPEC)**
- Di project root, canonical OpenSpec layout (`openspec/changes/<change-name>/`, `openspec/specs/<domain>/`, `openspec/archive/`)
- Content: spesifikasi fitur Codeplex Chronicle (declaration awal saat planning, perubahan plan, penambahan plus pengurangan fitur)
- Audience: **panitia Refactory yang baca pasca-hackathon untuk evaluate Technical Execution lens**
- Source: Wave 0 initial spec dari PRD output Council hari-H, plus Refactor Mode product feature change folder yang Athena generate live (user-triggered, in-app), plus scope shift updates dari Orches/Pan worker saat add/remove feature

**Folder B: `.agent-openspec/` (INTERNAL WORKFLOW, AGENT OUTPUT)**
- Hidden via dot-prefix, signal "internal tooling"
- Content: seluruh output OpenSpec dari workflow agentic Council/Metis/Designer/Orches/Pan plus semua workers (Pythia contracts, Hephaestus prompts, Wave plans, internal scratch spec, agent coordination markdown)
- Audience: **internal workflow only**, BUKAN consume panitia
- Source: setiap agent worker yang pakai OpenSpec untuk planning task mereka selama Wave 0-3 execution

**Critical separation**: Folder A clean plus focused, panitia langsung lihat spec fitur tanpa noise. Folder B comprehensive internal log, agent boleh produce sebanyak mungkin tanpa polluting Folder A. Pattern E spec-drift detection (lihat Section I) track Folder A only, BUKAN Folder B.

### E.5. Multi-Repo Architecture

Tim engineering jarang punya satu repo. Architecture multi-repo jadi differentiator vs PM tool flat list yang ga punya konsep spasial multi-repo.

**MVP scope (Opsi A): one repo = one city, dropdown switcher.** Tiap repo render sebagai kota terpisah, user pakai Region Selector di top nav untuk switch antar kota. Demo dataset 2-3 repo pre-loaded plus pre-cached. Switching kota animasi smooth (camera zoom-out plus zoom-in ke kota baru), BUKAN page reload.

**Long-term vision (Phase 2): hierarchy 3-level.** Country/Region (GitHub organization atau workspace, overview map semua kota terlihat dengan jarak antar kota proporsional ke dependency proximity) + City (repo individual) + District (top-level folder dalam repo) + Building (file). Cross-repo dependency visible sebagai inter-city bridge, sprint goal yang span multi-repo tracking-able lewat Dashboard cross-city aggregation.

### E.6. Build From Scratch Mode (In-Memory Virtual FS)

Selain "Import a repository", user juga bisa **"Build from scratch"** dari entry page. Tagline screenshot: *"Start on an empty plot. The city grows in real time as you type."*

Implementation: **in-memory virtual filesystem**, BUKAN local fs access (drop, butuh permission flow yang awkward demo). Empty city render saat user click "Begin", in-app text editor (mini IDE inline) muncul, user create file via web UI, file lives in browser memory. Setiap file create real-time trigger building grow animation di kota. Optional later "Save to GitHub" action via OAuth (export virtual fs ke real GitHub repo).

Demo-friendly untuk hari-H: judges yang run product themselves bisa coba "build from scratch" tanpa GitHub repo, instant visual gratification.

---

## F. AI Residents (5 Residents, Iris Dropped)

Filosofi (LOCKED): AI berperan sebagai narrator + navigator + summarizer + proposal author dengan execution di sandbox. BUKAN analyzer otoriter, BUKAN autonomous decision-maker landing production. 5 specialized residents tinggal di landmark buildings yang relevan dengan domain mereka. User klik building atau broadcast pertanyaan, agent yang relevan respond.

**LLM provider**: Gemini 2.5 Flash primary (TTFT 0.72s, output 194.8 t/s) + Gemini 2.5 Flash-Lite fallback (TTFT 0.29s, faster, cheaper) + semantic cache layer + pre-recorded canned response untuk top 10 demo questions. **Gemini 2.0 Flash dropped** dari fallback plan (deprecated 6 Maret 2026). 3 GCP API keys round-robin = ~30 RPM effective free tier.

**Defensive coding mandatory** untuk Gemini tool calling: wrap setiap call dengan try/except `MALFORMED_FUNCTION_CALL` (documented frequent failure), retry sekali simplified prompt, fallback Flash-Lite, fallback canned. Set `thinking_budget=0` untuk routing-only call (saves cost, latency, plus avoid most MALFORMED_FUNCTION_CALL cases). Validate `finish_reason ∈ {STOP, MAX_TOKENS}` plus JSON parses.

### F.1. Athena, City Hall (The Architect)

**Lokasi**: City Hall building (Greek temple silhouette dengan pillar columns plus pediment, iconic landmark distinct dari building biasa).

**Domain scope**: refactor planning, spec authoring, dependency awareness, structural decision.

**Behavior**: Athena adalah **OpenSpec proposal author dalam Refactor Mode workflow**. User describe intent in plain language ("add 2FA login", "extract payment service from monolith"). Athena run static analysis pada current codebase, identify affected files plus dependency, lalu propose **ghost buildings** di kota dengan suggested location plus connections. Side panel auto-generate OpenSpec change folder di **Folder A `openspec/changes/<change-name>/`** (panitia-facing, BUKAN Folder B internal) berisi proposal.md (ADDED/MODIFIED/REMOVED requirements), design.md (approach + reasoning + alternative considered), tasks.md (checkbox actionable).

**Critical filosofi**: Athena tidak unilateral landing production. Semua proposal melewati 2 human review gate:
1. **Review proposal** sebelum execute (user baca proposal+design+tasks di side panel)
2. **Review simulation result** sebelum accept (user lihat ghost-to-solid animation selesai, baca diff, decide accept atau discard)

Tiap proposal grounded di static analysis output, BUKAN AI ngarang. Untuk repo tanpa `openspec/` directory, Athena fallback ke generate GitHub Issue draft dengan structured body (proposal-style content).

### F.2. Apollo, Hospital (The Doctor)

**Lokasi**: Hospital building (cross-shaped tower, iconic landmark).

**Domain scope**: code quality, complexity, test coverage, technical debt detection.

**5 deterministic detectors yang Apollo monitor**:
1. **Hardcoded secrets** (regex + entropy check via gitleaks pattern)
2. **Outdated dependencies** (parse manifest files + cross-check OSV API untuk known CVE)
3. **Missing auth on protected routes** (parse decorators/middleware, multi-language: TS/JS Express+Next.js, Python FastAPI+Flask+Django, Go Gin+Echo, Java Spring, Rust Actix)
4. **Unsafe SQL patterns** (parse queries, detect raw concatenation, multi-language)
5. **Complex untested files** (radon cyclomatic complexity threshold + test coverage stub via parse import test files)

**Behavior**: tiap finding trigger glow window di gedung yang affected dengan kategori warna (merah = critical, orange = high, yellow = medium). Apollo prescribe fix dengan **evidence chain**: cite exact file path, line number, static analysis output. Apollo TIDAK ngarang fix, dia surface evidence plus suggest direction. Finding bisa di-route ke 2 destination via Hybrid Write (lihat Section J).

### F.3. Argus, Police Station (The Watcher)

**Lokasi**: Police Station building (surveillance camera tower geometry, iconic landmark).

**Domain scope**: security scanner + vulnerability triager. Domain overlap dengan Apollo tapi specialize ke security: secret detection, vulnerability triage, auth route check.

**Findings dari**: gitleaks (secret pattern), OSV (CVE database), plus custom auth route checker.

**Beda dengan Apollo**: Apollo broader-health (semua aspect health), Argus security-deeper (lebih granular triage per finding, severity scoring CVSS, exploit potential analysis).

**Argus output**: structured vulnerability report dengan severity, exploit pattern (kalau ada di public CVE), suggested mitigation dengan reference ke advisories, evidence chain. Severe finding (e.g., complex untested service yang butuh refactor) bisa di-escalate ke Athena untuk OpenSpec proposal (Hybrid Write Layer 2 di Refactor Mode), BUKAN cuma di-create sebagai issue.

### F.4. Clio, Library (The Historian)

**Lokasi**: Library building (open book stack vertical, iconic landmark).

**Domain scope**: git archaeologist + sprint retrospective narrator + multi-mode prose narration.

**Catatan**: Iris (Observatory resident) yang sebelumnya direncanakan sebagai dedicated narrator agent **DI-DROP**. Multi-mode narration responsibility distribute ke Clio (untuk git/spec-drift/activity context), Apollo (untuk health finding context), Athena (untuk refactor proposal trade-off context).

**Use case primary**:
- Sprint retrospective replay (60-detik cinematic flythrough kota dengan animation perubahan sprint terakhir + Clio narration)
- Daily standup view (visualize aktivitas 24 jam terakhir dengan hotspot heatmap)
- Code archaeology (user click gedung lama, Clio narrate evolusi file)
- Onboarding context (combine dengan Hermes tour untuk historical perspective per district)
- **Spec-drift narration** (deterministic detector flag retak/ghost building, Clio narrate prosa kenapa retak berdasarkan timestamp + event metadata)

**Data dari**: git metadata (deterministic). LLM hanya narrate prosa, BUKAN analyze atau hypothesize. Semua angka dan fact berasal dari deterministic source. Contoh narasi Clio untuk spec-drift:
> *"Building auth/oauth.ts retak karena Pattern A: issue #234 closed 8 bulan lalu tapi file ini masih di-edit 12x dalam 3 bulan terakhir. Kemungkinan implementation drifted dari original spec issue. Reviewer terakhir: @hafiz, last commit: 2 minggu lalu."*

Semua angka (8 bulan, 12x edit, 3 bulan, dst) berasal dari deterministic source. LLM hanya menyusun prosa naratif.

### F.5. Hermes, Tourist Info (The Guide)

**Lokasi**: Tourist Info building (cube glass beacon, iconic landmark).

**Domain scope**: codebase tour generation, narrative-driven exploration, onboarding guide.

**4 variant tour yang Hermes generate**:
1. **"Give me 30-second tour"** (new hire generic, Hermes pick top-3 distrik kunci by ownership concentration + recent activity)
2. **"Tour for sprint goal X"** (sprint kickoff, Hermes baca sprint goal dari Milestone description)
3. **"Tour for feature Y"** (deep dive, Hermes follow dependency graph dari entry point feature)
4. **"Tour as @username"** (cross-onboarding, Hermes pick distrik yang user X own atau frequent contribute)

**Behavior**: Camera fly otomatis lewat distrik-distrik kunci, gedung penting glow saat dilewati, Hermes narate via text. Tour script generated dari deterministic codebase analysis (ownership, dependency, recency). Hermes narrative wrap structured data jadi prosa engaging. User boleh pause tour mid-flythrough untuk explore manual, lalu resume ke next stop.

---

## G. Product Modes (5 Modes)

5 mode complementary yang share underlying 3D city plus AI residents. Mode switcher di top nav.

### G.1. Mode 1: Onboarding Mode

**Hero use case**: new hire scenario.

**Flow**: Engineer baru join repo, klik Hermes (Tourist Info), type *"give me a 30-second tour."* Camera fly otomatis lewat distrik-distrik kunci yang Hermes pick (top-3 by ownership concentration + recent activity), gedung penting glow saat dilewati, Hermes narate via text. Ending summary: *"this codebase has 3 districts you'll touch most: auth, payment, api. Your starting point: auth/login.ts. Owner contact: @hafiz."*

**Optional extension**: combine dengan Sprint Mode untuk goal-aware tour (*"this sprint we're touching auth + payment, here's your scoped intro"*), atau dengan Activity Mode untuk historical context (*"your colleagues have been most active in payment district last month"*).

**Outcome promise**: engineer baru bikin peta mental kebentuk dalam 30 menit, BUKAN 2 minggu.

### G.2. Mode 2: Sprint Mode (HERO)

**Hero use case**: agile workflow, ticket overlay, spatial PM workspace.

**Flow**: Active sprint (= GitHub Milestone) scope di-overlay di kota. Mode ini transform kota dari "static codebase view" jadi "live agile workspace" tanpa user pindah ke tools lain (Jira, Linear, dst).

**14 PM concept mapped to visual** (toggle-able overlay layer, dapat di-filter by status):

| Konsep Agile / PM | Visual di Codeplex Chronicle |
|---|---|
| Story / Task aktif | Scaffolding mengelilingi gedung |
| Open PR di file | Crane animasi naik turun saat review berjalan |
| Story di backlog | Blueprint pin floating di atas slot kosong / district |
| Story Done sprint ini | Gedung dengan glow hijau muda (transient 24 jam) |
| Story Blocked | Yellow tape + warning icon di gedung |
| Bug / open issue type=bug | Asap atau retak visual di gedung |
| Story Points (estimasi) | Size badge di scaffolding (S/M/L/XL via labels) |
| Sprint Goal | Banner besar di City Hall |
| Epic | District yang di-highlight border-nya, flag epic di tengah |
| Definition of Done | Checklist floating di atas building under construction |
| Code Review (PR open) | Inspector NPC orbit gedung sampai approved |
| Dependency / Blocks | Red glowing bridge antar gedung (vs normal road = import) |
| Refactor proposal (Athena) | Ghost building transparent dengan animated dashed outline |
| Spec drift | Retak visual di gedung dengan crack pattern per pattern A-E |

**PR comment surfacing on building** (NEW feature, dari Hafiz industry feedback): comment di line of code visible sebagai annotation pada gedung. PR pending dengan unresolved comment dapat visual indicator (sticky note plus badge angka comment unread). Visual approach final di-decide oleh Designer-v1 hari-H. Use case real: PR pending blocked by comment = common bottleneck workflow engineering, lu surface-kan visual jadi langsung kelihatan tanpa harus check GitHub native.

**Click building → Ticket Panel**: gedung dengan scaffolding membuka ticket panel: assignee, story points (dari label convention size:S/M/L/XL), status (To Do / In Progress / In Review / Done mapped ke issue state + label), linked PR. Workflow state visual: foundation → frame → painting → finished mapping ke ticket lifecycle.

**PR-to-Building Auto-sync (real-time webhook)**:
- Events subscribe: PR opened, PR review requested, PR review approved, PR merged, PR closed
- State changes propagate ke building dalam < 5 detik
- Event mapping:
  - PR opened → crane appears at building
  - Review requested → inspector NPC orbit building
  - Review approved → green glow halo (transient 30 menit)
  - Merged → crane removes, building briefly glow green, scaffolding cleared
  - Closed without merge → crane removes, no glow, ticket panel update status
- Webhook receiver via FastAPI backend
- Event store di PostgreSQL untuk audit trail + observability (cycle time + lead time derive-able)

**Backlog Office (virtual building)**: special building di kota yang BUKAN represent file, tapi represent backlog. Berfungsi sebagai destination untuk Hybrid Write Layer 1 (Apollo finding → 1-click create issue). Animation: issue terbang dari building yang ada finding ke Backlog Office sebagai visual confirmation create success. Click Backlog Office membuka backlog panel: list semua open issues tanpa milestone, sorted by priority (label-based), filter by label/assignee/age. Story points roll-up.

Sprint Mode passive (read-only) untuk MVP, drag-ticket-antar-milestone defer ke Phase 2.

### G.3. Mode 3: Refactor Mode (SAFETY-FIRST)

**Hero use case**: spec-driven refactor exploration di sandbox.

**Flow**:
1. **Intent input**: User type intent ("I want to add 2FA to login", "extract payment service from monolith")
2. **Athena think**: visual animation indicating processing
3. **Ghost buildings appear**: 3 ghost buildings di kota dengan suggested location + connections ke existing buildings. Ghost buildings transparent dengan animated dashed outline yang signal "proposed, not yet existing"
4. **Side panel auto-generate OpenSpec change folder live**: proposal.md (ADDED Requirement 2FA), design.md (JWT + TOTP approach, justification, alternative considered), tasks.md (6 checkboxes actionable). User review proposal di side panel atau buka di IDE native via deep link
5. **Clio narrator (BUKAN Iris, Iris dropped)** boleh narrate trade-off context (*"approach JWT punya advantage X, trade-off Y"*)
6. **Review gate 1**: User approve proposal, klik **"Run Simulation"** button (BUKAN langsung apply)
7. **Simulation execution**: Backend execute simulation via Gemini 2.5 Flash dengan multi-turn coordination (test generation first, lalu implementation generation, lalu diff serialization), output write ke `drafts/<simulation-id>/` folder (BUKAN production code). Real-time progress streaming ke UI: tests written first, implementation lands incrementally, ghost buildings turn solid frame-by-frame sebagai code lands
8. **Simulation complete**: ghost buildings fully solid, side panel show diff plus stats (files changed, lines added, tests passed). 2 button surface:
   - **"Accept changes"**: apply diff dari `drafts/<simulation-id>/` ke production code, commit, archive change folder (`/opsx:archive`), ghost building state become solid permanent di production
   - **"Done viewing simulation"**: keep simulation as draft di `drafts/` folder for later review atau eventual discard. Production code untouched. User boleh resume simulation later atau delete draft
9. **Review gate 2 implicit**: Step 8 button click adalah final approval gate

**Critical safety design**: production code HANYA berubah di Step 8 saat user explicit click "Accept changes". Sebelum itu, semua eksekusi jalan di sandbox `drafts/` folder. AI explore freely tanpa risiko production break.

**Mirror workflow OpenSpec**: Refactor Mode mirror workflow OpenSpec yang sudah practice di tim engineering: propose, review, apply (di sandbox), accept-or-discard, archive. Mode ini visualize workflow itu spatial, BUKAN introduce new methodology. Athena tidak unilateral landing kode, semua proposal review-gated.

**Defensibility di Q&A juri**: *"this is how we develop, we made it spatial. AI explores in drafts, you commit to production."*

### G.4. Mode 4: Activity Mode

**Hero use case**: git-backed engineering intelligence.

**Flow**: Visualisasi aktivitas berbasis git history:
- **Ownership concentration per distrik** (heatmap warna by primary contributor)
- **Contributor heatmap** (overlay nama contributor di gedung mereka own)
- **Hotspot perubahan** (gedung yang paling sering di-edit recent period glow lebih intens)
- **Evolution timeline scrubber** (lite version dari Time Mode, scrub last 30/60/90 days)

**Use case primary**:
- Daily standup ("show me last 24h activity")
- Sprint retro (60-second flythrough perubahan sprint dengan Clio narration)
- Onboarding context ("show me what your colleague @username has been working on")
- Performance review prep ("summarize my contributions last quarter")

**Time Mode versi full** (multi-year scrub dengan epoch detection auto-detect "The TypeScript Migration Era", "Scaling Era", "Spec-Driven Era") parkir di Phase 2.

### G.5. Mode 5: Health Mode

**Hero use case**: code health diagnostic view.

**Flow**: Switch ke Health Mode, kota berubah jadi diagnostic view. Gedung dengan glow merah punya critical finding, glow orange high, glow yellow medium. 5 deterministic detectors dari Apollo (lihat Section F.2) trigger glow window per kategori warna.

**Click Apollo → Findings Panel**: list semua glow buildings beserta kategori. Click specific finding membuka **evidence panel**: file path, line number, static analysis output, suggested mitigation direction. User decide treatment per finding.

**Hybrid Write Layer 1**: dari findings panel, user klik *"Convert to Backlog Ticket"* button. Backend POST ke GitHub API (create issue endpoint). Issue baru muncul di Backlog Office dengan flying animation. Issue body pre-filled dengan evidence chain. Detail di Section J.

**Apollo + Argus Complementary Triage**: Apollo broader health (semua 5 detector), Argus security-deeper (granular triage per security finding dengan CVSS scoring, exploit potential analysis). User boleh route Apollo finding yang security-related ke Argus untuk deeper triage.

---

## H. Visual Mapping (Foundation + PM Overlay + Effects)

### H.1. Foundation Mapping (Static Analysis Deterministic)

| Element | Mapping |
|---|---|
| Gedung | File (tinggi proporsional ke LOC, dengan non-linear scaling untuk reach NYC/Dubai-tier verticality untuk file >500 LOC) |
| District | Folder/module |
| Jalan glowing antar gedung | Import dependency |
| Pohon antar district | Density map ke test coverage (district well-tested rimbun, tanpa test botak) |
| Default warna gedung | Ownership (CODEOWNERS file kalau ada, fallback git blame aggregation) |
| Toggle warna alternative | Language atau recency commit |

**Layout**: treemap deterministic, BUKAN force-directed (yang berantakan di 3D). Performance-aware via LOD (level of detail), instancing, plus frustum culling untuk repo besar.

**Click building**: zoom-and-focus dengan side panel auto-open berisi contributor detail, recent commits, linked issues (active + closed), open PR status, file metadata (LOC, complexity, last edited). ESC kembali ke overview camera.

### H.2. Living City Visual Quality Bar (Non-Negotiable Baseline)

Visual baseline yang bikin kota terasa hidup, BUKAN render statis. Layer-layer stacked:

- **Glowing windows random pattern** di tiap gedung (file aktif glow lebih banyak, file idle window mati)
- **Hot files** (sering di-edit) glow effect lebih intens
- **Fog atmospheric** (Dubai-haze tier, density curve agresif di distance)
- **Particles ambient** (3-tier layered Sparkles)
- **Camera idle drift cinematic** kalau user tidak interact > 10 detik
- **Post-processing pipeline**: Bloom (mipmapBlur=true) + DepthOfField + ChromaticAberration + Vignette + Noise + ACES Filmic ToneMapping
- **HDRI sunset environment**
- **3 directional light** dengan shadow mapping

**Non-negotiable**: visual quality bar ini differentiator yang bikin kota Codeplex Chronicle beda dari kompetitor (CodeCity, CodeCharta, SoftwareCity yang semua render statis). Tanpa baseline ini, kota cuma diagram 3D. Wajib selalu shipped.

**Visual ambition target**: NYC/Dubai-tier verticality plus iconic landmark architecture per resident (Athena Greek temple, Apollo cross-shaped, Argus surveillance tower, Clio book stack vertical, Hermes glass beacon cube). Per Eos lens push (lihat Section R), 4 stretch vector mandatory:
1. **Cinematic intro 5 detik first load**: camera glide low altitude dari laut/jauh masuk city center, residents wake-up sequence (lights turn on di landmark buildings)
2. **Verticality hero gedung skyscraper**: file >500 LOC pakai 2x current max height, custom tapered geometry (BoxGeometry + CylinderGeometry top section), spire antenna emissive
3. **Iconic landmark architecture per resident** (5 distinct geometry, sebagai listed di Section F)
4. **Director mode auto-fly through 5 highlights**: pitch sendiri tanpa manual click. Wave 3 polish, super valuable saat pitch judges + saat rehearsal

**Stretch tier 2 (welcomed kalau performance allow)**:
- **Flying cars** (THREE.InstancedMesh ~30 cars on path looping along glowing yellow paths, color per microservice represent inter-district API call live)
- **Window pattern variety hot/cold encoding** (file aktif dense window plus warm tint, idle sparse plus cold blue tint)
- **Earthquake error visual** (tagline lock: *"errors become earthquakes you can feel"*): saat error condition trigger di codebase (e.g., Apollo detect critical finding cluster, atau spec-drift Pattern E detect commit hook bypass), gedung shake plus particle debris plus ground crack pattern. Visual punch tinggi.
- **Weather effects** (thunder kalau active error rate spike, sunny di healthy district, fog kalau service degraded, snow kalau service in maintenance)

**Performance ceiling per research kami (r3f docs + Codrops SINGULARITY benchmark)**:
- 200-500 InstancedMesh buildings via single draw call = within budget
- 60fps target di MacBook Pro M-series demo laptop = realistic
- Drop-first order kalau regress: DepthOfField first (single biggest cost), Sparkles tier 3, salah satu directional shadow
- JANGAN drop ChromaticAberration (cheap plus adds cinematic punch)
- **Recommendation**: raw `<instancedMesh>` dengan imperative `setMatrixAt()` untuk 200-300 building (BUKAN Drei `<Instances>` per-instance JSX, slower per issue #3306). Untuk 30 flying car Drei `<Instances>` masih OK karena small count
- **Performance tooling**: drop `<Perf />` r3f-perf overlay di dev mode untuk benchmark realtime, wire `state.performance.regress()` ke OrbitControls plus GSAP camera arc events untuk auto-drop pixel ratio saat moving (cheap +20-30% perf)
- **Feature flag killswitch** mandatory: 3 toggle (`ENABLE_DOF`, `ENABLE_SPARKLES_TIER_3`, `ENABLE_THIRD_DIRECTIONAL_LIGHT`) untuk runtime drop kalau demo lag

---

## I. Spec-Drift Visualization (5 Patterns)

Codebase visualize gap code-as-implemented vs code-as-specified. Differentiator philosophical: *"other tools tell you what is in your code, we tell you what your code promised vs what it actually delivered."*

### I.1. OpenSpec First-Class + GitHub Issues Fallback

**First-class** (kalau repo punya `openspec/` directory di Folder A panitia-facing):
- OpenSpec sebagai source of truth (Folder A `openspec/`)
- Tiap change folder (`openspec/changes/<change-name>/`) berisi proposal.md + design.md + tasks.md, di-track sebagai active proposal
- Athena Refactor Mode generate change folder via `/opsx:propose`, write ke Folder A
- `/opsx:apply` trigger Gemini multi-turn simulation execution (test gen → implementation gen → diff serialization), output write ke `drafts/`
- `/opsx:archive` merge ke source of truth saat user accept changes

**Fallback** (kalau repo tidak punya `openspec/`):
- GitHub Issues sebagai informal spec source
- Issue body = description of intent
- Linked PR = implementation attempt
- Athena fallback generate GitHub Issue draft dengan proposal-style content

**Pattern**: progressive degradation (OpenSpec default, GitHub Issues fallback). Demo dataset pre-loaded mix repo dengan dan tanpa OpenSpec untuk show both flows.

### I.2. 3 Building States

| State | Definisi | Detection |
|---|---|---|
| **Solid (normal)** | File eksis di repo + ada PR yang touch file + PR link ke issue yang merged/closed-positively, OR change folder archived. | Pure metadata join |
| **Ghost building** | Path mentioned di proposal/issue body/title (regex detect path-like seperti `auth/login.ts`), proposal/issue di milestone aktif, tapi path belum eksis di filesystem. Ghost building muncul di koordinat yang seharusnya, transparent dengan animated dashed outline. | Pure regex + filesystem check |
| **Retak (cracked) building** | 5 deterministic patterns yang signal drift (lihat tabel Section I.3) | Pure deterministic detection |

### I.3. 5 Retak Patterns

| Pattern | Definisi | Sinyal |
|---|---|---|
| **A. Stale closed issue** | Issue closed >6 bulan lalu, tapi file yang mention di issue terus di-edit setelah closed | Issue dianggap selesai tapi kerjaan masih jalan |
| **B. Closed without merge** | Issue closed tanpa ada PR yang merge dan touch file relevan | Issue ditutup mungkin karena tidak relevan, tapi spec tetap di tracker |
| **C. Spec-implementation lag** | Issue closed dan file di-touch, tapi gap antara closed timestamp dan file last commit > X bulan (configurable) | Implementation drifted dari original spec |
| **D. Reopened cycle** | Issue di-reopen ≥ 2x atau ada multiple closing PR yang reverted | Spec keeps changing, building unstable |
| **E. OpenSpec drift** | Commit yang touch file referenced di archived OpenSpec change tapi commit message tidak include `opsx:` prefix | Hook bypass atau merge dari branch tanpa workflow-guard |

### I.4. Clio Narrator Role (LLM as Storyteller)

Deterministic detector flag retak. Clio narrate prosa berdasarkan timestamp + event metadata dari detector output. Semua angka dan fact berasal dari deterministic source. LLM hanya menyusun prosa naratif.

**Filosofi compliance**: AI sebagai storyteller, BUKAN judge. Patterns extensible: future pattern bisa ditambah tanpa engine architecture change.

---

## J. Hybrid Write Strategy (2 Layers + Drop Protocol)

Spectrum write capability: read-only / hybrid 1-action / hybrid 2-action / full write. Codeplex Chronicle pilih **hybrid 2-action** dengan fallback protocol ke read-only.

### J.1. Layer 1: Apollo Finding → 1-Click GitHub Issue (Low Risk)

**Flow**:
1. Apollo detect tech debt finding di file (e.g., hardcoded secret, outdated dep)
2. Side panel surface finding dengan evidence chain
3. User klik *"Convert to Backlog Ticket"* button
4. Backend POST ke GitHub API (create issue endpoint)
5. Issue baru muncul di Backlog Office dengan flying animation
6. Issue body pre-filled dengan evidence chain: file path, line number, static analysis output, suggested label (bug/security/tech-debt)
7. User boleh edit di GitHub native sebelum confirm submission, atau langsung submit dari panel

**Implementation safety net**:
- **Optimistic UI**: visual gerak langsung, rollback kalau API gagal
- **Feature flag** `ENABLE_WRITE_OPS=true/false` di environment. Toggle = entire write disable. Demo fallback ga perlu re-deploy
- **Mock-able from day 1**: backend create-issue endpoint punya 2 mode (real GitHub API + mock fake success). Toggle via env
- **Build read-only first**: Wave 1-2 ship full read-only flow. Hybrid layer di-add paling akhir di Wave 3. Drop = disable layer atas, foundation utuh

### J.2. Layer 2: Refactor Mode Simulation Execution to drafts/ (Medium Risk, High Reward)

**Flow** (detail di Section G.3 Refactor Mode):
1. Athena propose ghost building + auto-generate OpenSpec change folder
2. User review proposal di side panel
3. User klik **"Run Simulation"**
4. Backend execute simulation via Gemini 2.5 Flash (`/opsx:apply` execution): Gemini receive proposal+design+tasks context, generate code edit plan plus generated test plus implementation, output streamed back ke backend
5. Output write ke `drafts/<simulation-id>/` folder (BUKAN production)
6. Real-time streaming UI: tests written first, implementation lands, ghost-to-solid frame-by-frame
7. Simulation complete: 2 button surface (Accept changes / Done viewing simulation)
8. **Accept**: apply diff ke production, commit, `/opsx:archive`
9. **Done viewing**: keep as draft, production untouched

**Layer 2 lebih heavy daripada Layer 1**: butuh Gemini multi-turn coordination (proposal → test gen → implementation gen → diff serialization), OpenSpec runtime integration, real-time streaming UI. Tapi visual demo wow paling tinggi (ghost-to-solid live animation real, BUKAN pre-recorded).

**Cost**: $0 (Gemini 2.5 Flash free tier 30 RPM effective dengan 3 keys round-robin, more than enough untuk demo flow 1-2 simulation trigger). NO Claude API call required di runtime untuk Refactor Mode execution.

**Feature flag** `ENABLE_WRITE_OPS_LAYER_2` separate dari Layer 1, individually toggleable.

### J.3. Drop Protocol (Decision Tree Branch 7)

Cut-over criteria sebelum hari-H. Tanpa kriteria yang jelas, lu bakal stuck di limbo *"harus stop atau push terus"* pas jam 03:00 capek.

#### Layer 1 (Hybrid Write Apollo→Issue) Drop Protocol

**Layer A: Timing Checkpoints (Hard Gates)**

| Waktu | Status check | Cut criteria |
|---|---|---|
| Mid Wave 3 (backend integration phase) | OAuth flow jalan? Read API call ke GitHub jalan? | Kalau read foundation goyang → DROP hybrid sekarang. Write dibangun above read |
| Late Wave 3 | Read pipeline end-to-end demoable? | Kalau Wave 3 mid masih struggle dengan read → DROP. Write tidak feasible kalau read belum |
| Pre-deploy gate | Apollo finding output konkret? Create-issue endpoint backend exist? | Kalau Apollo finding belum konkret atau endpoint belum exist → DROP |
| Post-deploy gate | Hybrid flow end-to-end clickable, walaupun kasar? | Kalau ada bug fundamental di flow → DROP |
| Final gate (scope freeze) | Hybrid flow stable untuk demo (3x consecutive successful run tanpa bug)? | Kalau ga stable → DROP NON-NEGOTIABLE |

**Layer B: Signal-Based Triggers (Anytime)**:
- **A. GitHub OAuth scope issue**: write scope ditolak user, atau test account ga punya write permission, atau token refresh masalah → DROP
- **B. Rate limit hit during testing**: Wave 3 testing udah hit GitHub rate limit (5K/hour) → DROP
- **C. 2 consecutive failed integration attempts**: wire Apollo finding → create issue UI 2x dan fail (bug berbeda tiap kali) → DROP
- **D. Worker stuck > 30 menit on write API**: cost tinggi → DROP
- **E. Demo flow inconsistent**: 3 trial run tidak konsisten → DROP. Demo hari-H pasti hadirkan kondisi yang kurang ideal
- **F. Burnout signal**: operator frustrated 1+ jam karena write API debugging → DROP. Polish quality > scope completeness

**Layer C: Decision Protocol (kalau hit trigger)**:
1. **Pause + Confirm dengan partner operator** (5 menit, sleep cycle aware)
2. **Feature flag, jangan delete**: toggle `ENABLE_WRITE_OPS=false`. UI tetap punya *"Convert to Ticket"* button di Apollo finding, onclick redirect ke GitHub native dengan pre-filled body. Code write masih ada untuk Phase 2. Reversible kalau ternyata ada waktu fix
3. **Update demo script** (15 menit): demo script update *"User klik 'Convert to Ticket' → opens GitHub native dengan pre-filled body"* instead of direct create. Pitch line ganti: *"Apollo detect issue → 1-click prepare GitHub issue with full evidence chain pre-filled"*
4. **Communicate ke V1 Orch**: update orchestrator chat eksplisit. Jangan silent drop
5. **Redirect saved time ke Visual Quality Bar**: time yang dihemat → polish glowing windows, fog, particles, camera idle drift. Differentiator visual yang juri akan ingat lebih dari fitur

#### Layer 2 (Refactor Mode Simulation) Drop Protocol

**Layer A: Timing Checkpoints**:
- **Mid Wave 2** (modes implementation): Athena ghost building visual jalan? OpenSpec change folder generation jalan? Kalau belum → consider DROP simulation execution, keep ghost building visual + side panel auto-generate proposal/design/tasks (no real `/opsx:apply`)
- **Mid Wave 3** (backend integration): Gemini multi-turn coordination feasible? `drafts/` folder write working? Kalau belum → DROP `/opsx:apply` execution, demo Refactor Mode = display proposal only (read-only proposal display, no simulation, no accept-or-discard buttons)
- **Pre-demo rehearsal gate**: simulation flow end-to-end stable (3x consecutive successful)? Kalau ga → DROP simulation, fallback ke proposal display only

**Layer B: Signal-Based Triggers**:
- Gemini turn drop atau hang > 30 detik → DROP (timeout aggressive)
- Generated test fail produce passing run 2x consecutive → DROP
- Ghost-to-solid animation glitchy (flicker, jump, miss frame) → DROP visual fallback ke pre-scripted timeline
- OpenSpec `/opsx:apply` malfunction (Gemini malformed output, MALFORMED_FUNCTION_CALL persistent) → DROP, fallback ke pre-scripted simulation result

**Layer C: Decision Protocol**:
- DROP Layer 2 → Refactor Mode jadi read-only proposal display: Athena propose, ghost building muncul, side panel show proposal/design/tasks, BUT no "Run Simulation" button. Pitch line ganti: *"Athena propose refactor with full OpenSpec change folder. In production, this proposal goes to /opsx:apply for sandbox execution. Today we're showing the proposal flow."*
- Visual demo punch berkurang tapi filosofi compliance tetap kuat
- Time saved redirect ke polish Sprint Mode visual

### J.4. Decision Matrix Singkat

| Faktor | Read-Only Only | Layer 1 Only | Layer 1 + Layer 2 (rekomen) |
|---|---|---|---|
| Engineering risk | Low | Low-Medium | Medium |
| Demo wow | Solid 7/10 | Strong 9/10 | Stronger 9.5/10 kalau flawless |
| Demo failure risk | Negligible | Low | Medium |
| Pitch defensibility | Medium | High | Very High (full Refactor Mode story) |
| Time to polish visual | Most | More | Less |
| Realistic 24-jam | Very feasible | Yes | Tight tapi feasible kalau workflow agentic disciplined |

---

## K. Tech Stack (LOCKED, Final)

Tech stack di-lock dari sekarang berdasarkan brainstorming pre-event plus mandatory tech stack Refactory Hackathon (per website Refactory plus FAQ konfirmasi). **Tidak boleh ada substitution atau alternative tech stack di hari-H** kecuali ada surprise rule baru dari panitia.

### K.1. Mandatory Tech Stack per Refactory Rule

Refactory eksplisit list 4 tech stack mandatory di website (Section "Technologies & Tools") plus FAQ ("all are mandatory"):

| Tech | Status Refactory | Implementation di Codeplex Chronicle |
|---|---|---|
| **OpenSpec** | MANDATORY foundation | Fission-AI/OpenSpec v1.0+ stable, `core` profile, dual-folder strategy per panitia request. Folder A `openspec/` (panitia-facing, canonical layout `openspec/changes/`, `openspec/specs/`, `openspec/archive/`, source: Wave 0 initial spec + scope shift + Refactor Mode product feature change folder). Folder B `.agent-openspec/` (internal workflow, agent output dari Council/Metis/Designer/Orches/Pan + workers, BUKAN consume panitia) |
| **LLMs** | MANDATORY | Gemini 2.5 Flash primary (free tier) + Gemini 2.5 Flash-Lite fallback. NO OpenAI, NO Anthropic API di runtime (Anthropic Claude HANYA di build-time workflow agentic via Max plan) |
| **Kubernetes** | MANDATORY | Pre-provisioned by Refactory, namespace `duopoly`, domain `duopoly.hackathon.sev-2.com` configured ingress. Deploy via Docker image push ke registry plus `kubectl apply -f` |
| **PostgreSQL** | MANDATORY | Pre-provisioned by Refactory, credentials di team folder `duopoly`. Cache layer + ticket state + event store untuk cycle time/lead time observability |

### K.2. Frontend Stack

| Layer | Stack | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js | 16 (App Router) | React 19 dependency satisfied |
| **Language** | TypeScript | 5.x | Strict mode |
| **UI library** | React | 19 | r3f@9 requirement |
| **3D rendering core** | Three.js | 0.184 | Pinned version, NOT auto-update |
| **3D React binding** | @react-three/fiber | 9.6 | Pairing dengan React 19 |
| **3D helpers** | @react-three/drei | latest stable | Environment, Sparkles, OrbitControls, PerspectiveCamera, Outlines |
| **Post-processing** | @react-three/postprocessing | latest stable | EffectComposer dengan Bloom (mipmapBlur=true) + DepthOfField + ChromaticAberration + Vignette + Noise + ACES Filmic ToneMapping |
| **Camera animation** | GSAP | 3.x | Timeline-based camera arc untuk cinematic intro plus Director Mode auto-fly |
| **Performance overlay** | r3f-perf (`<Perf />`) | latest | Dev mode only, dropped di production build |
| **Styling** | Tailwind CSS | 3.x | Utility-first |
| **Charts (Dashboard View)** | Recharts atau Chart.js | latest | Designer-v1 decide hari-H. Default Recharts karena React-native |
| **GitHub frontend client** | octokit/rest.js | latest | Browser-side OAuth flow |

### K.3. Backend Stack

| Layer | Stack | Version | Notes |
|---|---|---|---|
| **Language** | Python | 3.12+ | Async/await native |
| **Web framework** | FastAPI | latest stable | Async, OpenAPI auto-doc, WebSocket support untuk real-time streaming |
| **ASGI server** | Uvicorn | latest | Production-grade |
| **Static analysis (multi-language)** | tree-sitter (Python binding) | latest | Grammar mandatory: TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift |
| **Diagram generation** | mermaid-py + graphviz + eralchemy | latest | Internal renderer pipeline, output JSON schema yang city renderer baca |
| **Security detector** | gitleaks pattern + OSV API | latest | Hardcoded secrets + outdated dependency CVE check |
| **GitHub backend client** | PyGithub | latest | Server-side webhook receiver plus issue creation |
| **LLM client (Gemini)** | google-generativeai (Python SDK) | latest | Gemini 2.5 Flash + Flash-Lite, 3 GCP keys round-robin |
| **Database ORM** | SQLAlchemy + asyncpg | latest | Async PostgreSQL |
| **Database migration** | Alembic | latest | Schema version control |
| **WebSocket** | FastAPI WebSocket | built-in | Real-time PR-to-building sync via webhook + simulation streaming |
| **Background task** | FastAPI BackgroundTasks atau Celery | TBD | TBD per Wave 3 decision saat backend implementation |

### K.4. AI Provider Stack (Pure Free Tier Locked)

| Layer | Stack | Notes |
|---|---|---|
| **AI provider primary** | Gemini 2.5 Flash | TTFT 0.72s AI Studio, output 194.8 t/s. `thinking_budget=0` untuk routing-only call |
| **AI provider fallback** | Gemini 2.5 Flash-Lite | TTFT 0.29s, faster, cheaper. Drop-in API replacement |
| **AI provider keys** | 3 GCP API keys round-robin | Effective ~30 RPM free tier (3x 10 RPM per key) |
| **AI defensive layer** | Semantic cache (cosine similarity 0.85 threshold) + pre-recorded canned response untuk top 10 demo questions | MALFORMED_FUNCTION_CALL mitigation |
| **AI tool-call defensive code** | try/except `MALFORMED_FUNCTION_CALL` + retry simplified prompt + fallback Flash-Lite + fallback canned | Mandatory wrap setiap tool call |

**EKSPLISIT: NO Anthropic API call di product runtime**. Refactor Mode simulation execution pakai Gemini 2.5 Flash multi-turn coordination (test gen → implementation gen → diff serialization). Anthropic Claude Code HANYA dipakai di build-time workflow agentic (Council→Metis→Designer→Orches→Pan), covered by Claude Max plan subscription tim Duopoly.

### K.5. Auth + GitHub Integration

| Layer | Stack | Notes |
|---|---|---|
| **OAuth provider** | GitHub OAuth App | Gratis, unlimited installation |
| **OAuth scopes** | `read:repo, read:issues, read:pull_requests, read:org, write:issues` | Read-only baseline + selective write untuk Layer 1 hybrid write |
| **Webhook receiver** | FastAPI endpoint dengan signature verification | Events: PR opened/review/merged/closed, issue created/closed |
| **Rate limit** | 5K req/hour per authenticated token | Free tier sufficient untuk demo scope |

### K.6. Deploy + Infra (Pre-Provisioned by Refactory)

| Layer | Stack | Notes |
|---|---|---|
| **Container** | Docker | Image push ke GitHub Container Registry (ghcr.io) atau Docker Hub |
| **Orchestration** | Kubernetes (managed by Refactory) | Namespace `duopoly`, kubeconfig di team folder |
| **Ingress** | NGINX Ingress (Refactory configured) | Domain `duopoly.hackathon.sev-2.com` HTTPS |
| **Database** | PostgreSQL (Refactory managed) | Credentials di team folder |
| **CI/CD** | GitHub Actions atau manual `kubectl apply` | TBD per Wave 3 implementation |

### K.7. Workflow Agentic (BUILD-TIME ONLY)

| Layer | Stack | Notes |
|---|---|---|
| **Orchestration** | Claude Opus 4.7 xhigh effort | Default per memory edit Ghaisan. HANYA untuk workflow agentic build (Council → Metis → Designer → Orches → Pan), BUKAN runtime product |
| **UI prompt platform** | claude.ai/design | Designer-v1 output 3 prompt: Landing Awwwards-tier, Entry, Dashboard |
| **Subscription** | Claude Max plan (Duopoly team) | Covered, no incremental cost |

### K.8. Cost Analysis (LOCKED $0 Product Runtime)

**Product runtime cost = $0 pure free** untuk hackathon scope plus production lifetime:

- Gemini 2.5 Flash + Flash-Lite free tier (3 keys round-robin = ~30 RPM, semua AI residents query, narration, plus Refactor Mode simulation execution)
- GitHub API free tier (5K req/hour authenticated user)
- Kubernetes pre-provisioned by Refactory (namespace `duopoly`)
- PostgreSQL pre-provisioned by Refactory
- Domain pre-configured `duopoly.hackathon.sev-2.com`
- Worst case $10-30 kalau butuh custom domain post-event

**Build-time eksekusi cost**: covered by Claude Max plan subscription tim Duopoly, ga ada incremental cost untuk hackathon execution.

**No paid LLM tier**, **no paid hosting**, **no paid GPU**, **no paid database**. Pure $0.

---

## L. Demo Dataset (LOCKED, R3 Strategy: Pure Seed)

Berdasarkan research kami pre-event yang pick NodeGoat + FastAPI template + PyGoat, plus pivot ke Sprint Mode hero (butuh active Milestones + realistic Backlog + size labels + linked PR + CODEOWNERS + recent contributor activity), strategy locked **R3 Pure Seed**:

### L.1. Day 0 Prep Action (Claude Code handle, BUKAN Ghaisan/Hafiz)

Claude Code execute Day 0 (10-11 Mei):
1. **Fork 3 repo** ke org Duopoly atau personal Ghaisan:
   - `OWASP/NodeGoat` → `duopoly/codeplex-demo-nodegoat` (hero Health Mode showcase, 5/5 OWASP detector fire authentic)
   - `fastapi/full-stack-fastapi-template` → `duopoly/codeplex-demo-fastapi-fullstack` (mirror Codeplex Chronicle stack, juri instant recognize)
   - `OWASP/PyGoat` → `duopoly/codeplex-demo-pygoat` (Python flavor fallback, Health Mode Python angle)
2. **Populate agile data** via GitHub API script:
   - Create 2-3 active Milestones per repo (e.g., "Sprint 14: Security hardening", "Sprint 15: Performance plus auth")
   - Populate ~15-25 issues per repo dengan label: `type=feature/bug/chore`, `size:S/M/L/XL`, `priority:high/medium/low`, `in-progress/in-review`
   - Assign issues ke fictional team members (placeholder username plus avatar)
   - Create ~5-8 open PR per repo linked ke issue (`Closes #N`)
   - Add CODEOWNERS file di setiap repo dengan ownership distribution
   - Create 2-3 closed issues dengan reopened cycle (untuk trigger Pattern D retak)
   - Create 1-2 issues dengan stale closed pattern (untuk trigger Pattern A retak)
3. **Init OpenSpec di demo repo Folder A** (product-level openspec yang panitia akan baca, di `codeplex-demo-fastapi-fullstack`):
   - `openspec init --tools claude --profile core` di repo root
   - Fill `openspec/project.md` ~250 line context
   - Create 2-3 archived `openspec/changes/` examples (untuk trigger Pattern E spec-drift kalau commit hook bypass)
   - **Note**: ini OpenSpec di-init di repo demo dataset (yang user import ke Codeplex Chronicle). Workflow agentic Ghaisan punya OpenSpec sendiri di Folder B `.agent-openspec/` di project root Codeplex Chronicle itu sendiri, terpisah
4. **Add closing slide screenshot bonus** untuk pitch:
   - Pre-render `tokopedia/gripmock` (Apache-2.0, Go ~50 files) sebagai bonus slide *"Codeplex Chronicle works on real Indonesian production code"*
   - Pre-render `gojek/courier-android` sebagai second bonus
5. **Cache parser output**: tree-sitter parse semua 3 demo repo, save building-graph JSON ke `/public/datasets/<repo-id>.json` untuk fast load

### L.2. Demo Dataset Selection per Mode

| Mode | Primary Demo Dataset | Secondary | Notes |
|---|---|---|---|
| **Onboarding Mode** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | FastAPI mirror stack, juri recognize, district split clean |
| **Sprint Mode (HERO)** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | Pure seed Milestones+issues+PR rich data |
| **Refactor Mode** | `codeplex-demo-fastapi-fullstack` (with `openspec/`) | - | Only one with OpenSpec init, full Refactor flow |
| **Activity Mode** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | Pure seed contributor data via fictional commit timeline |
| **Health Mode (HERO showcase)** | `codeplex-demo-nodegoat` | `codeplex-demo-pygoat` (fallback) | OWASP Top 10 fire 5/5 detector authentic |

### L.3. Risk Disclosure di Pitch

Honest disclosure kalau juri tanya: *"Demo dataset adalah fork repo public OWASP/NodeGoat dan fastapi/full-stack-fastapi-template yang kami populate dengan agile data realistic untuk demo. Repo asli tetap public di GitHub fork kami, lihat duopoly org. Production user akan import repo mereka sendiri via OAuth."*

---

## M. Demo Flow 2 Menit Final (Pitch Script)

10 menit per tim di final, tapi pitch core 2 menit punchy. Sisanya Q&A + technical depth.

### Opening Hook (15 detik)
> *"Engineer baru join codebase 100K LOC. Hari ini dia baca README, buka VSCode, lost di 200 file. Manager-nya minta velocity report, dia harus ke 3 tools beda. Kami satukan semua di satu kota."*

Layar buka Codeplex Chronicle landing page (Awwwards-tier visual), klik *"Import a repository"*, auto-load demo repo `codeplex-demo-fastapi-fullstack`. Cinematic intro 5 detik: camera glide low altitude masuk city center, residents wake-up sequence (lights turn on di Athena/Apollo/Argus/Clio/Hermes landmark buildings).

### Mode 1: Onboarding (25 detik)
Klik Hermes (Tourist Info). Type *"give me a 30-second tour."* Camera fly otomatis lewat 3 distrik kunci, Hermes narate via text, gedung penting glow saat dilewati. Ending: *"this codebase has 3 districts you'll touch most: auth, payment, api. Your starting point: auth/login.ts. Owner contact: @hafiz."*

### Mode 2: Sprint Mode (45 detik, HERO)
Switch ke Sprint Mode. Kota berubah: scaffolding muncul di gedung dengan active ticket, crane di gedung dengan open PR, banner sprint goal di City Hall (*"Sprint 14: Security hardening + auth"*), inspector NPC orbit gedung yang di review. Click gedung dengan scaffolding → ticket panel slide in (assignee, story points size:M, linked PR #45, status In Review). Show PR comment surfacing on building (sticky note dengan badge 3 unread comment).

Toggle ke Dashboard View → flat manager-facing view dengan velocity chart + burndown live + milestone progress.

> *"This is what we mean by spatial PM. Ticket lives where the work lives."*

### Mode 3: Refactor (30 detik)
Switch ke Refactor Mode. Type intent *"add 2FA to login flow."* Athena think 2 detik, 3 ghost buildings appear di kota (auth/oauth.ts, auth/totp.ts, auth/middleware.ts). Side panel auto-generate `openspec/changes/add-2fa/`: proposal.md, design.md, tasks.md live streaming.

Click *"Run Simulation"*. Real-time: tests written, implementation lands, ghost buildings turn solid frame-by-frame. Simulation complete: 2 button surface (*"Accept changes"* / *"Done viewing simulation"*). Click *"Done viewing simulation"*.

> *"AI explores in drafts. Production code only changes when you accept."*

### Mode 4: Health → 1-Click Ticket (25 detik)
Switch ke Health Mode dengan dataset `codeplex-demo-nodegoat`. 8 buildings glow merah/orange. Click Apollo (Hospital). *"What's wrong?"* Apollo respond: *"Hardcoded API key di config.ts line 12, missing auth on /admin route, payment.service.ts cyclomatic complexity 52."* Click *"Convert to Backlog Ticket"* pada finding pertama → animation issue terbang ke Backlog Office → live confirm di GitHub native (open di tab samping).

### Closing Punchline (10 detik)
> *"Flat ticket lists don't show where work lives. Static code maps don't show what's planned. Codeplex Chronicle is one map of cities: your codebase, your sprint, and the gap between what you planned and what you shipped, all in one place. AI explores in drafts, you commit to production."*

Closing slide: 2 screenshot bonus pre-rendered (`tokopedia/gripmock` + `gojek/courier-android`) dengan caption *"Works on real Indonesian production code."*

### Q&A Defense Cards (8 menit, prepared)

Anticipated questions plus answer:

| Question | Answer |
|---|---|
| "Scale to 1M LOC?" | *"Treemap deterministic + LOD + InstancedMesh + frustum culling. Demo 300 file plus 60fps. Theoretical scale 10K+ files dengan LOD aggressive, untested di production scale."* |
| "Private repo security?" | *"GitHub OAuth scope minimal: read:repo, read:issues, read:pull_requests, write:issues. Token never leaves user browser session. Code parsed di backend client-isolated, no cross-tenant leak."* |
| "How AI residents avoid hallucination?" | *"Semua insight grounded di static analysis output, git/ticket metadata, OpenSpec proposal, atau deterministic detector. AI sebagai narrator, BUKAN analyzer. Refactor Mode execute di drafts/ folder, BUKAN production. User explicit click Accept untuk apply ke production."* |
| "Why 3D city, not 2D graph?" | *"Spatial encoding bandwidth lebih tinggi dari graph. Verticality encode LOC, district encode folder, glow encode activity, scaffolding encode work-in-progress. Combined dimensions tell story 2D graph ga bisa."* |
| "Compete dengan Jira/Linear?" | *"BUKAN compete, complement. We piggyback GitHub Issues sebagai backbone, tim engineering existing workflow ga perlu pindah. We add spatial layer plus AI residents on top."* |
| "OpenSpec mandatory?" | *"OpenSpec first-class kalau repo user punya `openspec/`. Repo tanpa OpenSpec, fallback ke GitHub Issues sebagai informal spec source. Progressive degradation. Untuk Codeplex Chronicle sendiri, kami pakai dual-folder OpenSpec sesuai request panitia: `openspec/` untuk spec fitur utama yang panitia baca pasca-hackathon, `.agent-openspec/` untuk internal workflow agent output."* |
| "What happens if Gemini API down?" | *"Defensive layer: semantic cache + pre-recorded canned response untuk top 10 demo questions. Fallback Flash-Lite. Worst case demo flow tetap jalan dengan canned response."* |

---

## N. Designer-v1 Scope (Hari-H, 3 Prompts)

Designer-v1 hari-H handle **3 prompt** untuk claude.ai/design platform output:

### N.1. Prompt 1: Landing Page (Awwwards-Tier)

**Output target**: cinematic landing page yang explain Codeplex Chronicle (what + who + why + how), entry point ke application.

**Visual reference**: tagline *"YOUR CODEBASE, ALIVE"* + headline *"Codeplex Chronicle"* + sub *"A code editor that turns your repository into a 3D city. Files become buildings, folders become districts, and errors become earthquakes you can feel."*

**Sections**:
- Hero (tagline + headline + sub + CTA *"Continue to Application"*)
- Differentiator section (3 angle plus visual illustration per angle)
- Modes preview (5 modes plus screenshot bayangan per mode)
- Residents preview (5 AI residents plus icon plus role)
- Tech stack signal (logos: Three.js, FastAPI, GitHub, OpenSpec, Gemini)
- Footer (Refactory hackathon credit, team Duopoly)

**Quality bar**: Awwwards-nominee tier (cinematic, glassmorphism, atmospheric, plus 3D city background subtle).

### N.2. Prompt 2: Application Entry Page

**Output target**: replace current "Claude generated template" color picks dari screenshot prototype Ghaisan dengan proper design.

**Layout reference**: screenshot prototype Ghaisan (5 resident introduction footer, 2 entry cards "Import a repository" plus "Build from scratch", `v0.1 prototype` badge, Docs + Changelog nav).

**Design improvements needed**:
- Color palette refined (drop Claude generated template)
- Glassmorphism plus depth refined
- 5 resident footer dengan iconography distinct per resident
- 2 entry cards dengan hover state cinematic

### N.3. Prompt 3: Dashboard View (Manager-Facing Flat 2D)

**Output target**: flat 2D dashboard untuk manager-facing alternative to City View.

**Components**:
1. Velocity chart (last N milestones, story points completed per sprint)
2. Burndown chart (current sprint, realtime)
3. Milestone progress (% complete, days remaining, blockers count)
4. Contributor analytics (commits, PR, issues per contributor, this sprint vs last)
5. Spec-drift summary (active drifts per pattern, resolution rate)
6. Refactor proposal status (open proposals, applied, archived, stale)
7. Cross-repo summary (kalau multi-repo, aggregate across cities)
8. Embedded city preview di corner (small interactive thumbnail, click expand ke City View)

**Library**: Recharts atau Chart.js (Designer-v1 decide).

### N.4. City View: Claude Code Handle (NOT Designer-v1)

City View (3D city + buildings + districts + roads + trees + post-processing + AI chat panels + ticket panels + side panels + camera control) **BUKAN** Designer-v1 scope. 3D scene = imperative Three.js/r3f code, ga bisa di-prompt visual kayak static UI. Designer-v1 strength = static UI mockup + cards + dashboards.

**Claude Code handle** via worker spawn at Wave 1-2 sequenced visual frontend-first.

### N.5. PR Comment Surfacing Visual (Hari-H Designer-v1 Decide)

PR comment surfacing on building visual approach (3 candidate: sticky note 3D, floating speech bubble, marker pin plus badge) di-decide hari-H oleh Designer-v1. Document ini cuma surface bahwa feature exist, visual approach delegated.

---

## O. Decision Log (Locked)

Semua keputusan dari brainstorming pre-event 9-10 Mei 2026 yang sudah locked di idea-draft v1.0:

| # | Decision | Outcome |
|---|---|---|
| D1 | OpenSpec sebagai requirement? | KEEP requirement (Refactory mandate confirmed). OpenSpec first-class di product (Refactor Mode), plus mandatory di workflow agentic Council→Pan |
| D2 | Refactor Mode tetap atau drop? | KEEP dengan SAFETY DESIGN: Athena execute beneran tapi write ke `drafts/` folder, BUKAN production. User accept-or-discard gate |
| D3 | Athena scope? | Full power: proposal author + dependency navigator + execution di sandbox. BUKAN declawed |
| D4 | Audience? | Engineer + Manager dual audience, dual view (City View + Dashboard View) |
| D5 | Ticket data source? | Pure GitHub. Sprint = Milestone, Backlog = open issues, Story = issue dengan label |
| D6 | Default warna gedung? | Ownership (CODEOWNERS / git blame). Toggle ke language / recency tetap ada |
| D7 | PM scope depth? | Heavy: full agile workflow termasuk burndown, velocity, retrospective replay |
| D8 | Pitch closing? | Hybrid 3 angle (philosophical + concrete + safety). Closing punchline focus *"AI explores in drafts, you commit to production"* |
| D9 | Multi-repo architecture? | MVP Opsi A (1 repo = 1 city, dropdown switcher). 2-3 repo demo dataset. Opsi C (hierarchy 3-level) Phase 2 |
| D10 | Retak building detection? | 5 metadata patterns (A-E, pure deterministic). LLM (Clio) sebagai narrator, BUKAN analyzer |
| D11 | Iris (NEW resident)? | DROPPED. Multi-mode narration distribute ke Clio (git/spec-drift/activity), Apollo (health), Athena (refactor). Total 5 resident |
| D12 | Hybrid write scope? | Layer 1 (Apollo→issue) + Layer 2 (Refactor simulation drafts/). Drop protocol untuk both |
| D13 | Drop protocol untuk hybrid? | Decision Tree Branch 7: timing checkpoints + signal triggers + 5-step protocol |
| D14 | Pitch positioning | Substansi-first: engineering productivity tools (5 modes) yang kebetulan punya 3D interface, BUKAN 3D demo yang kebetulan bisa SDD. City = interface, BUKAN value prop |
| D15 | Pitch order | Onboarding → Sprint (hero) → Refactor → Health (closing 1-click ticket). Sprint Mode hero karena align past winner pattern (substantive engineering productivity tools) |
| D16 | Demo dataset strategy | R3 Pure Seed: fork NodeGoat + FastAPI template + PyGoat, populate agile data via GitHub API script Day 0. Plus pre-render tokopedia/gripmock + gojek/courier-android closing bonus slide |
| D17 | Multi-language tree-sitter | LOCKED: TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift. BUKAN cuma TS/JS (revert dari MVP scope IDEATION asli) |
| D18 | LLM provider fallback | Gemini 2.5 Flash primary + 2.5 Flash-Lite fallback. NOT 2.0 Flash (deprecated 6 Maret 2026) |
| D19 | OpenSpec profile | `core` only, NOT expanded. Pre-fill `openspec/project.md` ~250 line. `/opsx:propose` one-shot |
| D20 | r3f optimization | Raw `<instancedMesh>` untuk 200-300 building. Drop DepthOfField first kalau regress. `<Perf />` overlay dev mode |
| D21 | Filesystem access | DROPPED. GitHub-only backbone. "Build from scratch" via in-memory virtual fs |
| D22 | Designer-v1 scope | 3 prompt (Landing, Entry, Dashboard). City View = Claude Code handle |
| D23 | Workflow sequencing | Visual frontend-first (Wave 1-2), backend deferred (Wave 3). Workers pintar multi-task per worker |
| D24 | Hands-off mode | Ghaisan + Hafiz operator only, BUKAN coding. Claude Code handle semua eksekusi termasuk K8s deploy |
| D25 | Earthquake error visual | LOCKED stretch tier 2 (welcomed kalau performance allow). Tagline locked di landing page |
| D26 | PR comment surfacing | NEW feature dari Hafiz industry feedback. Visual approach delegated ke Designer-v1 hari-H |
| D27 | OpenSpec dual-folder strategy | LOCKED per panitia eksplisit request: Folder A `openspec/` panitia-facing (Wave 0 initial spec + scope shift + Refactor Mode product feature change folder, panitia baca pasca-hackathon). Folder B `.agent-openspec/` internal workflow (Council/Metis/Designer/Orches/Pan + workers output, BUKAN consume panitia). Pattern E spec-drift detection track Folder A only |

---

## P. Open Questions (Council Hari-H Consume)

Risk yang belum sepenuhnya di-mitigate atau gap research yang Council hari-H boleh address:

### P.1. Critical Gap (HIGH PRIORITY)

**P1. Refactory rules formal: RESOLVED via panitia distribution**: panitia Refactory sudah distribute file `RefactoryHackathonRules&FAQ.txt` ke peserta pre-event. Konten lengkap sudah terverifikasi pre-event, tidak ada surprise rule.

Rangkuman rule yang relevan untuk Codeplex Chronicle (compliance check udah lulus):

**Eligibility plus Team**:
- Open to everyone aged up to 28 years (Ghaisan plus Hafiz comply)
- Team size 2-4 members (Duopoly = 2, comply)
- Individual participation NOT allowed
- Team name: must be respectful, no SARA, no provocative content (Duopoly comply)
- All team members harus physically attend final presentation, absence = withdrawn

**Build Constraint**:
- All projects must be developed during the hackathon, except for open-source libraries (Codeplex Chronicle = built during 24 jam, dependencies all open-source, comply)
- NO use of pre-existing non-open-source code
- NO outsourcing projects ke external parties
- NO receiving help dari outside the team
- Plagiarism strictly prohibited

**Tech Stack Mandate (KRITIS)**:
- Per FAQ: *"Yes, all are mandatory. Except for mobile,choose one (Android or iOS)."*
- Refactory list mandatory tech: OpenSpec, LLMs, Kubernetes, PostgreSQL. Codeplex Chronicle pakai semua 4 (Section K.1 confirmed comply)

**Code of Conduct**:
- NO external coaches, mentors, atau supervisors (lu+Hafiz solo, comply)
- NO use of pre-made code, content, atau designs unless open-source
- NO plagiarism, including failure to provide proper citations
- Quiet hours 10:00 PM WIB kalau overnight applied
- NO smoking, NO alcohol, NO drugs, NO sexual activity di venue
- Wear lanyard at all times, bring official ID

**Logistics**:
- Personal Wi-Fi hotspot recommended (P12 risk wifi venue partial mitigated)
- Cables, chargers, extension plugs bring sendiri
- Sleeping bag NOT provided, bring sendiri
- Toiletries plus shower NOT available, bring sendiri (deodorant, face wipes)
- Pillow, blanket bring sendiri
- Quiet hours 10 PM WIB

**Final Decision**:
- All decisions made by committee plus judges are final and binding
- Significant tardiness without prior notice may affect eligibility for prizes/certificates

**Implication ke Codeplex Chronicle**: semua rule comply. Tidak ada rule yang force pivot ide. Council hari-H tidak perlu re-fetch Google Doc, content sudah ter-capture di sini. **Yang Council hari-H perlu cek**: kalau saat technical meeting hari-H ada update rule (panitia kadang clarify on-the-spot), Council capture plus integrate ke PRD.

**P2. Round 02 UNAIR winner pattern**: research kami surfaced juara 3 = Tim Case Release dengan Effix.ai (AI code optimizer), tapi juara 1 + 2 ga publik. Council hari-H boleh tanya Brian/Andika di WhatsApp grup atau DM IG @refactory.id.
- Pattern winner Round 02 paling relevan precedent karena terbaru
- Adjust pitch tone Round 03 calibration kalau ada signal

### P.2. Feature Detail Risk (MEDIUM PRIORITY)

**P3. Iris dropped, narration distribute ke 3 resident**: Athena handle refactor proposal trade-off, Apollo handle health finding context, Clio handle git/spec-drift/activity. Risk: prompt design 3 resident handle multi-context narration, bukan dedicated narrator. Need test prompt clarity, hindari confusion role.

**P4. PR comment surfacing visual**: 3 candidate (sticky note 3D, floating bubble, marker pin). Designer-v1 decide, but ada risk visual approach kompete dengan PM overlay layer existing (scaffolding+crane+banner). Need check overlap.

**P5. Demo dataset agile data realism**: pure seed via GitHub API script. Risk: data feels artificial, juri detect *"ini fake data"*. Mitigation: fictional user dengan realistic name+avatar, commit timeline disperse, comment thread realistic.

**P6. Earthquake error visual trigger condition**: tagline lock *"errors become earthquakes"*, tapi trigger condition belum precisely defined. Apollo critical finding cluster trigger? Pattern E spec-drift trigger? Need precise condition di Wave 1 spec.

### P.3. Tech Risk (MEDIUM PRIORITY)

**P7. Gemini multi-turn coordination untuk Refactor Mode Layer 2**: real `/opsx:apply` execution butuh Gemini orchestrate test gen → implementation gen → diff serialization across multiple turns. Risk: turn drop, output parse error, MALFORMED_FUNCTION_CALL mid-flow. Drop protocol Section J.3 cover ini, tapi need precise timeout values plus retry budget.

**P8. Multi-language tree-sitter performance**: 11 language grammar load. Risk: cold start slow, memory bloat. Mitigation: lazy load grammar per repo language detected, cache parser instance.

**P9. r3f performance ceiling 200-300 building plus flying car plus post-pipeline plus 3-tier Sparkles**: research kami feasible 60fps M-series, tapi end-to-end benchmark stack lu specific BELUM tested. Risk: Day 1 morning need Wave 0 benchmark via `<Perf />`, kalau regress harus drop feature flag.

**P10. Gemini MALFORMED_FUNCTION_CALL frequency di production load**: research kami one user reported 6/7 attempts fail at high thinking_budget. Defensive layer (try/except + retry + fallback Flash-Lite + canned) mitigation, tapi end-to-end load test belum ada.

### P.4. Operational Risk (LOW PRIORITY)

**P11. K8s deploy first-try success**: Hafiz familiarize K8s plus dockerize sample app Day 0 prep mandatory. Risk: image build error, registry credential, Pod CrashLoopBackOff debug 2-3 jam common. Mitigation: Day 0 dry run mandatory.

**P12. WiFi venue Telkom University reliability**: demo run live di laptop, GitHub API + Gemini API butuh internet. Mitigation: pre-load demo dataset cache di Postgres + browser session storage. Worst case offline mode minimal (canned response semua AI residents).

**P13. Pitch language Indonesian + English code-switch**: brainstorming pre-event lock bahasa Indonesian primary. Risk: tech term natural English code-switch kadang awkward (e.g., "city", "spec drift"). Mitigation: rehearsal Day 2 jam 13-15 wait announcement window.

---

## Q. Pre-Event Research Findings Appendix

Highlights dari deep research session pre-event 9 Mei 2026 (full report attached separately sebagai `research_finding.md` di handoff zip ke Council hari-H):

### Q.1. Topic A: Demo Dataset
- **NodeGoat** (Apache-2.0, ~80-120 files): primary Health Mode hero, 5/5 OWASP detector fire authentic, district split clean, Indonesian dev community high recognition
- **FastAPI full-stack template** (MIT, ~150-250 files): secondary, mirror Codeplex Chronicle stack, juri instant recognize
- **PyGoat** (MIT, ~60-90 files): fallback, Python flavor
- **Juice Shop** REJECTED: 1000+ files, fail 50-300 rule
- **Tokopedia/Gojek/Bukalapak**: Apache-2.0/MIT, mostly clean library code, REJECTED for primary, ACCEPTED as closing slide screenshot bonus

### Q.2. Topic B: OpenSpec Validation
- v1.0 stable shipped pre-May 2026, ~46.1k stars, very active maintenance
- Canonical layout: `openspec/specs/`, `openspec/changes/<change>/`, `openspec/archive/`
- Slash commands stable: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`, `/opsx:sync`
- `core` profile only untuk hackathon (NOT expanded, less failure surface)
- Pre-fill `openspec/project.md` ~250 line, `/opsx:propose` one-shot, clear context before `/opsx:apply`
- 50+ cycles in 24h plausible dengan `core` profile, expect 10-20% manual intervention
- **Dual-folder strategy locked** per panitia request: Folder A `openspec/` (panitia-facing, primary spec), Folder B `.agent-openspec/` (internal workflow agent output). Separation cegah noise di Folder A yang panitia baca pasca-hackathon

### Q.3. Topic C: Past Refactory Winner Pattern
- **Round 01 UGM Juara 1**: Tim LUNARIS Telkom University (theme "OpenSpec × AI" eksplisit). Top 5: Tim SIPHAN UGM dengan AI browser extension harm reduction
- **Round 02 UNAIR Juara 3**: Tim Case Release UNAIR dengan Effix.ai (AI code optimizer)
- **Roadshow UKDW Dec 2025 Juara 1**: Tim Vibecode UTDI dengan Backstage plugins (DevEx tooling)
- Pattern: AI-assisted developer productivity tooling, deployed plus demoable, BUKAN flashy 3D demos
- Implication: pitch substansi-first, city = interface BUKAN value prop

### Q.4. Topic D: Three.js + r3f Performance
- 200-500 InstancedMesh buildings via single draw call within budget
- 60fps target M-series realistic
- Drop-first order: DepthOfField, Sparkles tier 3, third directional shadow
- Raw `<instancedMesh>` setMatrixAt > Drei `<Instances>` per-instance JSX
- `state.performance.regress()` wired ke camera moves, +20-30% perf

### Q.5. Topic E: Gemini 2.5 Flash Reliability
- TTFT 0.72s AI Studio, 194.8 t/s output
- Free tier ~10 RPM 250-1500 RPD per project, 3 keys round-robin = ~30 RPM effective
- Gemini 2.0 Flash deprecated 6 Maret 2026 (drop dari fallback plan)
- MALFORMED_FUNCTION_CALL documented frequent failure, mitigation: `thinking_budget=0`, try/except retry, fallback Flash-Lite, canned response top 10 demo questions
- Pre-cache 10 demo questions critical untuk demo reliability

### Q.6. Topic F: Refactory Rules Formal Doc
- **RESOLVED**: panitia distribute file `RefactoryHackathonRules&FAQ.txt` pre-event, content ter-capture di Section P.1
- Confirmed: team 2-4 members, deploy K8s mandatory, theme "Engineering Productivity x AI", OpenSpec mandatory, all build during hackathon (open-source libs allowed pre-built), full team attend final pres, all 4 mandatory tech stack listed (OpenSpec + LLMs + K8s + PostgreSQL)

---

## R. Research Methodology Note

Pendekatan brainstorming kami pakai **5-lens deliberation framework** untuk pressure-test ide sebelum lock, di-iterate via 8+ ronde diskusi pre-event 9-10 Mei 2026:

- **Momus lens (contrarian)**: surface me-too risk, precedent concern (CodeCity/Sourcetrail/GitCity), assumption blowup. Output: combined differentiator framing (3D + multi-agent + spec-drift), BUKAN solo "3D city codebase" yang me-too
- **Eos lens (expansionist)**: push visual ambition ceiling. Output: 4 lock visual stretch (cinematic intro 5s, verticality skyscraper, iconic landmark per resident, Director mode auto-fly). Tier 2 welcomed (flying cars, earthquake, weather)
- **Prometheus lens (first-principles)**: breakdown foundational assumption tech plus capacity. Output: 6 critical assumption audit, 4 medium-low confidence flagged untuk research validation
- **Hermes lens (executor)**: Wave sequencing plus critical path block plus drop protocol. Output: visual frontend-first wave sequencing (reverse dari pattern paralel standar), 5 critical path block identified, drop protocol Branch 7 untuk hybrid write
- **Argus lens (outsider)**: target user analysis (Refactory practitioner judges Indonesian), market signal validation (past winner pattern UGM/UNAIR/UKDW = AI dev productivity tools, BUKAN flashy 3D), pitch positioning recommendation

Setiap lens kami pakai bergantian saat diskusi multi-ronde, plus Mnemosyne synthesis untuk consolidate tension points (5 identified, resolved via refinement loop) plus blind spot (6 identified, 3 addressed pre-event, 3 deferred ke deep research).

**Deep research session** comprehensive 6 topic prioritized HIGH (demo dataset + OpenSpec validation + past Refactory winner pattern) plus MEDIUM (r3f performance ceiling + Gemini reliability) plus LOW (Refactory rules formal doc, RESOLVED via panitia distribution pre-event). Output di Section Q. Persistent blind spot: Round 02 winner exact pattern (juara 1+2 not publicly disclosed).

---

## S. Final Mandate Repeat (Reminder Council Hari-H)

Ide LOCKED. Mandate Council hari-H:

1. **Tanya Brian/Andika WhatsApp atau DM IG soal Round 02 winner** (Section P.1 P2), adjust pitch positioning kalau ada signal
2. **Refactory rules formal**: udah RESOLVED pre-event (Section P.1 P1), tapi kalau saat technical meeting hari-H panitia clarify rule on-the-spot, capture plus integrate ke PRD
3. **Generate PRD comprehensive** sesuai standar industri untuk dikonsumsi Metis (agentic structure architect) + Designer-v1 (UI prompt author 3 prompt: Landing, Entry, Dashboard) + Orches-v1 (Wave executor visual-first sequencing) + Pan (universal worker)
4. **Surface risk hari-H** kalau ada perubahan domain plus credential plus team setup yang shift dari context dokumen ini

**Constraint**:
- Tidak re-debate ide dengan Ghaisan
- Tidak pivot atau push back substansi locked
- Tidak spawn persona deliberation re-validate (sudah dilakukan 9 Mei pre-event, output di Section R)

**PRD output Council hari-H consumed by**:
- **Metis hari-H**: agentic structure architect, generate AGENT_STRUCTURE.md dengan visual frontend-first wave sequencing, workers pintar multi-task per worker
- **Designer-v1 hari-H**: UI prompt author untuk 3 prompt (Landing Awwwards-tier, Entry replace Claude template, Dashboard manager-facing). City View NOT Designer scope
- **Orches-v1 hari-H**: Wave executor, drive Wave 0-3 dengan visual frontend-first sequencing, hands-off mode (Ghaisan+Hafiz operator only, Claude Code handle semua eksekusi termasuk K8s deploy)
- **Pan hari-H**: universal worker, picked task atomic yang fit pattern hari-H

---

## T. Document Closing

Idea-draft locked. Dokumen ini adalah single source of truth untuk Codeplex Chronicle ide plus planning di Refactory Hackathon Round 03. Council hari-H consume as-is, Metis/Designer/Orches/Pan downstream consume PRD comprehensive yang Council hari-H generate.

**Workflow hari-H**:
```
Council hari-H (12 Mei jam ~10) → consume idea-draft, generate PRD comprehensive
↓
Metis hari-H (12 Mei jam ~11) → consume PRD, generate AGENT_STRUCTURE.md visual-first
↓
Designer-v1 hari-H (12 Mei jam ~11-12, paralel Metis) → consume PRD, generate 3 prompt
↓
Orches-v1 hari-H (12 Mei jam ~12-13) → consume PRD + AGENT_STRUCTURE + 3 prompt, drive Wave 0-3
↓
Wave 0 (12 Mei jam ~13-14): Pythia contracts + Hephaestus prompts
↓
Wave 1 (jam ~14-): visual foundation (3D scene + buildings + landing + entry + dashboard)
↓
Wave 2: visual modes (Sprint, Health, Onboarding, Activity, Refactor visual)
↓
Wave 3: backend full (FastAPI + tree-sitter + GitHub OAuth + webhook + simulation engine + K8s deploy)
↓
Submission (13 Mei jam 11): smoke test + slide deck via Pan
↓
Pitch (13 Mei jam 15-17 kalau top 5)
```

End of `idea-draft_codeplex-chronicle.md` v1.0.
