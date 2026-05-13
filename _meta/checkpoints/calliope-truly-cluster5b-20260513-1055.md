# Calliope truly-cluster5b checkpoint, 2026-05-13 10:55 WIB

## Mandate

Manager FINAL Cycle 4 truly-cluster5b dispatch. Pan audit #5 verdict: tech
stack signal logos invisible on Landing, only "tree-sitter" string buried
inside TrinityCode SVG. Judges scanning landing cannot tell the stack at a
glance, weakens hackathon engineering depth rubric.

Wall clock budget: 15 min HARD.

## Investigation summary

1. `frontend/app/(marketing)/page.tsx` composition: Hero, Trinity, Sprint,
   Modes, Residents, Closer. No `TechStackSignal` component exists.
2. `frontend/components/marketing/*` inventory: 14 components, none for
   tech stack. Notional `TechStackSignal` from the Calliope agent prompt
   never landed because the Designer Prompt 1 bundle collapsed it into a
   single `$ tree-sitter parse` line inside `TrinityCode` SVG.
3. Searched Designer bundle `refactory-landing-page/project/` 14 files,
   zero references to DeepSeek, FastAPI, Three.js, Next.js, OpenSpec.
   Confirmed Designer never authored a stack section.
4. Pan complaint is therefore a real gap, not a styling regression.

## Decision

Author a new `TechStackSection` component placed after `ResidentsSection`
and before `CloserSection`. Text-only mono lockup, two columns (Runtime,
Intelligence), styled with existing marketing tokens (`--ink`, `--warm`,
`--line`, `--mono`, `--ink-3`).

Rejected alternatives:
- External logo CDN (network dep, brand-asset risk, Pan -> Hafiz slide deck
  better suited if branded marks needed).
- Inline SVG vendor logos (15 min budget too tight for 10 hand-traced SVGs,
  visual quality below Awwwards floor if rushed).
- Edit TrinityCode to add more rows (cramped, breaks Trinity composition).

Chosen: developer-manifest voice matching the existing
`$ tree-sitter parse -> AST -> district mapper` line, with a per-item one
liner note (e.g. `Next.js 16  App Router, RSC`). Reads as authentic
engineering signal rather than marketing logo soup.

## Files touched

- `frontend/components/marketing/TechStackSection.tsx` (new, 74 lines)
- `frontend/components/marketing/index.ts` (+1 export line)
- `frontend/app/(marketing)/page.tsx` (+2 lines: import + render)
- `frontend/app/(marketing)/marketing.css` (+52 lines, .techstack family)

## Stack items surfaced

Runtime column: Next.js 16, React 19, Three.js + r3f, Tailwind + GSAP,
TypeScript.

Intelligence column: FastAPI + Python 3.12, DeepSeek V4, tree-sitter,
OpenSpec, PostgreSQL.

10 items total. Matches PRD Section 17 LOCKED tech stack with the
agent-deployment specifics (`tree-sitter-language-pack` and OpenSpec
Fission-AI dual folder) signaled via the per-item note text.

## Compliance check

- Em dash scan: 0 hits in TechStackSection.tsx + marketing.css delta.
- Emoji scan: 0.
- Scope: stayed inside landing components, no Wave 2 panel touched, no
  Atlas redeploy required (frontend bundle rebuild on Atlas next push).
- `npx tsc --noEmit` clean for the touched files.

## Atlas handoff

Manager FINAL Cycle 4 owns batched redeploy. This change ships as part of
the V8 lock push. No standalone Atlas request.

## Wall clock

Dispatch -> ship: 12 min. Inside the 15 min hard budget.
