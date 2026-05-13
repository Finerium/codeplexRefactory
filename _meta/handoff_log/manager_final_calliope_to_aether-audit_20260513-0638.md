# Handoff: Calliope -> Aether-audit (Manager Final, Wave-Fixing 3)

**From**: Calliope (Wave 1 landing page worker, Wave-Fixing 3 patch role)
**To**: Aether-audit (Wave-Fixing 3 audit gate)
**Date**: 2026-05-13 06:38 WIB
**Bundle**: LANDING-BUTTON-BROKEN fix

---

## Scope handed over

LANDING-BUTTON-BROKEN: the landing closer section ghost CTA "View the residents ->" now resolves the `#residents` fragment identifier to a real DOM target with `id="residents"` and smooth-scrolls into view, with the residents section eyebrow landing 64px below the fixed topnav for visual clarity.

## What Aether-audit should verify

### Functional verification

1. Navigate to `http://localhost:3000/` (the landing page root via `(marketing)` route group).
2. Scroll to the bottom (closer section, "You have seen the skyline. Walk in.").
3. Hover the ghost CTA "View the residents ->" and observe the underline / cursor pointer (pre-existing styling).
4. Click the CTA.
5. Expected: the page smooth-scrolls upward to the residents section ("Five residents. They live in the buildings they are named for."), with the eyebrow "Five residents" rendering ~15px below the fixed topnav. URL hash updates to `#residents`.

### Code-level verification

1. `frontend/components/marketing/ResidentsSection.tsx` line 14: `<section id="residents" className="residents">` (id attribute added).
2. `frontend/app/(marketing)/marketing.css` lines 51-65: `html:has(body.marketing-body) { scroll-behavior: smooth; }` + `.marketing-body .residents { scroll-margin-top: 64px; }` (smooth scroll + topnav clearance).
3. `frontend/components/marketing/CloserSection.tsx` line 27: `<a className="cta cta--ghost" href="#residents">` (untouched, the wiring was always correct, only the target was missing).

### SSR + CSS bundle verification

```bash
# SSR HTML payload contains both anchor markers
curl -s http://localhost:3000/ | grep -oE '(id="residents"|href="#residents")'
# Expected output:
# href="#residents"
# id="residents"

# CSS bundle contains the smooth scroll polish + reduced-motion override
curl -s "http://localhost:3000/_next/static/css/app/(marketing)/layout.css" | grep -oE "scroll-(behavior|margin)[^;}]+"
# Expected output (4 lines):
# scroll-behavior: auto, so users with the OS motion-reduce setting get an  (comment fragment)
# scroll-behavior: smooth
# scroll-margin-top: 64px
# scroll-behavior: auto !important  (reduced-motion override)
```

### A11y verification

Open DevTools, enable "Emulate CSS prefers-reduced-motion: reduce" in Rendering tab. Click the CTA again. Expected: page jumps instantly to the residents section (no smooth animation), per the pre-existing `@media (prefers-reduced-motion: reduce)` block at marketing.css line 721. The fix preserves this a11y floor.

### Regression check

Verify no regression on the rest of the landing:

1. `frontend/components/marketing/MarketingShell.tsx` line 86 still uses `document.querySelector('.residents')` for the scroll-progress detector. The added `id="residents"` co-exists with `className="residents"`, so the selector keeps working.
2. Trinity section, hero section, modes section, sprint section, ShyCreature behavior, and tech stack signal section are all untouched.
3. Light mode lock + Trinity Matrix green code-art + vignette removal + residents grid dividers (Decision 1 of the original Calliope ship) are all preserved.

## Known caveat (Lock 5 honest disclosure)

Playwright in-session click verification was inconclusive due to a browser-session state bug that auto-redirected the Playwright tab to /city or /start/pick-repo on every viewport screenshot retry. The redirect is unrelated to the landing fix. The fix is verified at SSR + CSS bundle + Playwright snapshot DOM dump level. Aether-audit should perform a real-browser human click test (not via the Playwright session that had the redirect issue) to close the loop.

## Screenshots produced

- `_meta/audit/calliope-final-landing-top.jpeg` (cinematic hero baseline, light mode lock, no console errors on root)
- `_meta/audit/calliope-final-button-before-click.png` (race-conditioned, ignore, captured during /city redirect)
- `_meta/audit/calliope-final-after-anchor-click.jpeg` (race-conditioned, ignore, captured during Next.js error overlay on /city smoke)
- `_meta/audit/calliope-final-residents-anchor-target.jpeg` (race-conditioned, ignore, captured during /city redirect)
- `_meta/audit/calliope-final-landing-hero-fresh.jpeg` (race-conditioned, ignore, captured during /start redirect)

The 4 "race-conditioned" screenshots were attempted post-fix Playwright sessions that the session-state bug redirected. They are not evidence of fix failure; the SSR + CSS bundle + DOM snapshot are the canonical verification. Only `calliope-final-landing-top.jpeg` is a useful screenshot.

## Console state

- 0 errors on landing root `/`.
- 1 warning: cosmetic favicon 404, pre-existing, Pan post-Wave 3 polish deliverable.

## Files touched in this fix

1. `frontend/components/marketing/ResidentsSection.tsx` (1-attribute add, line 14)
2. `frontend/app/(marketing)/marketing.css` (15-line insert after line 50)

## Files NOT touched

- All other landing components
- Daedalus / Persephone owned `/city` shell
- Hestia owned `/start` entry pages
- Selene owned `/dashboard`
- Backend code

## Recommendation to Aether-audit

PASS the fix if:

1. `curl -s http://localhost:3000/ | grep -oE 'id="residents"'` returns exactly one match.
2. `curl -s "http://localhost:3000/_next/static/css/app/(marketing)/layout.css" | grep -c "scroll-margin-top: 64px"` returns 1.
3. A real-browser human click test on the closer "View the residents ->" CTA produces a visible smooth scroll to the residents section.
4. Reduced-motion test produces an instant jump instead of smooth scroll.

FAIL the fix only if:

1. The SSR / CSS bundle verification commands above produce different output.
2. Real-browser click does not scroll to the residents section.
3. A new console error has been introduced.

## Sign-off

Calliope hands off LANDING-BUTTON-BROKEN as SHIPPED. Aether-audit owns the final gate verdict.

**Calliope, Wave-Fixing 3 Manager Final**
**2026-05-13 06:38 WIB**
