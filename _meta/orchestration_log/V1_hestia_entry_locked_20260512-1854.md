# V1 snapshot: Hestia Application Entry page locked

**Date**: 2026-05-12 18:54 WIB
**Worker**: Hestia (Wave 1)
**Cycle**: 1 of 1
**Lock authority**: anti-pattern-locks Lock 9 (V_n locked snapshot per major milestone)

## What is locked

Wave 1 Hestia Application Entry page ship at `/start`, plus the OAuth handoff stub at `/api/auth/github/start`. Bundle ported 1-to-1 modulo the Tweaks-panel host (claude.ai/design session ergonomic, not visitor-facing), with two operator-mandated revisions applied:

1. Hermes shy creature removed entry-wide (useHermes hook + HermesBlob SVG + Shyness slider + onSill flag all stripped). The 5 resident persona thumbnails in the footer remain intact as colleague introductions.
2. `TWEAK_DEFAULTS.motion` switched from `"breathing"` to `"animated-city"`, the most animated of three options. MiniCity scene now renders two `animateMotion` walker dots plus all the breathing pulses on the resident landmarks.

## Files locked in this snapshot

- `frontend/app/start/page.tsx`
- `frontend/app/api/auth/github/start/route.ts`
- `frontend/components/entry/entry-keyframes.css`
- `frontend/components/entry/tweak-defaults.ts`
- `frontend/components/entry/scene-helpers.ts`
- `frontend/components/entry/residents-data.ts`
- `frontend/components/entry/EntryApp.tsx`
- `frontend/components/entry/Stage.tsx`
- `frontend/components/entry/WindowCard.tsx`
- `frontend/components/entry/MiniCity.tsx`
- `frontend/components/entry/EmptyLot.tsx`
- `frontend/components/entry/Header.tsx`
- `frontend/components/entry/Hero.tsx`
- `frontend/components/entry/Wordmark.tsx`
- `frontend/components/entry/Badge.tsx`
- `frontend/components/entry/Residents.tsx`
- `frontend/components/entry/ResidentGlyph.tsx`
- `frontend/components/entry/Footer.tsx`
- `frontend/components/entry/PrivacyNotice.tsx`
- `frontend/components/entry/KeyboardHints.tsx`

## Smoke test evidence

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3008/start
200

$ curl -s -o /dev/null -w "status=%{http_code} loc=%{redirect_url}" \
    http://localhost:3008/api/auth/github/start?stub=true
status=302 loc=http://localhost:3008/city?mock_auth=true&stub=true

$ curl -s -o /dev/null -w "status=%{http_code} loc=%{redirect_url}" \
    http://localhost:3008/api/auth/github/start
status=302 loc=http://localhost:3008/city?mock_auth=true

$ curl -s http://localhost:3008/start | grep -oE \
    "(Two doors|Connect GitHub|Open a blank city|v0.3 prototype|Athena|Apollo|Argus|Clio|Hermes|Refactory Hackathon|DeepSeek)" | sort -u
Apollo, Argus, Athena, Clio, Connect GitHub, DeepSeek, Hermes,
Open a blank city, Refactory Hackathon, Two doors, v0.3 prototype

$ curl -s http://localhost:3008/start | grep -iE "(useHermes|HermesBlob|shyness|creature)"
(zero matches)
```

## Cross-references

- Bundle source: `_meta/designer/prompt2-entry/handoff-bundle-extracted/applicationentry-refactory/project/`
- Contracts: `_meta/contracts/claude-design-bundle-to-hestia.md`, `_meta/contracts/hestia-to-hades.md`
- 4 mandatory artifacts: `_meta/decision_log/hestia.md`, `_meta/uncertainty/hestia-cycle1-20260512-1854.md`, `_meta/checkpoints/hestia-cycle1.md`, `_meta/handoff_log/wave1_hestia_to_hades.md`
- Sibling Wave 1 snapshot: `_meta/orchestration_log/V1_daedalus_canvas_20260512-1850.md`

## Lock condition

Per anti-pattern Lock 9, continuous edit on locked files is illegal post-snapshot. If revisions are needed, author `V2_hestia_entry_locked_*.md` and document the new lock. Wave 3 Hades replacement of the OAuth route handler does NOT violate this lock because the contract `hestia-to-hades.md` pre-authorized the swap as part of the Wave 1 to Wave 3 cycle.
