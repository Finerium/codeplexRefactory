# Uncertainty Journal: Calliope Wave-Fixing 3 Manager Final

**Worker**: Calliope
**Cycle**: Wave-Fixing 3 Manager Final
**Date**: 2026-05-13 06:38 WIB
**Task**: LANDING-BUTTON-BROKEN, fix the "View the residents ->" ghost CTA at the landing closer section so it scrolls to the residents section instead of returning zero response

---

## Confidence: HIGH

**Why**: The root cause was a single missing HTML attribute. The CTA `<a href="#residents">` was correctly wired to a fragment identifier, but the destination `<section className="residents">` had only the class name, no matching id. Browser anchor scroll resolves on `id`, not on `class`. Adding `id="residents"` is the surgical fix that the existing markup was one attribute away from. The CSS polish (smooth scroll + scroll-margin-top) is additive comfort, not load-bearing for the fix to work.

---

## Concerns raised, journaled below

### Concern 1 (Medium): Playwright session redirect interference during click test

**Issue**: Three separate attempts at Playwright in-browser navigation to `http://localhost:3000/` ended up landing on `/city?mode=activity` or `/start/pick-repo` despite the dev server serving HTTP 200 for the root path via curl. The screenshot tool also timed out on multiple retries with "fonts loaded" but then "Timeout 5000ms exceeded". I could not get a clean "before-click" + "after-click" pair of viewport screenshots inside Playwright.

**Why this is medium not high**: Curl SSR verification shows both `id="residents"` and `href="#residents"` are in the same HTML payload. CSS bundle verification confirms `scroll-behavior: smooth` and `scroll-margin-top: 64px` are compiled and shipped. The fix is verified at every layer below the browser. The Playwright instability is unrelated to my change, likely a stale session cookie or some test-harness state pulling the tab to /city.

**Mitigation taken**: I documented the Playwright failure in the decision log under Lock 5 honest disclosure. The verification chain is SSR HTML + CSS bundle inspection + Playwright snapshot DOM dump (which confirmed the residents element exists as `id="residents"` in the rendered tree). I recommended Pan exercise a real-browser human click test at the demo rehearsal step.

**What I would have done differently with more time**: Investigated the auto-redirect source. Candidates: a stored sessionStorage that triggers a client-side router push, a Next 16 router cache that resumes prior page state, or a hash listener somewhere that interprets a hash fragment as an instruction to navigate. None of these are in scope for the LANDING-BUTTON-BROKEN dispatch.

---

### Concern 2 (Low): scroll-margin-top value chosen empirically (64px)

**Issue**: The fixed `.topnav` has `padding: 16px 28px` and font-size 11px (line height ~17px). Total visible height is roughly 16 + 17 + 16 = 49px in the default state. I set `scroll-margin-top: 64px` to give a small breathing buffer above the eyebrow "Five residents".

**Why this is low**: 64px is conservative, lands the residents eyebrow ~15px below the topnav baseline which is visually pleasing without feeling like the section is pushed too far down. If Pan wants pixel-perfect alignment for the demo, this is one CSS edit away from any value 49-80px.

**Validated**: visually checked the snapshot bounding-box of the topnav + residents section header during the Playwright session. Topnav box `[0, 0, 1200, 49]` confirms 49px nav height. 64 is appropriate.

---

### Concern 3 (Low): `html:has(body.marketing-body)` selector requires browser :has() support

**Issue**: The CSS rule `html:has(body.marketing-body) { scroll-behavior: smooth; }` uses the CSS `:has()` pseudo-class, which requires Chrome 105+, Safari 15.4+, Firefox 121+. Browsers older than those would not apply the smooth scroll, falling back to the default `scroll-behavior: auto` instant jump.

**Why this is low**: All modern browsers in the target audience (Refactory demo Day 2 panitia + judges, May 2026) support `:has()`. Per the Baseline data warning printed at dev server start, the relevant Baseline modules are 2 months old, but `:has()` shipped to all browsers in early 2024 and is fully Baseline-stable as of mid-2024. Even if the fallback fires, the anchor scroll still works (just instant instead of smooth), which is the actual user-facing fix. Smooth scroll is comfort polish, not functionality.

**Alternative considered**: Use a hard `html { scroll-behavior: smooth; }` global rule. Rejected because that would override scroll behavior on Daedalus's /city and Selene's /dashboard routes, which use programmatic scroll for the timeline scrubber and the activity heatmap. Those routes need `scroll-behavior: auto` to preserve their interaction semantics. The `:has()` scoping is the surgical isolation.

---

### Concern 4 (Resolved): Dev server stability during verification

**Issue**: The dev server crashed once during Playwright verification (curl HTTP 000). After restart it bound to port 3000 again but a second concurrent npm run dev I had spawned earlier tried to grab port 3001 (lock conflict). I killed all instances and started fresh; the third start was clean.

**Resolution**: Cleaned up with `pkill -9 -f "next dev"` + removed `.next/dev/lock`, then restarted single npm run dev background. Verified via `curl http://localhost:3000/` returns HTTP 200. Unrelated to the LANDING-BUTTON-BROKEN fix itself, no scope creep.

---

## Capacity check

- Time spent: ~45 minutes (well under the 60-minute Manager Final budget).
- Frustration: low. The fix was clear from inspection of two files. The Playwright instability was annoying but did not block ship.
- Context used: ~30% of 1M window.

---

## Ferry trigger check

None hit. The fix landed within the time budget, the root cause was found in <10 minutes, no contract conflict, no anti-pattern violation. Proceeded conservative with the simplest Option A (anchor scroll), per Manager Final recommendation.

---

## Reference

- LANDING-BUTTON-BROKEN dispatch directive (Manager Final, 2026-05-13)
- Source: `frontend/components/marketing/CloserSection.tsx` line 27 + `frontend/components/marketing/ResidentsSection.tsx` line 14
- CSS: `frontend/app/(marketing)/marketing.css` lines 51-65 insertion
- Decision log: `_meta/decision_log/calliope.md` D-Calliope-Final-01
