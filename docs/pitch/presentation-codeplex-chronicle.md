# Codeplex Chronicle
**Your Codebase, Alive**
Tim Duopoly · Refactory Round 03

---

## 1. Problem

### Engineering Tools Terfragmentasi
- Tech roles login lebih dari 20 tools per hari (Burai 2024)
- Knowledge worker toggle antar aplikasi 1.200 kali per hari (Harvard Business Review 2022)
- Butuh 23 menit regain focus setelah setiap interupsi (Gloria Mark, UC Irvine)
- Atlassian survey 3.500 engineer: context switching adalah productivity killer #3 (2025)

### Ramp-Up dan Code Review Lambat
- New hire enterprise capai PR ke-10 dalam 91 hari rata-rata (DX Engineering Enablement 2025)
- APQC: median 35 hari untuk basic productivity, 50+ hari untuk laggard
- Median PR cycle time 4,2 hari, bottom quartile lebih dari 1 minggu (LinearB 2023)
- 44% tim sebut slow code review sebagai bottleneck terbesar di delivery pipeline

### Spec to Code Drift Diam-Diam Menumpuk
- Code-to-documentation drift adalah persistent challenge SDLC (IEEE Xplore 2024)
- Architectural drift terjadi saat implementasi menyimpang dari spec (ICSE 2024)
- AI-generated code memperparah, konvensi konflik mempercepat code rot (DX 2025)
- Drift baru terdeteksi saat audit manual, sudah terlambat

---

## 2. Existing Gap & Key Insight

### Yang Belum Tersedia
- Ticket list flat: tidak tunjukkan di mana kerja itu hidup
- Code map static: tidak tunjukkan apa yang sedang direncanakan
- PR comment unresolved: ngumpet di tab GitHub
- Belum ada satu permukaan untuk plan, code, dan drift sekaligus

### Insight Utama
- Plan, code, dan drift seharusnya hidup di satu permukaan
- Spatial anchor mengurangi cognitive load aggregasi multi-tool
- Sprint board adalah representasi termiskin dari aktivitas engineering real
- Jika ticket hidup di tempat code, context switch hilang

---

## 3. Solution Introduction

### Codeplex Chronicle
- Codebase divisualisasikan sebagai kota 3D yang hidup
- File jadi building, folder jadi district, import jadi jalan
- Sprint scope di-overlay langsung di atas kota
- Lima AI resident tinggal di landmark ikonik

### Value Proposition
- Spatial agile workspace, satu permukaan untuk semua
- Ticket hidup di tempat kerja, bukan tab terpisah
- Dual view: engineer di 3D, manager di dashboard
- AI grounded ke deterministic source, bukan halusinator

### Three Angle Differentiator
- Filosofis: code promise vs code delivery
- Konkret: satu peta untuk codebase, sprint, dan gap
- Safety: AI eksplorasi di drafts, manusia commit ke production

---

## 4. Core Workflow + Main Features

### Sprint Mode adalah Hero
- Sprint scope di-overlay live ke kota 3D
- Scaffolding di file aktif, crane di PR terbuka
- Banner sprint goal nempel di City Hall
- Inspector NPC mengorbit building under review

### 14 PM Concept ke Visual Mapping
- Active story: scaffolding
- Open PR: crane animasi
- Backlog: blueprint pin
- Done: green halo
- Blocked: yellow tape
- Bug: smoke retak
- Story point: badge S/M/L/XL
- Sprint goal: banner City Hall
- Epic: district berbendera
- Code review: inspector NPC
- Dependency: red bridge antar building
- Refactor proposal: ghost building
- Spec drift: crack di walls
- PR comment unresolved: sticky note plus badge

### PR ke Building, Real Time
- GitHub webhook propagasi di bawah 5 detik
- PR opened: crane muncul, review requested: NPC datang
- Approved: green halo, merged: scaffolding clear
- Event store catat semua untuk cycle time dan lead time

### Dual View, Dual Audience
- City View untuk engineer: 3D plus AI residents plus ticket panel
- Dashboard View untuk manager: velocity, burndown, milestone, contributor
- Manager zoom ke city saat one-on-one review
- Engineer loncat ke dashboard saat butuh angka cepat

### Onboarding Mode dengan Hermes
- Hermes tinggal di Tourist Info, glass beacon cube landmark
- Click landmark, type "give me a 30-second tour"
- Camera fly-through 3 district top deterministic, building penting glow
- Ending: starting file plus owner contact plus next files

### 4 Tour Variant Hermes
- "Give me a 30-second tour": generic path untuk new hire
- "Tour for sprint goal X": baca milestone description
- "Tour for feature Y": follow dependency graph dari entry point
- "Tour as @username": district yang user owns atau sering contribute

### Activity Mode dengan Clio
- Clio tinggal di Library, vertical book stack landmark
- Git archaeology grounded ke timestamps, edit counts, reviewer identities
- AI compose prose, angka dari git data bukan halusinasi
- Ownership heatmap plus timeline scrubber 30/60/90 hari

### 4 Use Case Clio
- Daily standup: "tunjukkan aktivitas 24 jam terakhir"
- Sprint retrospective: 60 detik cinematic flythrough dengan narration
- Onboarding context: "tunjukkan kerja @username belakangan"
- Performance review prep: "ringkas kontribusi gw quartal lalu"

### Other Modes
- Refactor: Athena propose ke drafts/ sandbox, dual review gate
- Spec Drift: 3 building state (solid, ghost, cracked), pattern deterministic
- Health: 5 detector (secret, dependency, auth, SQL, complexity), one-click ticket

---

## 5. Implementasi Teknis

### Mandatory Stack Compliance
- OpenSpec Fission-AI v1.0, dual folder strategy
- DeepSeek V4-Flash primary, V4-Pro fallback
- Kubernetes namespace duopoly, ingress NGINX
- PostgreSQL untuk event store dan ticket state

### Frontend
- Next.js 16 App Router, React 19, TypeScript strict
- Three.js 0.184 plus @react-three/fiber 9.6
- InstancedMesh untuk 200-300 building di 60fps
- GSAP camera animation, Tailwind styling

### Backend
- Python 3.12 plus FastAPI async, WebSocket streaming
- tree-sitter 11 grammar untuk multi-language parsing
- PyGithub untuk webhook dan issue creation
- SQLAlchemy plus asyncpg, Alembic migration

### Key Architectural Choices
- GitHub Issues sebagai backbone: Sprint = Milestone, Story = Issue
- Refactor write ke drafts/, dual review gate
- 5 deterministic detector untuk Health, AI sebagai narrator
- Visual frontend-first sequencing, backend deferred

---

## 6. Impact & Vision

### Dampak untuk Tim Agile
- Onboarding: dari 35-91 hari rata-rata jadi 30 menit Hermes tour
- Velocity report: dari aggregasi multi-tool jadi 1 menit Dashboard View
- PR bottleneck: dari invisible jadi sticky note spatial di building
- Sprint retrospective: dari flat slides jadi 60 detik Clio flythrough

### Engineering Culture Shift
- Mental map codebase tersedia di hari pertama, bukan minggu ketiga
- Manager-engineer alignment: dari tools terpisah jadi satu permukaan spatial
- Code review: spatial annotation, bukan notification tab
- Sprint board: data static jadi skyline dinamis

### Vision Jangka Pendek
- 5 mode operasional, 5 resident respons di bawah 5 detik
- Live di duopoly.hackathon.sev-2.com
- Demo 3 kali konsekutif tanpa crash
- Bukti di Indonesian production repo

### Vision Jangka Panjang
- Standar baru DevEx tooling: plan dan code di satu permukaan
- AI sebagai narrator dan navigator, bukan autonomous decision maker
- Codebase sebagai tempat, engineer jalan, manager terbang

### Closing Punchline
- Flat list tidak tunjukkan di mana kerja hidup
- Static map tidak tunjukkan apa yang direncanakan
- Codeplex Chronicle: codebase, sprint, dan kota dalam satu peta
- AI eksplorasi di drafts, manusia commit ke production
- Your codebase, alive

---

## Sumber Referensi

- Harvard Business Review (2022). Average digital worker toggles between apps 1,200 times per day.
- Gloria Mark, University of California Irvine. 23 minutes to regain focus after interruption.
- Atlassian Engineering Survey (2025). Context switching ranked #3 productivity killer among 3,500 engineers.
- Burai Research (2024). Tech professionals log into 20+ tools daily.
- DX Engineering Enablement, Abi Noda (2025). New hires reach 10th PR in 91 days on average in enterprise.
- APQC Research. Median 35 days for new employees to reach basic productivity.
- LinearB Engineering Benchmarks (2023). Median PR cycle time 4.2 days; 44% teams cite slow review as biggest bottleneck.
- IEEE Xplore (2024). A Review on Detecting and Managing Documentation Drift in Software Development.
- ICSE 2024. Capturing and Understanding the Drift Between Design, Implementation, and Documentation.
- DX Research (2025). Code rot accelerated by AI-generated code with conflicting conventions.
