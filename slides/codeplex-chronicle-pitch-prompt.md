# Codeplex Chronicle Pitch Deck Generation Prompt

**Consumer**: Hafiz (operator role, paste into claude.ai/design atau Gamma.app Day 2 jam 11-13 submission window)
**Output target**: 9-slide PDF, 16:9 aspect ratio, dark mode professional pitch tier
**Time budget**: 60-90 min Hafiz finalize manual
**Authored by**: Pan post-Wave 3, 2026-05-12 23:55 WIB

---

## Prompt template (paste into claude.ai/design canvas atau Gamma input)

```
Generate a 9-slide pitch deck for a hackathon submission. Theme: dev-poetic + cinematic-restraint, dark mode professional, 16:9 aspect ratio, Inter font for body + bold sans-serif for headers.

Project: Codeplex Chronicle (Tim Duopoly, Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026)

Tagline: YOUR CODEBASE, ALIVE

Brand color palette:
- Background: deep blue-violet (#0A0814)
- Accent 1: cyan (#00D4FF) for highlights + tagline
- Accent 2: warm amber (#FFA552) for HERO mode hero shots
- Text primary: pure white (#FFFFFF)
- Text secondary: light gray (#A0A0B8)
- Card border: subtle violet (#2D1B69, 40% alpha)

Typography:
- Headers: Inter Black 700, 60-72px on slide 1, 48-56px on body slides
- Body: Inter Regular 400, 18-24px line height 1.5
- Captions: Inter Medium 500 italic, 14-16px

Visual style:
- Each slide MUST have a clear visual focal point: 3D city screenshot, schematic diagram, comparison grid, or hero typography
- Use depth-of-field bokeh in background for slide 1 + slide 8 + slide 9
- Use icon grid for slide 2 + slide 3 + slide 6 (icons monochrome cyan)
- Use split-screen 50/50 for slide 5 (production solid vs draft ghost)
- Use timing breakdown for slide 7 (numbered list with timing badges)

Slide content (verbatim per pitch script):

Slide 1 Title
Header: YOUR CODEBASE, ALIVE
Subheader: Codeplex Chronicle
Footer left: Tim Duopoly. Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin.
Footer right: Refactory Hackathon Round 03. Telkom University Bandung. 12-13 May 2026.

Slide 2 Problem
Header: Engineering Productivity Bottleneck
Body: 4 pain point grid:
1. New engineer mental map gap: 2 weeks ramp-up vs 30 min senior pattern recognition.
2. PR review context fragmentation: reviewer jumps file-to-file, loses module narrative.
3. Refactor fear: team avoids AI changes hitting production untested.
4. Code drift invisible: implementation diverges from spec, team unaware until bug ships.

Slide 3 Solution
Header: 5 Mode + 5 Resident
Left column: 5 Product Mode
- Onboarding tour
- Sprint HERO 14 PM concept
- Refactor SAFETY-FIRST
- Activity timeline
- Health glow
Right column: 5 AI Resident
- Athena at City Hall (Refactor proposal)
- Apollo at Hospital (Health narration)
- Argus at Police Station (Security CVSS)
- Clio at Library (Git + spec drift)
- Hermes at Tourist Info (Tour script)

Slide 4 HERO Mode
Header: Sprint Mode HERO
Subhead: 14 PM Concept Visualized in 3D
Hero image placeholder: 3D city screenshot with Sprint Mode overlay (15 PM concept chip floating)
Body bullet:
- Click building to ticket panel
- PR merged updates building visual via webhook
- Velocity + cycle time + burndown + ownership heatmap in treemap layout
- 5 SaaS replaced by 1 canvas

Slide 5 Safety-first Refactor
Header: drafts/ Isolation Safety Property
Subhead: AI explores in drafts. You commit to production.
Split screen:
Left: production building (solid, color full)
Right: ghost building (translucent, dashed border)
Body bullet:
- 3-turn simulation in drafts/ folder
- Production code mtime never touched (AD-19 LOCKED)
- 14 attack vector test passing
- Dual review gate: Accept downloads diff, Discard cleanup
- Dev keeps final authority

Slide 6 Tech Stack
Header: Production-grade Foundation
Stack badge grid 6:
- DeepSeek V4 per-resident routing
- OpenSpec dual-folder strategy
- Kubernetes namespace duopoly
- tree-sitter-language-pack 11 language lazy-load
- Next.js 16 + React 19 + Three.js + r3f 9.6
- FastAPI + Python 3.12 strict
Caption: per PRD locked tech stack Section 17

Slide 7 Demo Flow
Header: Live Deploy
QR code + URL prominent: https://duopoly.hackathon.sev-2.com
Subhead: K8s pod 1/1 Running, smoke test 3x consecutive PASS
Timing breakdown 2-min walkthrough:
- 15 sec Opening hook
- 25 sec Onboarding camera fly
- 45 sec Sprint Mode HERO 14 PM
- 30 sec Refactor Mode drafts/ + dual review
- 25 sec Health Mode 1-click ticket
- 10 sec Closing punchline

Slide 8 Closing Punchline
Hero typography centered:
"AI explores in drafts."
"You commit to production."
Below: 5 resident portrait grid with quote per resident:
- Athena: "Saya propose, you decide."
- Apollo: "Kesehatan repo Anda, saya yang narate."
- Argus: "Security finding, CVSS scored."
- Clio: "Spec dan code drifting? Saya yang tracking."
- Hermes: "Tour codebase Anda dalam 30 detik."

Slide 9 Closing Bonus (Defensibility)
Header: Defensibility 3
Three column comparison:
Column 1: Spec-drift A-E deterministic
- 5 pattern AST-diff based NOT LLM-only
- Reliability bar measurable
Column 2: 1-click GitHub issue Hybrid Layer 1
- Apollo finding to GitHub issue with template
- Layer 2 PR write explicit OUT-OF-SCOPE per PRD 19.3 minimal scope
- Defendable at Q&A
Column 3: Capacity buffer ahead nominal
- 24-jam build budget
- Wave 0-3 ship clean per per-wave audit gate
- 11 jam buffer pre-submission deadline
- Planning discipline + audit gate quality

Footer all slides: Tim Duopoly / Codeplex Chronicle / Refactory Round 03 / duopoly.hackathon.sev-2.com

Anti-pattern compliance: no em dash anywhere (use hyphen or comma). No emoji. Indonesian terms preserved verbatim (gw, lu, propose, narate, scored, tracking, tour) for authentic developer voice.

Output: 9-slide PDF export. Quality: production pitch-tier ready for top-5 selection presentation Day 2 jam 15:00-17:00 WIB.
```

---

## Alternative prompt for Gamma.app

```
9-slide pitch deck for "Codeplex Chronicle" hackathon submission.

Theme: dark mode, dev-poetic + cinematic, 16:9 ratio.

Colors: deep blue-violet background, cyan accent, amber HERO highlight.

Content: paste 9-slide markdown block from codeplex-chronicle-pitch-template.md Slide 1 through Slide 9 sections, copy each slide header + body bullet + visual description.

Output: PDF export 9-page, Inter font, professional pitch-tier.

Anti-pattern: no em dash, no emoji.

Live URL: https://duopoly.hackathon.sev-2.com
```

---

## Hafiz workflow Day 2 jam 11-13

1. **Jam 11:00-11:15**: Read this prompt template + open claude.ai/design or Gamma.app
2. **Jam 11:15-12:00**: Paste prompt + iterate visual style (3-5 iteration cycle)
3. **Jam 12:00-12:30**: Manual review + tweak typography + add 3D city screenshot to slide 4+5+7
4. **Jam 12:30-12:45**: Export PDF + add to `PanitSubmission/slides/` folder
5. **Jam 12:45**: Ghaisan zip + upload Refactory portal

---

## Backup prompt variant (compact)

```
Generate 9-slide dark-mode pitch deck for "Codeplex Chronicle" (Tim Duopoly, Refactory Hackathon Round 03). Tagline: YOUR CODEBASE ALIVE. Theme: dev-poetic cinematic restraint. Slides: title, problem, solution, HERO mode, safety-first refactor, tech stack, demo flow, closing punchline, defensibility differentiator. 16:9 Inter font. No em dash no emoji. Indonesian + English code-switch in body. Live URL: duopoly.hackathon.sev-2.com.
```

---

**Pan handoff complete**: Hafiz consumes Day 2 jam 11-13 submission window. Speaker note timing 200 sec total per `codeplex-chronicle-pitch-template.md`. Q&A defense reference per PRD Section 16.
