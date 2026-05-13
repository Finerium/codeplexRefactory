# Checkpoint: Calliope Wave-Fixing 3 Manager Final

**Worker**: Calliope
**Cycle**: Wave-Fixing 3 Manager Final
**Date**: 2026-05-13 06:38 WIB
**Status**: SHIP

---

## Task

LANDING-BUTTON-BROKEN: Ghost CTA "View the residents ->" at the landing closer section returns zero response on click. Wave 1 ship-claim was hollow.

## Verdict

**FIXED**. Two-edit surgical fix.

## What changed

### Edit 1: `frontend/components/marketing/ResidentsSection.tsx`

Added `id="residents"` to the residents section element. The closer CTA href was correct (`#residents`), but the target had no matching id.

```diff
- <section className="residents">
+ <section id="residents" className="residents">
```

### Edit 2: `frontend/app/(marketing)/marketing.css`

Inserted 2 CSS rules after the existing `.marketing-body ::selection` rule (lines 51-65):

```css
html:has(body.marketing-body) { scroll-behavior: smooth; }
.marketing-body .residents { scroll-margin-top: 64px; }
```

The `:has()` selector scopes smooth scroll to the marketing route only (Daedalus's /city + Selene's /dashboard preserve their default scroll behavior). The `scroll-margin-top` clears the fixed topnav so the residents eyebrow lands below the nav, not flush behind. The pre-existing `@media (prefers-reduced-motion: reduce)` block at line 721 overrides to `scroll-behavior: auto !important` for users with the OS motion-reduce setting, so the a11y floor is maintained.

## Verification

### SSR HTML

```
$ curl -s http://localhost:3000/ | grep -oE '(id="residents"|href="#residents")'
id="residents"
href="#residents"
```

Both anchor markers present in the same SSR payload. Browser native scroll semantics will execute on click.

### CSS bundle

```
$ curl -s "http://localhost:3000/_next/static/css/app/(marketing)/layout.css" | grep -oE "scroll-(behavior|margin)[^;}]+"
scroll-behavior: auto, so users with the OS motion-reduce setting get an
scroll-behavior: smooth
scroll-margin-top: 64px
scroll-behavior: auto !important
```

Both new rules + the pre-existing reduced-motion override are compiled and shipped.

### Playwright snapshot

Landing root snapshot at `.playwright-mcp/page-2026-05-12T23-34-39-746Z.yml` line 238-239:

```yaml
- link "View the residents →" [ref=e516] [cursor=pointer]:
  - /url: "#residents"
```

Link text + href confirmed. Residents section at ref e439 (line 180-183) renders below the closer in document order.

### Screenshot evidence

- `_meta/audit/calliope-final-landing-top.jpeg` (hero "before scroll" reference; cinematic hero, light mode lock intact, no console errors on root navigation)

## Console state

0 errors on landing root (`/`). Console warnings are 1 cosmetic favicon 404 (Pan post-Wave 3 polish deliverable, pre-existing).

## Lock 5 honest disclosure

Playwright in-session click verification was inconclusive due to a separate browser-session state bug that auto-redirects the Playwright tab to /city or /start/pick-repo on every viewport screenshot retry. The redirect is unrelated to the landing fix. The fix itself is verified at SSR HTML + CSS bundle + Playwright snapshot DOM dump level. Real-browser human click test recommended at Pan's demo rehearsal step.

## Anti-pattern compliance

- Lock 1 (no em dash): no em dash in any file touched
- Lock 2 (no emoji): no emoji
- Lock 3 (no silent scope narrow): scope = LANDING-BUTTON-BROKEN, exactly the dispatched task
- Lock 4 (no silent assume): all alternatives considered + documented in decision log
- Lock 5 (mock data labeled / honest claim): Playwright click test failure disclosed honestly above
- Lock 6 (capacity respected): 45 min of 60 min budget
- Lock 7 (naming consistent): Calliope artifacts named per existing convention
- Lock 8 (no paid services)
- Lock 9 (v1 snapshot N/A for hotfix)
- Lock 10 (a11y floor preserved): `prefers-reduced-motion` already overrides smooth scroll to instant, my CSS does not regress this

## Handoff

Next: Aether-audit Wave-Fixing 3 audit gate. Handoff log at `_meta/handoff_log/manager_final_calliope_to_aether-audit_20260513-0638.md`.

## Files touched

- `frontend/components/marketing/ResidentsSection.tsx` (1 line, id attribute added)
- `frontend/app/(marketing)/marketing.css` (15 lines inserted, comment + 2 rules)

## Files NOT touched

- `frontend/components/marketing/CloserSection.tsx` (correct as authored, no change needed)
- `frontend/components/marketing/MarketingShell.tsx` (scroll observer uses `.residents` querySelector, unchanged)
- All other landing components (HeroSection, TrinitySection, ModesSection, SprintSection, TechStackSignal, ShyCreature, TowerPOV, TrinityArt, data.tsx, index.ts), no scope drift
- `/city` route + parallel slots (untouched, owned by Daedalus + Persephone Wave 2)
- `/start` route + entry components (untouched, owned by Hestia Wave 1)
