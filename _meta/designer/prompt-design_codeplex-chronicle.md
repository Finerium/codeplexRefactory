# claude.ai/design Prompts for Codeplex Chronicle

**Project**: Codeplex Chronicle (Tagline: `YOUR CODEBASE, ALIVE`)
**Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event**: Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
**Authored by**: V1 Designer (`/designer-v1`) session 12 May 2026, v2 rewrite
**Downstream consumption**: Paste each fenced block into a SEPARATE claude.ai/design roomchat session. Expect dialog — Claude Design will propose multiple visual directions before building. Pick one verbally. Iterate via Tweaks sliders + inline comments. Export Code Handoff Bundle when satisfied. Bundle consumed by Claude Code Wave 1-2 workers.

---

## Usage notes (read before pasting)

- Each prompt opens an invitation to brainstorm, not a spec to execute. Claude Design will respond with 3 direction proposals. Pick one verbally in the same roomchat. Then it builds.
- The 3 pages (Landing, Entry, Dashboard) are designed in 3 separate roomchat sessions. Each prompt mentions the sibling pages briefly so Claude Design knows it's part of a suite.
- Cross-page cohesion is light: same typography family across the 3 pages, same voice tone. Palette may vary per page mood (Landing cinematic-dark, Entry warm-welcoming, Dashboard instrument-panel). Mention this to Claude Design in the second/third session if it asks.
- Claude Design generates real code with inline 3D, shaders, interactive prototype behavior, and contextual Tweaks sliders. Let it use the full toolkit.

---

## Prompt 1: Landing Page

> Paste the fenced block below into a fresh claude.ai/design roomchat. Expect Claude Design to propose 3 visual directions first. Pick one verbally, then it builds.

````markdown
Let's design the landing page for Codeplex Chronicle.

## What we're building

Codeplex Chronicle is a real, shipped AI-resident development environment. It turns production codebases into living 3D cities — files become buildings, folders become districts, errors become earthquakes you can feel. Five AI residents live in landmark buildings and serve five product modes: they read code, propose refactors, narrate sprint changes, surface health issues, and welcome new engineers.

Tagline: `YOUR CODEBASE, ALIVE`
Sub-tagline: An AI-resident development environment.
Live at: duopoly.hackathon.sev-2.com
Built during Refactory Hackathon Round 03 at Telkom University Bandung, May 12-13 2026, by Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin).

## Five product modes (use these names verbatim, write evocative one-liners yourself)

- Onboarding — new engineer mental map in 30 minutes, not 2 weeks
- Sprint — agile workflow projected onto the city, PR-to-building in real time (this is the hero mode, give it more weight)
- Refactor — AI proposes structural changes, runs them in a sandbox folder, you accept or discard
- Activity — git-backed engineering intelligence, ownership heatmap, hotspot tracking
- Health — code diagnostic with deterministic detectors, one-click ticket creation

## Five AI residents (use these names verbatim, they're Greek mythology, write evocative one-liners yourself)

- Athena — the architect, lives in City Hall
- Apollo — the doctor, lives in the Hospital
- Argus — the watcher, lives in the Police Station
- Clio — the historian, lives in the Library
- Hermes — the guide, lives in the Tourist Info booth

## Concept anchors (these MUST be visually present, you decide how)

**Trinity**: Code becomes city. AI residents move in. These three layers (code, AI, city) are the founding metaphor. Make them feel connected, not separated.

**Shy creatures**: Each of the 5 residents has a creature companion — easy-to-design silhouette form (think capybara, ghost, sprite, blob, drop — not complex realistic). When the user's cursor approaches a creature, it flees with personality and returns when the cursor leaves. Distribute creatures so that no more than one is visible in the same viewport at a time. They're delight moments, not decoration density.

**Cinematic scrolltelling**: The page should feel like scrolling through a movie about a city that's alive at night. Every motion choice should be intentional.

## Ambition

I want this page to look like nothing else on the web. Go beyond Awwwards Site of the Month tier. The user (an engineer with sharp taste) should pause and screenshot it. If your first instinct is something that would already be on Awwwards, push further.

## Tone

Cinematic restraint. Dev-poetic — declarative present-tense fragments. Specific numbers over marketing adjectives. The page feels like a building at night with someone working inside — windows glowing, presence implied, no one shouting. Avoid the obvious "AI product launch" voice. We're a dev tool, not a consumer pitch.

## CTA

`Open the city →` (this is a real shipped product, not a demo or prototype — frame the CTA as entering, not trying).

## Hackathon credit must appear somewhere

`Built at Refactory Hackathon Round 03, Telkom University Bandung, May 12-13 2026. Tim Duopoly: Ghaisan Khoirul Badruzaman, Hafiz Fauzan Syafrudin.`

## Suite context

This is page 1 of 3 in a suite. Page 2 is the Application Entry (the threshold after this landing's CTA). Page 3 is the Dashboard (manager-facing). They're being designed in separate sessions. For cohesion, your typography family and overall voice should feel like the same product across the suite. Palette is allowed to vary per page mood.

## How I want you to work with me

1. **Before building, propose 3 distinct visual directions tailored to this brief.** Each direction: one-line description of mood + palette feel + typography character + creature style + how Trinity translates visually. Ask me to pick one before implementing.

2. **Use your full creative authority** on palette, typography family, light/dark mode, layout structure, section flow, motion specifics. I'm not locking these.

3. **Use your full toolkit** — 3D scenes inline, shaders, scroll-driven motion, interactive prototype behavior, custom Tweaks sliders for parameters I'd want to dial later (creature flee distance, glass opacity, palette saturation, motion intensity, particle density, scroll-act pacing).
````

---

## Prompt 2: Application Entry Page

> Paste the fenced block below into a separate claude.ai/design roomchat (fresh session, not the Prompt 1 session). Expect 3 direction proposals first. Pick one verbally, then it builds.

````markdown
Let's design the entry page for Codeplex Chronicle.

## What we're building

Codeplex Chronicle is a real, shipped AI-resident development environment that visualizes codebases as living 3D cities. The marketing landing sells the product; this Entry page is the threshold between the landing and the actual application.

When someone clicks `Open the city →` from the landing, they arrive HERE. At this page they make one decision: bring an existing repository in, or start a fresh one from scratch. Then they enter the 3D City View where 5 AI residents live and work.

Built during Refactory Hackathon Round 03 at Telkom University Bandung, May 12-13 2026, by Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin).

## Content material

The page presents two doors. Use this exact framing copy:

`Two doors. One opens to your codebase. The other to a blank lot.`

The two options:

**Import a repository** — Authorize with GitHub. Pick a repo. We render the city.
CTA: `Connect GitHub →`

**Build from scratch** — Start with an empty lot. We render as you code, all in-memory.
CTA: `Open a blank city →`

Below the decision, introduce the 5 residents the visitor will meet inside:

- Athena — the architect, lives in City Hall
- Apollo — the doctor, lives in the Hospital
- Argus — the watcher, lives in the Police Station
- Clio — the historian, lives in the Library
- Hermes — the guide, lives in the Tourist Info booth

Write evocative one-line bios yourself. These are colleagues the visitor will meet, not features.

A small badge somewhere visible: `v0.3 prototype` (signals to engineering visitors that they're seeing hackathon-grade alpha).

Hackathon credit at the bottom: `Built at Refactory Hackathon Round 03, Telkom University Bandung, May 12-13 2026. Tim Duopoly: Ghaisan Khoirul Badruzaman, Hafiz Fauzan Syafrudin.`

## Concept anchors

**Threshold mood**: This page is an airlock between the cinematic landing and the working application. Calmer than the landing. Warmer than the dashboard. The visitor should feel welcomed, not sold to.

**One creature companion**: Exactly one shy creature is present on this page — recommend Hermes the guide since he welcomes people in. Same cursor-flee personality as on the landing, but only this single creature. This is a quiet page, not a creature parade.

**Doors metaphor visible**: You decide how — literal doors, two architectural surfaces, two diverging paths, two windows looking into different cities. The "two doors" framing should translate into visual decision somehow.

## Ambition

The visitor's eye should know what to click in under 3 seconds. But the moment should still feel like part of the Codeplex world, not a generic SaaS sign-in. Push beyond the standard "two big buttons on a soft background" pattern.

## Tone

Warm welcoming technical. Calmer than the landing's cinematic-dark. The vibe of a hotel front desk crossed with a developer terminal — someone is welcoming you, but the materials remain dev tooling.

## Suite context

This is page 2 of 3 in a suite. Page 1 is the cinematic Landing (where the visitor came from). Page 3 is the Dashboard (manager-facing, where they end up after entering). They're being designed in separate sessions. For cohesion, your typography family and overall voice should feel like the same product as the Landing. Palette is allowed to vary per page mood — this page deserves a warmer treatment than the Landing's cinematic-dark, in deliberate contrast.

## How I want you to work with me

1. **Before building, propose 3 distinct directions for the warm-welcoming threshold mood.** Each direction: one-line description of mood + palette feel + typography character + how the "two doors" translate visually + creature treatment. Ask me to pick one before implementing.

2. **Use your full creative authority** on palette, typography family, mode (light/warm-dark/cream/whatever), layout structure, motion specifics. I'm not locking these.

3. **Use your toolkit** — interactive prototype behavior on the two cards (hover state, click reveal, etc.), shaders or 3D if it fits, custom Tweaks sliders for parameters like card lift intensity, creature flee distance, ambient warmth, door-metaphor visibility.
````

---

## Prompt 3: Dashboard View

> Paste the fenced block below into a separate claude.ai/design roomchat (fresh session, not Prompt 1 or Prompt 2). Expect 3 direction proposals first. Pick one verbally, then it builds.

````markdown
Let's design the dashboard view for Codeplex Chronicle.

## What we're building

Codeplex Chronicle is a real, shipped AI-resident development environment that visualizes codebases as living 3D cities. Engineers spend time in the 3D City View; engineering managers default to THIS Dashboard.

Persona: engineering manager, 5-10 years experience, leads 8-20 engineers, drinks coffee, opens this at 9 AM. They need to know in 5 seconds: what's on fire, what's on track, what needs attention today.

Built during Refactory Hackathon Round 03 at Telkom University Bandung, May 12-13 2026, by Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin).

## Content material (compose these however makes sense — you decide layout)

**One-sentence briefing at the top** (display voice, generated from data, treat as templated placeholder):
`Sprint 14 ships in 3 days. Velocity holding at 18 points. One drift pattern triggered in the auth district.`

**KPI glance metrics** (the 5-second scan):
- Velocity (story points this sprint vs avg) — current 18 points, +12%
- Cycle time (PR opened → merged median) — 2.1 days, -8%
- Change failure rate — 4.2%, steady
- Deploys this week — 14, +3

**Trend visualizations**:
- Burndown chart for the current sprint (ideal vs actual)
- Velocity over the last 8 sprints

**Drill-down sections**:
- Top contributors this sprint (avatar + GitHub username + PR throughput)
- Spec drift summary, five patterns each with count + severity:
  - A — Stale closed issue (issue closed >6 months but file still edited after)
  - B — Closed without merge (issue closed without a relevant PR merged)
  - C — Spec-implementation lag (gap between close timestamp and last file commit)
  - D — Reopened cycle (issue reopened twice or more)
  - E — OpenSpec drift (commit touches a file referenced in archived spec without `opsx:` prefix)
- Refactor proposals open, grouped by stage: Proposed / Running simulation / Drafted / Accepted / Archived

**Cross-repo rail** — compact strip showing all connected repos with mini sparkline + status dot per repo.

**City preview corner** (suggest fixed bottom-right) — a small preview of the 3D city view with an `Open city view →` link to enter the spatial view. Argus the watcher resident sits in this corner, blinking, watching the city.

**Multi-repo dropdown** at the top — switch context between repos.

**Time range selector** — today / this sprint / this quarter.

## Concept anchors

**Instrument-panel mood**: This is the bridge of a quiet ship at night. Instruments glowing, one officer watching, nothing on fire but everything visible. Calm, present, decisive. Not marketing. Not poetic. Information-dense but structured.

**Argus as quiet companion**: Argus the watcher is the resident pet on this page. He blinks, his eye tracks subtly. Unlike the landing creatures, he does NOT flee — he watches. He's at home here. Hovering shows a subtle highlight ring. Different motion budget than the landing.

**Spec drift severity discipline**: The five drift patterns need clear severity differentiation. You decide the visual system (color, shape, density, motion) — but it should be instantly scannable. A manager should know which drift pattern is worst in under 1 second.

## Ambition

This should feel like the dashboard a serious engineering team would actually use daily, not a marketing dashboard mockup. Linear analytics, Stripe Atlas, Sentry incident view as reference vibes. But still distinctly Codeplex Chronicle — the city preview corner is unique to us, lean into that.

## Tone

Clinical-confident. Briefing-ready. Sober. The manager should feel the data is honest with them. No marketing adjectives, no urgent red-everything panic, no playful microinteractions. Most dashboards look like Grafana — we're not Grafana.

## Suite context

This is page 3 of 3 in a suite. Page 1 is the cinematic Landing, Page 2 is the warm-welcoming Entry. They're being designed in separate sessions. For cohesion, your typography family and overall voice should feel like the same product across the suite. Palette is allowed to vary per page mood — this Dashboard deserves a more restrained, instrument-panel treatment than the Landing's cinematic-dark or the Entry's warm welcome.

## How I want you to work with me

1. **Before building, propose 3 distinct directions for the instrument-panel mood.** Each direction: one-line description of palette + information hierarchy approach + how Argus presents + how spec drift severity is visually encoded + how the city preview corner is treated. Ask me to pick one before implementing.

2. **Use your full creative authority** on palette, typography family, mode, layout grid, severity color system, chart visual style. I'm not locking these.

3. **Use your toolkit** — interactive prototype behavior (filter toggles, drill-down click states, tooltip hover reveals, multi-repo dropdown swap), 3D city preview corner inline, custom Tweaks sliders for parameters I'd want to dial later (information density, Argus blink frequency, severity contrast intensity, city preview size, chart line weight).
````
