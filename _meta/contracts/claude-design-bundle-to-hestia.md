# Contract: Claude Design Bundle to Hestia

**Edge type**: external (claude.ai/design manual session output to Wave 1 worker)
**Wave**: External (Ghaisan operator) to Wave 1 consumer
**Status**: locked
**Authored**: 2026-05-12 14:58 WIB

## Producer

**Worker**: Ghaisan Khoirul Badruzaman (operator) via claude.ai/design platform manual session execution
**Domain**: Paste Prompt 2 (Application Entry Page) from `_meta/designer/prompt-design_codeplex-chronicle.md` lines 95-161 into fresh claude.ai/design roomchat (SEPARATE from Prompt 1 session). 3-direction proposal dialog, pick one, iterate, export Code Handoff Bundle.

**Identity disclosure**: NOT a Claude Code worker. Producer is human operator (Ghaisan) plus the claude.ai/design assistant.

## Consumer

**Worker**: Hestia (Wave 1)
**Domain**: Entry page execution at `frontend/app/start/page.tsx`. 2 entry cards (Import a repository + Build from scratch), 5 resident introduction footer, `v0.3 prototype` badge, GitHub OAuth handoff stub button (Wave 1 stub redirects to placeholder URL; Wave 3 Hades wires real OAuth flow per contract `hestia-to-hades.md`).

## Output schema (producer to consumer)

```
_meta/designer/prompt2-entry/handoff-bundle-extracted/
├── design-tokens.json          # Warm-welcoming palette (warmer than Landing), shared typography family
├── components/
│   ├── DoorsHeader.tsx         # "Two doors..." framing copy + visual decision
│   ├── EntryCard.tsx           # Reusable card for Import + Build, hover state, click reveal
│   ├── ImportRepositoryCard.tsx
│   ├── BuildFromScratchCard.tsx
│   ├── ResidentsFooter.tsx     # 5 resident introduction badge cards
│   ├── PrototypeBadge.tsx      # v0.3 prototype, top-right
│   ├── HackathonCreditFooter.tsx
│   └── HermesCreature.tsx      # Single creature (Hermes guide) per Designer instruction
├── pages/
│   └── page.tsx                # Assembled entry page composition
├── public/
│   └── ...                     # Hermes creature SVG, door icon assets
└── intent.md                   # Threshold mood + warm-welcoming tone + Hermes treatment
```

`design-tokens.json` warmth variant (concrete expectations):

```json
{
  "colors": {
    "background": { "primary": "#f5efe4", "secondary": "#ebe2cf" },
    "foreground": { "primary": "#2a2620", "secondary": "#6a625a" },
    "accent": { "import": "#6b8b6f", "build": "#a37a52" }
  },
  "typography": {
    "display": "...same family as Prompt 1 Landing (cohesion mandate)",
    "body": "...same neo-grotesque body as Prompt 1"
  },
  "tweaks": {
    "cardLiftIntensity": 0.6,
    "creatureFleeDistance": 120,
    "ambientWarmth": 0.7,
    "doorMetaphorVisibility": 0.85
  }
}
```

`intent.md` schema:

```markdown
# Entry page design intent

## Direction chosen
<one of 3 proposals picked verbally>

## Threshold mood
<airlock between cinematic landing and working application; calmer than landing, warmer than dashboard>

## Doors metaphor translation
<literal doors, two architectural surfaces, diverging paths, or two windows>

## Hermes creature treatment
<single creature on page per Designer instruction line 138; cursor-flee same personality as Landing>

## CTA framing
<"Connect GitHub ->" for Import; "Open a blank city ->" for Build>

## Privacy notice integration
<DeepSeek China-based provider data residency disclosure copy, per PRD Section 19.4>

## Cross-page cohesion
<typography family shared with Landing; palette warmer in deliberate contrast>
```

## Storage location

- Bundle extracted to: `_meta/designer/prompt2-entry/handoff-bundle-extracted/`
- Hestia integrates: `frontend/app/start/page.tsx` + `frontend/components/start/*`

## Asumption baked

1. Ghaisan executes Prompt 2 manual on claude.ai/design in SEPARATE roomchat from Prompt 1 (per Designer doc instruction). Same cohesion mandate applies (shared typography family).
2. Badge text is `v0.3 prototype` (Designer doc canonical, supersedes older PRD `v0.1` per Pythia decision log entry 2026-05-12 14:42).
3. CTA "Connect GitHub ->" Wave 1 redirects to stub URL (e.g., `/api/auth/github/start` placeholder) returning mock OAuth state. Wave 3 Hades replaces with real flow (state CSRF + PKCE + scope minimization per PRD Section 19.3).
4. "Build from scratch" Wave 1 redirects to placeholder `/blank` route with in-memory virtual FS stub (no real backend). Wave 3 likely keeps as stretch (PRD AD-15 scope-cut candidate).
5. Privacy notice copy area present, sourced from PRD Section 19.4 disclosure language.
6. Creature reuses `ShyCreature` component pattern from Prompt 1 Landing bundle (or local equivalent), single instance only.

## Validation steps

**Producer responsibility (Ghaisan operator)**:
- Paste Prompt 2 fenced block verbatim into FRESH claude.ai/design roomchat (separate from Prompt 1).
- Mention cohesion to claude.ai/design if it asks: typography family same as Prompt 1, palette warmer.
- 3-direction proposal dialog, pick one verbally.
- Export Code Handoff Bundle to `_meta/designer/prompt2-entry/handoff-bundle-extracted/`.
- Notify V1 Orch: "Prompt 2 bundle landed, Hestia spawn unlocked."

**Consumer responsibility (Hestia)**:
- Validate bundle directory exists before starting.
- Port design tokens to Tailwind config extending Landing's palette (additive, not override).
- Port components to `frontend/components/start/*`.
- Assemble final page at `frontend/app/start/page.tsx`.
- Wire "Connect GitHub ->" CTA to Wave 1 stub redirect URL: `/api/auth/github/start?stub=true` returning HTTP 302 to mock OAuth consent page. Document stub endpoint signature in handoff to Wave 3 Hades (see `hestia-to-hades.md`).
- Include privacy notice copy from PRD Section 19.4.
- Display `v0.3 prototype` badge top-right.
- Smoke test: 2 cards render, OAuth stub redirect chains correctly (Network tab shows 302 to placeholder), accessibility floor (keyboard nav both cards, focus ring visible).

## Edge case handling

- Bundle exports use different prototype badge text: Hestia overrides to `v0.3 prototype` (data canonical per decision log).
- GitHub OAuth stub URL collision with future Hades real implementation: Hestia documents stub at `/api/auth/github/start?stub=true` query param; Wave 3 Hades replaces stub path (no query param) with real handler. See `hestia-to-hades.md` for handoff schema.
- Privacy notice copy missing from bundle: Hestia adds manually from PRD Section 19.4.
- Build from scratch flow lacks Wave 3 real impl: Wave 3 leaves as known limitation, drop-protocol may activate (defer per PRD AD-15).

## Open questions

- Designer may propose creature-less direction (one of 3 proposals): if Ghaisan picks creature-less direction, Hestia honors. Document deviation in `_meta/decisions/` file referenced from contract.
- Cohesion typography family: if Prompt 1 picks self-hosted webfont and Prompt 2 picks Google font, Hestia detects mismatch and ferries V1 Orch for resolution (cohesion is mandatory per Designer doc).

## Reference

- Metis Agentic Structure md Section 2 DAG: External Designer bundle to Hestia edge
- Metis Section 5.2 Hestia ship criteria
- Designer doc `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 2 (lines 95-161)
- PRD Section 19.3 (OAuth scope minimization)
- PRD Section 19.4 (privacy notice DeepSeek data residency)
- PRD Section 26.1 (Designer handoff section)
- Pythia decision log 2026-05-12 14:42 (v0.3 prototype badge reconciliation)
- sourceoftruth Section 11.2 Designer execution instructions
