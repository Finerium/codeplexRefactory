<img src="../branding/logo.png"
style="width:1.45833in;height:1.45833in" />

**Codeplex Chronicle**

*Your Codebase, Alive*

A spatial agile workspace for software engineering teams. Sprint scope,
code, and spec-to-implementation drift live on one map - so engineers
stop context-switching, managers stop aggregating across three tools,
and AI explores in drafts before production ever changes.

| | |
|:---|:---|
| **Document** | Product Requirements Document - Revisi v1.1 |
| **Team** | Tim Duopoly - Ghaisan Khoirul Badruzaman, Hafiz Fauzan Syafrudin |
| **Event** | Refactory Hackathon Round 03 - Telkom University Bandung |
| **Tanggal** | 12-13 Mei 2026 |
| **Domain** | duopoly.hackathon.sev-2.com |
| **Repository** | github.com/Finerium/codeplexRefactory |
| **Tema** | Engineering Productivity × AI |

*Revisi v1.1 - fokus tajam ke project management & agile software
development, persona engineer dan engineering manager dengan
before/after impact.*

**1. Executive Summary**

Codeplex Chronicle adalah spatial agile workspace yang menyatukan tiga
lapis kerja engineering yang hari ini tinggal di tools terpisah - sprint
planning di Jira/Linear, code di GitHub, dan drift antara
spec-and-implementation yang tidak hidup di mana pun. Kami
visualisasikan codebase sebagai kota 3D yang hidup: file jadi building,
folder jadi district, scope sprint aktif di-overlay langsung di atas
kota, dan lima AI resident tinggal di landmark ikonik untuk membantu
navigasi, narasi, dan proposal refactor.

Yang membedakan Codeplex Chronicle dari project management tools dan
code visualization tools yang ada: kami tidak menggantikan workflow tim
Anda, kami menghapus context switch antar-tool. GitHub Issues tetap jadi
backbone (Sprint = Milestone, Story = Issue dengan label, PR = native).
Kami menambahkan satu permukaan spatial di mana ticket hidup di tempat
code-nya hidup, plus AI residents yang grounded ke deterministic source
 - bukan halusinator yang nulis ke production.

**Tiga Angle Differentiator**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>Filosofis.</strong> Tools lain bilang apa yang ada di
code Anda. Codeplex Chronicle bilang apa yang code Anda janjikan versus
apa yang akhirnya dikirim.</p>
<p><strong>Konkret.</strong> Flat ticket list tidak tunjukkan di mana
kerja itu hidup. Static code map tidak tunjukkan apa yang sedang
direncanakan. Kami satukan codebase, sprint, dan gap antara plan vs ship
di satu peta kota.</p>
<p><strong>Safety.</strong> AI yang halusinasi mahal. Refactor salah
merusak production. Codeplex Chronicle memberi AI ruang untuk eksplorasi
tanpa risiko: setiap proposal dan eksekusi refactor jalan di drafts/,
bukan production. Anda lihat blast radius lewat ghost-to-solid
animation, baca diff dengan tenang, accept atau discard. Production
hanya berubah saat Anda klik Accept.</p></td>
</tr>
</tbody>
</table>

**Sekilas Pandang**

| | |
|:---|:---|
| **Field** | **Value** |
| **Audience** | Software engineer dan engineering manager pada tim agile berbasis GitHub |
| **Product Modes** | Lima - Onboarding, Sprint (hero), Refactor, Activity, Health |
| **AI Residents** | Lima - Athena, Apollo, Argus, Clio, Hermes |
| **Mandatory Stack** | OpenSpec, DeepSeek V4, Kubernetes, PostgreSQL |
| **Build Window** | 24 jam, hands-off operator model |
| **Submission** | PRD ini, C4 diagram, repository link, slide deck |

**2. Problem Statement**

Tim engineering modern hari ini bekerja di codebase 100K+ LOC, dengan
sprint dicatat di satu tool, code di tool lain, dan intent drift hidup
diam-diam di commit history. Tiga pain cluster yang spesifik untuk
project management dan agile software development menggerakkan Codeplex
Chronicle. Setiap pain didukung empirical data dari riset industri.

**Pain 1 - Engineering Tools Terfragmentasi: Context Switch sebagai
Productivity Killer**

Tim engineering operate di tools yang saling tidak bicara. Sprint
planning di Jira atau Linear, code di GitHub, analytics di custom
dashboard, decision log di Notion atau wiki. Setiap tool punya state
model sendiri. Sinkronisasi manual, dan tidak ada anchor spatial yang
menghubungkan di mana kerja terjadi dengan di mana code itu hidup.

**Data empirik:**

- Tech professional login ke 20+ tools per hari (Burai Research 2024).

- Knowledge worker toggle antar aplikasi 1.200 kali per hari (Harvard
 Business Review 2022).

- Butuh 23 menit untuk regain focus setelah setiap interupsi (Gloria
 Mark, UC Irvine).

- Survey Atlassian terhadap 3.500 engineer di 2025: context switching
 adalah productivity killer \#3 di delivery pipeline.

Implikasi untuk agile teams: daily standup, sprint planning,
retrospective, dan code review semuanya butuh agregasi data dari tiga
atau lebih tools. Engineering manager menghabiskan ~15 menit aggregasi
velocity manual sebelum 1:1, dan engineer rutin kehilangan 2-3 jam fokus
per hari karena toggle Slack → Jira → GitHub → IDE.

**Pain 2 - Ramp-Up Engineer dan Code Review Lambat**

Onboarding di codebase 100K+ LOC adalah pengalaman frustasi yang
predictable. Engineer baru baca README, buka IDE, lalu hilang dua minggu
navigasi 200+ files tanpa mental map. Tools yang ada (GitHub repo
browser, IDE tree view, static code map) flat dan tidak menyediakan
active context: siapa pemilik apa, di mana hotspot activity terbaru,
file mana yang harus disentuh first day.

**Data empirik:**

- Enterprise new hire mencapai PR ke-10 dalam 91 hari rata-rata (DX
 Engineering Enablement, Abi Noda 2025).

- APQC research: median 35 hari untuk basic productivity, 50+ hari untuk
 laggard organisasi.

- Median PR cycle time 4,2 hari; bottom quartile lebih dari 1 minggu
 (LinearB Engineering Benchmarks 2023).

- 44% tim engineering menyebut slow code review sebagai bottleneck
 terbesar di delivery pipeline.

Pain ini punya dua wajah. Pertama, ramp-up engineer baru: minggu pertama
habis untuk spatial discovery yang seharusnya bisa di-frontload. Kedua,
code review bottleneck: PR comment unresolved ngumpet di tab GitHub,
reviewer tidak punya visual sense tentang blast radius perubahan, dan
engineering manager tidak punya cara cepat melihat di file mana review
macet.

**Pain 3 - Spec-to-Code Drift Diam-Diam Menumpuk**

Sprint goal didefinisikan di milestone atau issue. Implementasi jalan di
branch. Gap antara apa yang di-spec dan apa yang akhirnya dikirim tidak
di-track di mana pun. Issue ditutup enam bulan lalu, tapi file-nya terus
diedit. OpenSpec change folder di-archive, tapi commit bypass hook. Ini
adalah silent drift yang baru muncul saat audit manual - dan saat itu
sudah terlambat untuk dampak yang signifikan.

**Data empirik:**

- Code-to-documentation drift adalah persistent challenge sepanjang SDLC
 (IEEE Xplore, A Review on Detecting and Managing Documentation Drift
 in Software Development, 2024).

- Architectural drift terjadi saat implementasi menyimpang dari original
 spec, dan rarely terdeteksi sampai major refactor diperlukan (ICSE
 2024, Capturing and Understanding the Drift Between Design,
 Implementation, and Documentation).

- AI-generated code memperparah code rot dengan konvensi konflik (DX
 Research 2025).

Untuk tim agile, drift ini lethal karena merusak velocity prediction.
Sprint commitment berdasarkan spec yang sudah tidak akurat menghasilkan
estimasi yang meleset, rework yang tidak terlihat di burndown, dan trust
gap antara engineer dan product owner.

**Pain Validation Matrix**

| | | |
|:---|:---|:---|
| **Pain** | **Confidence** | **Basis Validasi** |
| Context switching dan fragmentasi tools | **Tinggi** | HBR 2022, Atlassian 2025, Burai 2024, Gloria Mark UC Irvine - quantified across tiga sumber independen |
| Onboarding dan code review lambat | **Tinggi** | DX Engineering Enablement 2025, APQC research, LinearB 2023 - industry-standard benchmarks |
| Spec-implementation drift | **Sedang-Tinggi** | IEEE Xplore 2024, ICSE 2024, DX 2025 - peer-reviewed plus industry confirmation |

**3. Solution Overview**

**The Big Picture**

Codeplex Chronicle memvisualisasikan seluruh codebase sebagai kota 3D
yang hidup. File jadi building yang tingginya proporsional dengan lines
of code. Folder jadi district. Import jadi glowing road. Test coverage
jadi pohon yang mengisi district well-tested dan menipis di mana
coverage hilang. Ownership jadi default color setiap building.

Tapi kota ini bukan sekadar visualisasi. Ini adalah operating canvas
yang sekaligus berfungsi sebagai lima workspace berbeda di satu
permukaan spatial yang sama.

**Dual View, Dual Audience**

Engineer bekerja primarily di City View - kota 3D dengan PM overlay,
refactor mode, ticket panel, dan AI residents chat. Manager bekerja
primarily di Dashboard View - tampilan 2D flat dengan velocity,
burndown, milestone progress, contributor analytics, plus city preview
kecil di pojok untuk spatial context. View toggle tinggal di top
navigation. Engineer bisa zoom ke dashboard saat butuh velocity number
cepat, dan manager bisa zoom ke city saat 1:1 review.

**Lima Product Modes**

| | | |
|:---|:---|:---|
| **Mode** | **Hero Use Case** | **Yang Berubah di Kota** |
| **1. Onboarding** | Mental map new hire dalam 30 menit | Camera fly-through tiga district top, narasi Hermes |
| **2. Sprint (HERO)** | Spatial agile workspace | Scaffolding, crane, banner, inspector NPC, ticket panel |
| **3. Refactor** | Spec-driven refactor di sandbox | Ghost building, OpenSpec change folder, drafts/ simulation |
| **4. Activity** | Git-backed engineering intelligence | Ownership heatmap, hotspot glow, timeline scrubber |
| **5. Health** | Code diagnostic plus one-click ticket | Glow building color-coded by severity, evidence panel |

**Core Safety Principle**

| |
|----|
| *AI di Codeplex Chronicle adalah narrator, navigator, summarizer, dan proposal author dengan sandbox execution. Tidak pernah landing code ke production secara otonom. Semua insight grounded ke deterministic source: static analysis output, git dan ticket metadata, OpenSpec proposal, atau deterministic detector. Refactor Mode execute simulation ke drafts/ folder, dan production code hanya berubah saat user klik Accept.* |

**4. Target Users & Impact Profile**

Codeplex Chronicle melayani dua persona utama dalam tim agile berbasis
GitHub. Untuk setiap persona, kami profile bukan hanya konteks dan
tools, tetapi juga before-state (hari ini, tanpa Codeplex Chronicle)
versus after-state (workflow yang sama dengan Codeplex Chronicle di
stack mereka). Goal-nya bukan menggantikan tools eksisting, tetapi
menghapus context switch yang ada di antaranya.

**Persona A - Engineer Aldo**

Software engineer, 2-4 tahun pengalaman, anggota tim 5-15 orang

**Konteks dan Tools**

Aldo full-stack engineer di startup atau scale-up Indonesia (Tokopedia,
Gojek, ruangguru, Sirclo, Mekari adalah profil tipikal). Tim-nya
beroperasi di sprint dua mingguan dengan ceremony agile lengkap: daily
standup 15 menit, sprint planning, review, retrospective. Tools harian:
VSCode, GitHub (PR plus issue), Slack, dan salah satu dari Jira, Linear,
atau Trello. Workflow standard agile, tapi tools-nya terpisah.

**Goals dan Frustrations**

- Onboard ke codebase baru tanpa kehilangan dua minggu navigasi files
 secara manual.

- Tahu di mana code yang relevan dengan ticket sprint hari ini, tanpa
 toggle terus-menerus.

- Review PR teman dengan visual sense soal blast radius perubahan, bukan
 hanya diff text.

- Propose refactor tanpa takut merusak production code yang sudah jalan.

**Before - Workflow Hari Ini, Tanpa Codeplex Chronicle**

| | | |
|:---|:---|:---|
| **Aktivitas Agile** | **Workflow Saat Ini** | **Pain & Cost** |
| **Onboarding hari pertama** | Buka README, clone repo, buka IDE, scroll tree view selama berjam-jam. Tanya senior via Slack untuk arsitektur high-level. | Median 35 hari capai basic productivity (APQC). PR ke-10 baru di hari 91 (DX 2025). |
| **Daily standup** | Buka Jira untuk lihat ticket, buka GitHub untuk lihat status PR, scroll Slack untuk update teman tim. | Toggle 3+ aplikasi sebelum bicara. 23 menit recovery time setelahnya (Gloria Mark). |
| **Pick up sprint ticket** | Baca deskripsi ticket di Jira, search files relevant di IDE secara manual, buka 3-4 file untuk pahami konteks. | Tidak ada spatial anchor antara ticket dan code. Pemahaman konteks berulang setiap ticket baru. |
| **Review PR teman** | Buka tab PR di GitHub, scroll diff, simulasi mental impact ke file lain. | Median PR cycle time 4,2 hari (LinearB). 44% tim sebut review bottleneck \#1. |
| **Propose refactor** | Tulis deskripsi di PR atau Jira ticket. Buat branch, ngoding langsung, harap tidak break production. | Blast radius baru terlihat setelah diff sudah ada. AI assistant generate langsung ke production tanpa review gate visual. |

**After - Workflow yang Sama, Dengan Codeplex Chronicle**

| | | |
|:---|:---|:---|
| **Aktivitas Agile** | **Workflow Baru** | **Impact** |
| **Onboarding hari pertama** | Buka Codeplex Chronicle, klik Hermes di Tourist Info, type 30-second tour. Camera fly-through tiga district top, ending dengan starting file plus owner contact. | Dari 35-91 hari capai produktivitas, menuju 30 menit mental map. Senior engineer tidak lagi jadi human FAQ di hari pertama. |
| **Daily standup** | Buka Sprint Mode. Lihat kota dengan scaffolding di file yang sedang dikerjakan, crane di PR-mu yang menunggu review. Bicara dari kota itu sendiri. | Standup transformasi dari status reporting jadi spatial coordination. Konteks tidak hilang antar standup. |
| **Pick up sprint ticket** | Klik building yang scaffolded. Ticket panel buka inline: assignee, story point, linked PR, status. Code, ticket, dan konteks di satu permukaan. | Toggle Jira ↔ GitHub ↔ IDE hilang. Ticket hidup di tempat kerja, bukan tab terpisah. |
| **Review PR teman** | Lihat crane di atas building, hover untuk preview. PR comment unresolved muncul sebagai sticky note dengan badge counter langsung di building. | Review bottleneck jadi spatial-visible. Manager tahu di mana PR macet tanpa scroll GitHub. |
| **Propose refactor** | Type intent ke Athena. Tiga ghost building muncul di lokasi yang akan disentuh. OpenSpec change folder auto-generate. Klik Run Simulation, diff masuk ke drafts/. | Blast radius visible sebelum diff ada. Dua review gate sebelum production change. AI eksplorasi di drafts, manusia commit ke production. |

**Aldo Success Statement**

| |
|----|
| *“Hari pertama gw di repo baru, gw dapat mental map dalam 30 menit, bukan dua minggu. Saat standup, gw bicara dari peta kota yang sama dengan tim. Saat propose refactor, gw lihat blast radius dalam ghost building sebelum sebaris pun code production berubah. Konteks switching gw drop dari 1.200 toggle sehari ke beberapa puluh.”* |

**Persona B - Engineering Manager Budi**

Engineering manager, 5-10 tahun pengalaman, lead tim 8-20 engineer

**Konteks dan Tools**

Budi engineering manager di scale-up Indonesia, lead 8-20 engineer
terdistribusi di dua-tiga sub-tim. Tanggung jawab: velocity tracking,
sprint planning facilitation, 1:1 dengan engineer, hiring, plus
alignment dengan product manager dan tech lead. Tools harian: GitHub
web, Jira atau Linear, custom dashboard (kadang dibuat sendiri via
Google Sheets atau Metabase), tools 1:1 (Notion atau Google Docs).

**Goals dan Frustrations**

- Generate velocity report dan burndown summary cepat sebelum
 stakeholder review.

- Punya spatial anchor saat 1:1 dengan engineer: 'show me kerja-mu dua
 minggu ini'.

- Identifikasi PR bottleneck dan review macet sebelum jadi sprint
 blocker.

- Track spec-to-implementation drift sebelum merusak velocity prediction
 sprint depan.

**Before - Workflow Hari Ini, Tanpa Codeplex Chronicle**

| | | |
|:---|:---|:---|
| **Aktivitas Manager** | **Workflow Saat Ini** | **Pain & Cost** |
| **Persiapan stakeholder review** | Buka Jira untuk velocity, buka GitHub untuk PR statistik, copy-paste ke Google Sheets, generate chart, paste ke slide. | 15 menit manual aggregation sebelum setiap review. Risk error transcription tinggi. |
| **1:1 dengan engineer** | Buka Jira lihat ticket yang assigned. Buka GitHub lihat PR yang merged. Buka Slack scroll status. Tanya engineer secara verbal. | Tidak ada spatial anchor. Diskusi 1:1 turun ke status update, bukan growth atau coaching. |
| **Identifikasi review bottleneck** | Scroll PR list di GitHub, sort by oldest, baca comment satu per satu untuk lihat siapa yang stuck di mana. | Bottleneck baru terlihat saat sudah sprint blocker. Tidak ada early warning. |
| **Sprint retrospective** | Slide flat dengan velocity number plus chart. Diskusi qualitative tanpa konteks visual tentang di mana effort tim spent. | Retro turun ke generic feedback ('communication better next sprint'). Action item tidak grounded ke data spatial. |
| **Spec drift detection** | Tidak ada workflow. Drift baru terdeteksi saat major audit atau saat production bug muncul. | Velocity prediction meleset karena spec sudah tidak match implementation (IEEE 2024, ICSE 2024). |

**After - Workflow yang Sama, Dengan Codeplex Chronicle**

| | | |
|:---|:---|:---|
| **Aktivitas Manager** | **Workflow Baru** | **Impact** |
| **Persiapan stakeholder review** | Buka Dashboard View. Velocity, burndown, milestone progress, contributor analytics live di satu screen. Export atau screenshot langsung. | Dari 15 menit aggregasi multi-tool menuju 1 menit Dashboard View. Tidak ada error transcription. |
| **1:1 dengan engineer** | Switch ke Activity Mode, type 'show me kerja @engineer dua minggu ini'. Camera fly-through district yang dia sentuh, Clio narrate kontribusi. | 1:1 naik tingkat dari status update jadi coaching grounded data spatial. Engineer lihat impact visual kontribusinya. |
| **Identifikasi review bottleneck** | Lihat kota di Sprint Mode. Crane yang sudah lama berdiri plus sticky note dengan badge counter tinggi visible immediately. | Bottleneck jadi early-warnable. Manager intervensi sebelum jadi sprint blocker. |
| **Sprint retrospective** | 60-detik Activity Mode flythrough dengan Clio narration. Lihat di district mana effort sprint terkonsentrasi, di mana drift muncul, di mana hotspot bug. | Retro turun dari flat slide ke spatial story. Action item grounded ke building dan district spesifik. |
| **Spec drift detection** | Crack visual pattern A-E di building yang drift. Clio narate timeline: 'issue ditutup 8 bulan lalu, file diedit 12 kali sejak itu'. | Drift visible terus-menerus, bukan hanya saat audit. Velocity prediction lebih akurat karena spec health terpantau. |

**Budi Success Statement**

| |
|----|
| *“Sebelum stakeholder review, gw butuh 15 menit aggregasi velocity dari tiga tools. Sekarang 1 menit di Dashboard View. 1:1 dengan engineer naik level dari status update jadi growth conversation karena gw bisa terbang ke district yang dia kerjakan dan diskusi grounded ke impact spatial-nya. Drift yang dulu hanya muncul saat audit major, sekarang visible terus-menerus.”* |

**Ringkasan Impact Metrics**

| | | |
|:---|:---|:---|
| **Metric** | **Before (Industry Baseline)** | **After (Codeplex Chronicle)** |
| **Time to basic productivity (new hire)** | 35 hari median, 91 hari capai PR ke-10 | Mental map dalam 30 menit Hermes tour |
| **Daily context switches (toggle antar app)** | 1.200 toggle per hari (HBR 2022) | Sprint, code, dan ticket di satu permukaan |
| **Velocity report preparation time** | 15 menit manual aggregation multi-tool | 1 menit Dashboard View live |
| **PR review bottleneck visibility** | Terlihat saat sudah jadi sprint blocker | Sticky note plus crane visible real-time |
| **Spec-implementation drift detection** | Manual audit, periodic, sering terlambat | Crack visual lima pattern deterministic |

Catatan: angka 'After' adalah target product, divalidasi via user
testing pasca-hackathon. Industry baseline 'Before' merujuk ke sitasi di
Section 2.

**User Stories Terpilih**

Delapan hero stories yang menggerakkan acceptance criteria di Section
12.

**Engineer Aldo**

- US-01. Sebagai engineer baru, gw mau tour 30 detik dari codebase
 supaya gw paham tiga district utama yang akan paling sering gw sentuh,
 plus pemiliknya.

- US-04. Sebagai engineer, gw mau scope sprint aktif di-overlay di atas
 kota supaya gw tahu di mana kerja itu hidup tanpa toggle ke Jira.

- US-06. Sebagai engineer, gw mau PR comment unresolved muncul sebagai
 annotation di building supaya bottleneck immediately spatial.

- US-08. Sebagai engineer, gw mau type plain-language refactor intent
 dan dapat ghost building proposal plus OpenSpec change folder, supaya
 proposal terstruktur, bukan sekadar deskripsi PR.

- US-11. Sebagai engineer, gw mau decision yang jelas antara Accept
 versus Done viewing setelah simulasi, supaya gw yang kontrol kapan
 production berubah.

**Manager Budi**

- US-17. Sebagai manager, gw mau Dashboard View dengan velocity,
 burndown, milestone progress, dan contributor analytics by default,
 supaya gw skip context switch antar-tools.

- US-19. Sebagai manager, gw mau sprint retrospective 60 detik dengan
 narrasi supaya retro meeting naik tingkat dari flat slide.

- US-21. Sebagai manager, gw mau alert spatial saat PR bottleneck
 muncul, supaya gw bisa intervensi sebelum jadi sprint blocker.

**5. Lima Product Modes**

Lima mode complementary berbagi underlying 3D city dan AI residents.
Mode switcher tinggal di top navigation. Setiap mode transform bagaimana
kota render dan panel mana yang surface, sambil tetap mempertahankan
spatial anchor yang sama.

**Mode 1 - Onboarding**

**Hero use case: mental map new hire dalam 30 menit, bukan dua minggu.**

Flow: klik Hermes di Tourist Info building, type 'give me a 30-second
tour'. Camera fly-through tiga district top yang dipilih secara
deterministic berdasarkan ownership concentration dan recent activity.
Building penting glow saat camera lewat. Hermes narrate di chat panel.
Tour selesai dengan summary: starting point file, owner contact,
rekomendasi file selanjutnya.

**Empat tour variant:**

- 'Give me a 30-second tour' - generic path untuk new hire.

- 'Tour for sprint goal X' - baca deskripsi milestone.

- 'Tour for feature Y' - follow dependency graph dari entry point.

- 'Tour as @username' - district yang user itu sering owns atau
 contribute.

**Mode 2 - Sprint Mode (HERO)**

**Hero use case: scope sprint aktif di-overlay di atas kota.**

Mode ini transform kota dari static codebase view menjadi live agile
workspace, tanpa switch ke ticketing tool terpisah. Ini differentiator
yang paling diingat tim agile.

**Fourteen PM Concept ke Visual Mapping**

| | |
|:---|:---|
| **Konsep Agile / PM** | **Visual di Kota** |
| Active story atau task | Scaffolding di sekitar building |
| Open PR di file | Crane animasi naik turun selama review |
| Backlog story | Blueprint pin melayang di atas slot kosong |
| Done this sprint | Green halo glow, transient 24 jam |
| Blocked story | Yellow tape dan warning icon |
| Bug atau issue type=bug | Smoke atau crack visible di building |
| Story point (size) | Size badge di scaffolding (S/M/L/XL) |
| Sprint goal | Banner besar di City Hall |
| Epic | District dengan border highlighted plus flag tengah |
| Definition of Done | Checklist melayang di atas building |
| Code review (PR open) | Inspector NPC mengorbit sampai approved |
| Dependency atau blocker | Red glowing bridge antar building |
| Refactor proposal | Ghost building dengan dashed outline |
| Spec drift | Crack visual dengan pattern A sampai E |

**PR-to-Building Real-Time Sync**

GitHub webhook propagasi PR state ke building visual di bawah 5 detik.
PR opened naikkan crane. Review requested kirim inspector NPC. Approved
trigger green halo. Merged clear scaffolding. Event store di PostgreSQL
catat setiap event untuk audit, cycle time, dan lead time derivation.

**PR Comment Surfacing**

Feature baru dari observasi tim: PR comment yang unresolved muncul
langsung di building sebagai visual annotation. PR pending dengan tiga
comment unresolved menampilkan sticky note plus badge counter. Visual
exact (sticky note, floating bubble, atau marker pin) di-finalize saat
eksekusi oleh Designer agent.

**Dual View**

Toggle ke Dashboard View untuk flat 2D manager-facing view dengan
velocity chart, live burndown, milestone progress, dan contributor
analytics.

**Mode 3 - Refactor Mode (SAFETY-FIRST)**

**Hero use case: spec-driven refactor di sandbox dengan dua human review
gate.**

Nine-step flow yang menjamin production code hanya berubah saat user
klik Accept.

- 1\. Intent input - user type plain-language intent seperti 'add 2FA to
 login'.

- 2\. Athena thinks - animasi indicate processing. DeepSeek V4-Pro
 thinking mode untuk intent kompleks, V4-Flash untuk yang sederhana.

- 3\. Ghost building appears - tiga building transparan render di lokasi
 yang disarankan dengan dashed outline.

- 4\. OpenSpec change folder auto-generate - side panel live stream
 proposal.md, design.md, dan tasks.md ke
 openspec/changes/\<change-name\>/.

- 5\. Clio narrate trade-offs - optional context narration tentang
 pendekatan alternatif.

- 6\. Review Gate 1 - user baca proposal, klik Run Simulation (bukan
 Apply).

- 7\. Simulation runs - backend coordinate DeepSeek V4 tiga turn: test
 gen, implementation gen, diff serialization. Output stream ke
 drafts/\<simulation-id\>/, tidak pernah ke production. UI play
 ghost-to-solid animation.

- 8\. Simulation completes - ghost solidify di simulation view. Side
 panel show diff plus stats. Dua tombol surface: Accept changes, atau
 Done viewing simulation.

- 9\. Review Gate 2 - Accept apply diff ke production. Done viewing keep
 simulation sebagai draft untuk review nanti atau discard. Production
 code hanya berubah di sini, on explicit user click.

| |
|----|
| *Ini adalah bagaimana kami develop. Kami buat itu spatial. AI eksplorasi di drafts. Manusia commit ke production.* |

**Mode 4 - Activity Mode**

**Hero use case: git-backed engineering intelligence.**

Visualisasi yang surface: ownership concentration per district (heatmap
colored by primary contributor), contributor heatmap, hotspot intensity
(building yang paling baru diedit glow paling terang), dan timeline
scrubber 30/60/90 hari.

**Empat use case primary:**

- Daily standup - 'tunjukkan aktivitas 24 jam terakhir'.

- Sprint retrospective - 60 detik flythrough dengan Clio narration.

- Onboarding context - 'tunjukkan kerja @username belakangan ini'.

- Performance review prep - 'ringkas kontribusi gw kuartal lalu'.

**Mode 5 - Health Mode**

**Hero use case: code health diagnostic dengan one-click backlog
ticket.**

Lima detector deterministic yang dimonitor Apollo:

| | |
|:---|:---|
| **Detector** | **Mekanisme** |
| **Hardcoded secrets** | Regex plus entropy via gitleaks pattern |
| **Outdated dependencies** | Parse manifest files, cross-check OSV API untuk known CVE |
| **Missing auth on protected routes** | Parse decorator dan middleware across TS/JS, Python, Go, Java, Rust |
| **Unsafe SQL patterns** | Deteksi raw string concatenation di queries, multi-language |
| **Complex untested files** | Cyclomatic complexity threshold plus test coverage stub |

Flow: switch ke Health Mode. Building glow merah (critical), oranye
(high), atau kuning (medium). Klik Apollo di Hospital building untuk
buka findings panel. Klik finding untuk evidence panel dengan file path,
line number, static analysis output, mitigation suggestion. Klik Convert
to Backlog Ticket untuk POST ke GitHub API - issue baru dibuat dengan
evidence chain pre-filled, dan animasi terbangkan issue dari building ke
Backlog Office.

**6. Lima AI Residents**

Lima AI resident spesialis tinggal di landmark ikonik yang geometry-nya
menandakan domain mereka. User klik landmark atau broadcast pertanyaan,
dan resident yang relevan respond. LLM provider DeepSeek V4, dengan
V4-Flash primary dan V4-Pro fallback untuk complex reasoning.

| |
|----|
| *Core safety philosophy. Setiap resident adalah narrator, navigator, summarizer, atau proposal author. Tidak ada autonomous decision maker. Semua insight grounded ke deterministic source data.* |

| | | |
|:---|:---|:---|
| **Resident** | **Landmark** | **Domain & Behavior** |
| **Athena** | City Hall (Greek temple) | The Architect. Refactor proposal author di Refactor Mode. Static analysis, identifikasi affected files plus dependencies, propose ghost building, auto-generate OpenSpec change folder. Tidak pernah landing code ke production - semua proposal lewat dua human review gate. |
| **Apollo** | Hospital (cross-shape) | The Doctor. Run lima deterministic detector (secrets, dependencies, auth, SQL, complexity). Surface evidence chain: file path, line number, static analysis output. Tidak invent fix - surface evidence, suggest direction. Findings bisa di-route ke one-click GitHub ticket atau di-escalate ke Athena. |
| **Argus** | Police Station (camera tower) | The Watcher. Security scanner dan vulnerability triager dengan kedalaman security. Produce vulnerability report dengan CVSS severity, exploit pattern, mitigation suggestion. Severe findings bisa di-escalate ke Athena untuk OpenSpec refactor proposal. |
| **Clio** | Library (book stack) | The Historian. Git archaeology, sprint retrospective narrator, drift storyteller. Narrate prose grounded ENTIRELY ke deterministic metadata: timestamps, edit count, reviewer identities. LLM hanya compose prose; semua angka dari git data. |
| **Hermes** | Tourist Info (glass beacon) | The Guide. Codebase tour generator untuk onboarding dan exploration. Drive camera lewat district kunci berdasarkan deterministic analysis (ownership, dependency, recency). Wrap structured data jadi engaging prose. User bisa pause mid-flythrough. |

**Contoh Narasi Clio (untuk Cracked Building)**

| |
|----|
| *“Building auth/oauth.ts retak di bawah Pattern A. Issue \#234 ditutup delapan bulan lalu, tapi file ini sudah diedit 12 kali dalam tiga bulan terakhir. Implementation kemungkinan drift dari spec original. Reviewer terakhir: @hafiz. Commit terakhir: dua minggu lalu.”* |

**7. Spec-Drift Detection**

Codeplex Chronicle visualisasikan gap antara code-as-implemented dan
code-as-specified. Ini adalah philosophical differentiator: tools lain
bilang apa yang ada di code Anda, kami bilang apa yang code Anda
janjikan versus apa yang akhirnya dikirim.

**Tiga Building State**

| | | |
|:---|:---|:---|
| **State** | **Definisi** | **Deteksi** |
| **Solid (normal)** | File exists, PR sudah sentuh, PR linked ke merged issue, atau change folder archived | Pure metadata join |
| **Ghost** | Path disebut di proposal atau issue body, milestone aktif, tapi path belum ada di filesystem | Regex plus filesystem check |
| **Cracked (retak)** | Drift terdeteksi via lima pattern deterministic | Pure deterministic detection |

**Lima Crack Patterns**

| | | |
|:---|:---|:---|
| **Pattern** | **Definisi** | **Signal** |
| **A. Stale closed issue** | Issue ditutup lebih dari 6 bulan, file masih terus diedit | Issue dianggap done tapi kerja berlanjut |
| **B. Closed without merge** | Issue ditutup, tidak ada PR merged yang sentuh file relevan | Issue mungkin dismissed, tapi spec masih di tracker |
| **C. Spec-implementation lag** | Issue ditutup dan file disentuh, tapi gap antara timestamp close dan last commit melebihi threshold | Implementation drift dari spec original |
| **D. Reopened cycle** | Issue di-reopen dua kali lebih, atau closing PR multiple di-revert | Spec terus berubah, building unstable |
| **E. OpenSpec drift** | Commit sentuh file yang direferensikan di archived OpenSpec change, tapi commit message tidak ada prefix opsx: | Hook bypass atau merge dari branch tanpa workflow guard |

**Clio sebagai Narrator, Bukan Judge**

Detector deterministic flag drift-nya. Clio narate prose grounded ke
timestamps dan metadata. Distinksi arsitektural matters: AI adalah
storyteller, bukan analyst. Pattern extensible - pattern baru bisa
ditambah tanpa ubah narration engine.

**8. Architecture Overview**

C4 model lengkap (Context, Container, Component, optional Code)
disediakan sebagai artifact diagram terpisah berdampingan dengan PRD
ini. Summary di bawah menangkap system context dan keputusan
arsitektural kunci.

**System Context**

Codeplex Chronicle adalah web SPA plus API yang integrate dengan tiga
external system:

| | |
|:---|:---|
| **External System** | **Purpose** |
| **GitHub** | Source of truth untuk repository, issue, milestone, PR, OAuth identity, dan webhook event |
| **DeepSeek API (api.deepseek.com)** | LLM inference untuk lima AI resident plus Refactor Mode multi-turn. V4-Flash primary, V4-Pro fallback |
| **PostgreSQL (Refactory-managed)** | Event store, cache, ticket state aggregation untuk cycle time dan lead time observability |

**Container Diagram**

| | |
|:---|:---|
| **Container** | **Tech** |
| **Frontend SPA** | Next.js 16, React 19, Three.js 0.184, @react-three/fiber 9.6 |
| **Backend API** | Python 3.12, FastAPI, Uvicorn |
| **LLM Client Layer** | OpenAI Python SDK pointing ke api.deepseek.com |
| **Database** | PostgreSQL, Refactory-managed |
| **OpenSpec Runtime** | Fission-AI OpenSpec CLI, core profile |
| **Ingress** | NGINX, Refactory configured untuk HTTPS termination |
| **Orchestration** | Kubernetes, namespace duopoly, Refactory managed |

**Sepuluh Keputusan Arsitektural**

| | |
|:---|:---|
| **\#** | **Decision** |
| **AD-01** | Monolith Next.js plus FastAPI, bukan microservice |
| **AD-02** | Treemap deterministic layout, bukan force-directed |
| **AD-03** | Raw InstancedMesh dengan setMatrixAt untuk 200-300 building |
| **AD-04** | OpenSpec dual-folder strategy: openspec/ panitia-facing plus .agent-openspec/ internal workflow |
| **AD-05** | Visual frontend-first wave sequencing, backend deferred |
| **AD-06** | DeepSeek V4-Flash primary plus V4-Pro fallback, bukan Gemini |
| **AD-07** | GitHub Issues sebagai backbone ticket (Sprint = Milestone, Story = Issue dengan label, PR = native) |
| **AD-08** | Refactor Mode write ke drafts/, dual review gate sebelum production |
| **AD-09** | Lima deterministic detector untuk Health, AI sebagai narrator only |
| **AD-10** | tree-sitter dengan 11 language grammar, lazy load per repo |

**9. Tech Stack**

**Refactory Mandatory Stack Compliance**

Refactory Hackathon Round 03 mandate empat teknologi. Codeplex Chronicle
pakai keempatnya secara natural, bukan bolt-on.

| | |
|:---|:---|
| **Required Tech** | **Implementation di Codeplex Chronicle** |
| **OpenSpec** | Fission-AI v1.0 stable, core profile. Dual-folder strategy per request panitia: openspec/ (panitia-facing primary spec) plus .agent-openspec/ (internal workflow output) |
| **LLMs** | DeepSeek V4-Flash primary plus V4-Pro fallback. OpenAI ChatCompletions API compatible. No OpenAI, no Anthropic, no Gemini at runtime |
| **Kubernetes** | Refactory pre-provisioned namespace duopoly dengan NGINX ingress, domain duopoly.hackathon.sev-2.com |
| **PostgreSQL** | Refactory-managed instance. Event store, cache layer, ticket state untuk cycle time dan lead time observability |

**Frontend Stack**

| | | |
|:---------------------|:----------------------------------|:--------------|
| **Layer** | **Stack** | **Version** |
| **Framework** | Next.js dengan App Router | 16 |
| **Language** | TypeScript strict mode | 5.x |
| **UI runtime** | React | 19 |
| **3D core** | Three.js (pinned, no auto-update) | 0.184 |
| **3D React binding** | @react-three/fiber | 9.6 |
| **3D helpers** | @react-three/drei | latest stable |
| **Post-processing** | @react-three/postprocessing | latest |
| **Camera animation** | GSAP | 3.x |
| **Styling** | Tailwind CSS | 3.x |
| **Charts** | Recharts atau Chart.js | latest |

**Backend Stack**

| | | |
|:---|:---|:---|
| **Layer** | **Stack** | **Notes** |
| **Language** | Python 3.12+ | async native |
| **Web framework** | FastAPI | Async, OpenAPI auto-doc, WebSocket streaming |
| **Static analysis** | tree-sitter Python binding | 11 grammar: TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift |
| **Security detector** | gitleaks pattern plus OSV API | Secrets plus CVE detection |
| **GitHub client** | PyGithub | Webhook receiver plus issue creation |
| **LLM client** | OpenAI Python SDK dengan DeepSeek base_url | openai \>=1.x |
| **Database ORM** | SQLAlchemy plus asyncpg | Async PostgreSQL |
| **Migration** | Alembic | Schema version control |
| **Real-time** | FastAPI WebSocket | Built-in untuk sync dan streaming |

**Cost Posture**

Hackathon runtime cost bounded di approximately lima dollar total,
covered oleh team DeepSeek account. GitHub API, Kubernetes, PostgreSQL,
dan demo domain semuanya pre-provisioned no-cost oleh Refactory. Buffer
comfortable: di V4-Flash pricing 14 sen per juta input token, lima
dollar represent ~30 juta input token - jauh di atas demo dan
development needs.

**10. Demo Flow**

Setiap finalist team punya sepuluh menit. Pitch core dua menit punchy.
Sisa delapan menit Q&A plus technical depth.

**Opening Hook (15 detik)**

| |
|----|
| *“Engineer baru join codebase 100K LOC. Hari ini dia baca README, buka VSCode, dan hilang di 200 files. Manager-nya minta velocity report, jadi dia buka tiga tool berbeda. Kami unify semuanya di satu kota.”* |

Awwwards-tier landing page buka. Klik Import a repository. Demo dataset
load. Cinematic intro lima detik fly camera dari low altitude. Lampu
nyala di kota saat resident bangun di landmark masing-masing.

**Mode 1 - Onboarding (25 detik)**

Klik Hermes di Tourist Info. Type 'give me a 30-second tour'. Camera
fly-through tiga district saat Hermes narrate. Ending: 'codebase ini
punya tiga district yang akan paling sering kau sentuh: auth, payment,
api. Starting point: auth/login.ts. Owner: @hafiz.'

**Mode 2 - Sprint Mode (45 detik, HERO)**

Switch ke Sprint Mode. Kota transform. Scaffolding naik di building
dengan ticket aktif. Crane muncul di building dengan PR open. Banner
'Sprint 14: Security hardening plus auth' muncul di City Hall. Inspector
NPC mengorbit building under review. Klik building yang di-scaffolded.
Ticket panel slide in: assignee, story point size:M, linked PR \#45,
status In Review. Sticky note di building show tiga comment unresolved.

Toggle ke Dashboard View. Velocity chart, live burndown, milestone
progress untuk manager lens.

| |
|------------------------------------------------------------------------|
| *Ini yang kami maksud spatial PM. Ticket hidup di tempat kerja hidup.* |

**Mode 3 - Refactor (30 detik)**

Switch ke Refactor Mode. Type intent: 'add 2FA to login flow'. Athena
thinks dua detik. Tiga ghost building muncul di auth/oauth.ts,
auth/totp.ts, auth/middleware.ts. Side panel live stream
openspec/changes/add-2fa/proposal.md, design.md, tasks.md. Klik Run
Simulation. Test ditulis dulu. Implementation landing incremental. Ghost
solidify frame by frame. Simulation complete. Dua tombol surface: Accept
changes dan Done viewing simulation. Klik Done viewing.

| |
|----|
| *AI eksplorasi di drafts. Production code hanya berubah saat kau accept.* |

**Mode 5 - Health dan One-Click Ticket (25 detik)**

Switch ke Health Mode di NodeGoat demo dataset. Delapan building glow
merah atau oranye. Klik Apollo. 'Apa yang salah?' Apollo respond:
hardcoded API key di config.ts line 12, missing auth di route /admin,
payment.service.ts cyclomatic complexity 52. Klik Convert to Backlog
Ticket di finding pertama. Animasi terbangkan issue dari building yang
affected ke Backlog Office. Konfirmasi live muncul di tab GitHub
side-by-side.

**Closing Punchline (10 detik)**

| |
|----|
| *“Flat ticket list tidak tunjukkan di mana kerja hidup. Static code map tidak tunjukkan apa yang sedang direncanakan. Codeplex Chronicle adalah satu peta kota: codebase Anda, sprint Anda, dan gap antara apa yang Anda rencanakan dengan apa yang Anda kirim - semua di satu tempat. AI eksplorasi di drafts. Anda commit ke production.”* |

Closing slide: dua pre-rendered bonus screenshot dari tokopedia/gripmock
dan gojek/courier-android dengan caption 'works on real Indonesian
production code'.

**11. Q&A Defense Cards**

Sepuluh pertanyaan yang diantisipasi dengan jawaban prepared untuk Q&A 8
menit pasca-pitch.

| | | |
|:---|:---|:---|
| **\#** | **Question** | **Answer** |
| **Q1** | Scale ke 1 juta LOC? | Treemap deterministic plus LOD plus InstancedMesh plus frustum culling. Demo run 300 files di 60fps. Theoretical scale 10K+ files dengan aggressive LOD. Production scale untested. |
| **Q2** | Private repo security? | Minimal GitHub OAuth scope: read:repo, read:issues, read:pull_requests, write:issues only. Token tidak pernah leave user session. Code parsing client-isolated, no cross-tenant leak. |
| **Q3** | Bagaimana AI residents avoid hallucination? | Setiap insight grounded ke static analysis output, git atau ticket metadata, OpenSpec proposal, atau deterministic detector. AI adalah narrator, bukan analyst. Refactor Mode write ke drafts/, bukan production. User harus explicit klik Accept. |
| **Q4** | Kenapa 3D city, bukan 2D graph? | Spatial encoding bandwidth lebih tinggi daripada 2D. Verticality encode LOC. District encode folder. Glow encode activity. Scaffolding encode work-in-progress. Combined dimension tell story yang 2D tidak bisa. |
| **Q5** | Kompetisi dengan Jira atau Linear? | Bukan kompetisi, complement. Kami piggyback GitHub Issues sebagai backbone. Tim keep workflow eksisting. Kami tambahkan spatial layer plus AI residents di atas. |
| **Q6** | OpenSpec mandatory untuk user? | OpenSpec first-class saat repo punya openspec/. Tanpanya, GitHub Issues jadi spec source informal. Progressive degradation. Untuk project kami, dual-folder per request panitia: openspec/ panitia-facing, .agent-openspec/ internal workflow. |
| **Q7** | Apa yang terjadi kalau DeepSeek API down? | Defensive layer: semantic cache plus pre-recorded canned response untuk top 10 demo question. V4-Flash fallback kalau V4-Pro fail. Demo flow tetap jalan di canned response worst case. |
| **Q8** | Kenapa DeepSeek, bukan OpenAI atau Anthropic? | DeepSeek V4 8-9x lebih murah per output token vs GPT 5.5 atau Claude Opus 4.7. OpenAI ChatCompletions API compatible, switch drop-in. Lima dollar cover seluruh hackathon dengan comfortable buffer. |
| **Q9** | Kalau drafts/ folder hilang? | Drafts di-track via simulation-id UUID, persist locally plus log di Postgres event store. User bisa resume dari My Drafts panel. Orphan draft recoverable via simulation-id lookup. |
| **Q10** | DeepSeek China-based. Data concern? | Source code dikirim ke DeepSeek inference saat Refactor Mode. User di-inform via OAuth consent flow dan privacy notice. Untuk compliance-sensitive use case, self-hosted DeepSeek V4-Flash di K8s feasible (MIT licensed, weights di HuggingFace). MVP hackathon pakai hosted API. |

**12. Success Criteria**

**Hard Success Criteria (Must-Have for Ship)**

| | |
|:---|:---|
| **\#** | **Criterion** |
| **SC-01** | Deployed product accessible di duopoly.hackathon.sev-2.com |
| **SC-02** | Lima product mode operational: Onboarding, Sprint, Refactor, Activity, Health |
| **SC-03** | Lima AI resident operational, masing-masing respond di bawah lima detik dari klik |
| **SC-04** | Demo flow tiga kali konsekutif successful (pre-demo rehearsal gate) |
| **SC-05** | OpenSpec panitia-facing Folder A populated dengan feature spec |
| **SC-06** | C4 diagram formal dan complete di deliverable bundle |
| **SC-07** | PRD plus slide deck submitted Day 2 jam 13:00 WIB |
| **SC-08** | Smoke test pass end-to-end tanpa crash |

**Soft Success Criteria (Differentiation)**

| | |
|:---|:---|
| **\#** | **Criterion** |
| **SS-01** | Visual quality baseline (glowing window, fog, particle, post-processing pipeline, camera idle drift) |
| **SS-02** | Stretch Tier 1 shipped (cinematic intro, verticality skyscraper, iconic landmark architecture, Director mode auto-fly) |
| **SS-03** | Hybrid Write Layer 1 (Apollo to ticket) plus Layer 2 (Refactor simulation) both operational |
| **SS-04** | PR-to-Building real-time webhook latency di bawah lima detik |
| **SS-05** | Closing slide bonus screenshot rendered |

**Acceptance Criteria Hero**

**Onboarding**

- Camera fly-through tiga district dalam 30 detik.

- Minimal tiga building glow selama fly-through.

- Hermes narration render. Ending summary show starting point file plus
 owner contact.

**Sprint**

- Scaffolding di setiap building dengan active ticket.

- Crane di setiap building dengan open PR.

- PR opened webhook propagate di bawah lima detik.

- Ticket panel buka di bawah 300ms saat klik.

**Refactor**

- Dalam sepuluh detik dari intent, tiga ghost building render dengan
 dashed outline.

- OpenSpec change folder content stream live.

- Run Simulation trigger DeepSeek multi-turn.

- Ghost-to-solid animation play frame by frame.

- Dua tombol (Accept versus Done viewing) surface pada completion.

**Health**

- Lima detector run di NodeGoat, kelimanya fire.

- Building glow dengan severity color-coded.

- Convert to Backlog Ticket create GitHub issue dengan evidence chain
 pre-filled.

**13. Team & Closing**

**Tim Duopoly**

Codeplex Chronicle dibangun oleh tim dua orang yang operate di bawah
hands-off model: operator relay handoff antar AI agent, approve
keputusan, dan ferry pengetahuan antar context. Eksekusi code
di-delegate full ke Claude Code worker, termasuk Kubernetes deploy dan
slide deck generation pipeline.

| | |
|:---|:---|
| **Member** | **Role** |
| **Ghaisan Khoirul Badruzaman** | Workflow orchestration, agentic pipeline design, PRD authoring, pitch lead |
| **Hafiz Fauzan Syafrudin** | Operator partner di sleep-cycle handoff, Kubernetes deploy familiarization, slide deck author, Day 2 final presentation |

**Submission Bundle**

- PRD (dokumen ini, plus versi Markdown agent-consumed)

- C4 diagram formal dan detail, generated oleh Claude Code agent

- Repository link: github.com/Finerium/codeplexRefactory

- Slide deck: authored oleh Hafiz di Day 2

**Closing**

Codeplex Chronicle treat codebase sebagai tempat. Engineer berjalan
melaluinya. Manager terbang di atasnya. AI residents bicara tentangnya.
Refactor proposal datang dalam ghost form sebelum settle sebagai solid
building. Spec drift retakkan dinding sampai seseorang menambal
celahnya.

Lima product mode. Lima AI resident. Satu kota. Semuanya grounded ke
deterministic source, OpenSpec first-class, dan DeepSeek V4 inference.
Production code hanya berubah saat user memutuskan.

***Your codebase, alive.***

*Tim Duopoly · Refactory Hackathon Round 03 · Telkom University Bandung
· 12-13 Mei 2026*

**Lampiran - Sumber Referensi**

Empirical data yang menggerakkan Section 2 (Problem Statement) dan
Section 4 (Impact Profile).

- Harvard Business Review (2022). Average digital worker toggles between
 apps 1,200 times per day.

- Mark, Gloria. University of California Irvine. 23 minutes to regain
 focus after interruption.

- Atlassian Engineering Survey (2025). Context switching ranked \#3
 productivity killer among 3,500 engineers surveyed.

- Burai Research (2024). Tech professionals log into 20+ tools daily.

- Noda, Abi. DX Engineering Enablement (2025). New hires reach 10th PR
 in 91 days on average in enterprise organizations.

- APQC Research. Median 35 days for new employees to reach basic
 productivity; 50+ days for laggard organizations.

- LinearB Engineering Benchmarks (2023). Median PR cycle time 4.2 days;
 44% teams cite slow review as biggest bottleneck.

- IEEE Xplore (2024). A Review on Detecting and Managing Documentation
 Drift in Software Development.

- ICSE 2024. Capturing and Understanding the Drift Between Design,
 Implementation, and Documentation.

- DX Research (2025). Code rot accelerated by AI-generated code with
 conflicting conventions.
