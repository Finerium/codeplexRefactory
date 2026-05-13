# Calliope TRULY FINAL Cluster 5 checkpoint

**Timestamp**: 2026-05-13 10:36 WIB
**Trigger**: Manager FINAL Cycle 4 cluster 5, Ghaisan 10:23 WIB directive
**Mandate**: Add prominent "Take the tour" CTA on Landing page, NOT corner "?" only

## Problem statement

FloatingTutorButton already globally mounted (frontend/app/layout.tsx line 31). Bottom-right "?" works but discoverability low. Ghaisan wants a Landing-page-visible CTA that re-triggers tutor on demand, both first visit and returning users, NOT just localStorage-gated 1x.

## Decision

Option A picked per Manager FINAL recommendation: leverage existing `/city?tour=1` URL-param force flow via `FloatingTutorButton.shouldForceTour()` → `resetTourState()` → modal opens at 250ms.

Placement chosen: **Hero secondary CTA** under primary "Open the city" CTA. Reasoning:
1. Hero is the first-impression frame, highest visibility on Landing.
2. `.cta--ghost` modifier already exists in marketing.css (transparent + ink border), aesthetic-matched to Calliope cinematic-restraint voice. Zero new visual tokens needed.
3. `.right` column already flex-column with `align-items: flex-start`, so stacking two CTAs with a small inner `.cta-group` wrapper at gap 10px keeps tight pairing without disturbing the 18px gap to the meta-block below.

Rejected alternatives:
- Footer: too low, defeats the "prominent" requirement.
- Top-right header link: hero-top already crowded with RUNTIME / COORDINATES / LOCAL TIME meta. Adding a CTA there fights the cinematic dashboard look.
- Inline TutorModal import + local state: more code, more risk, duplicates the FloatingTutorButton ownership of modal state. Locks 3 + 4 violation potential.

## Files touched

1. `/Users/ghaisan/Documents/codeplexRefactory/frontend/components/marketing/HeroSection.tsx`
   - Wrapped existing `<a className="cta">` in new `<div className="cta-group">`.
   - Added second `<a className="cta cta--ghost" href="/city?tour=1">` with copy "Take the tour" + arrow glyph matching primary CTA pattern.
   - Title attribute "Take the guided tour, Hermes narrates the city" for accessibility hover + screen reader hint.

2. `/Users/ghaisan/Documents/codeplexRefactory/frontend/app/(marketing)/marketing.css`
   - Added single rule `.marketing-body .hero-copy .right .cta-group` scoped under existing hero-copy chain.
   - Flex-column align flex-start gap 10px. Keeps primary + secondary CTA tight without inheriting the 18px outer gap.

## Verification chain

Source code wiring (verified via Read):
1. User clicks "Take the tour" on Landing hero.
2. Browser navigates to `/city?tour=1`.
3. `frontend/app/city/layout.tsx` mounts FloatingTutorButton (global via app/layout.tsx).
4. `FloatingTutorButton.useEffect` line 55-70: `shouldAutoOpenTour()` returns true because `?tour=1` URL param is present.
5. `shouldForceTour()` returns true → `resetTourState()` clears localStorage flag.
6. 250ms `setTimeout` → `setOpen(true)` → TutorModal renders.

Live deploy smoke (HTTP 200 on `https://duopoly.hackathon.sev-2.com/city?tour=1`): existing chain already operational, my change only adds the entry point to Landing.

## Compliance

- No em dash, no emoji in touched files.
- No scope expansion: only the secondary CTA added; primary CTA + meta-block untouched.
- No image rebuild: source code only, Atlas owns batch redeploy per Manager FINAL directive.
- Calliope intent.md voice preserved: ghost CTA modifier already aesthetic-matched (transparent + ink border, no glow, no shouting), cinematic-restraint compatible.
- Locks 1, 2, 3, 4 honored: no anti-pattern, no silent rewrite, design tokens unchanged.

## Diff summary

```diff
# HeroSection.tsx
           <div className="right">
-            <a className="cta" href="/start" title="Open the city, threshold entry page">
-              Open the city <span className="arrow">{'→'}</span>
-            </a>
+            <div className="cta-group">
+              <a className="cta" href="/start" title="Open the city, threshold entry page">
+                Open the city <span className="arrow">{'→'}</span>
+              </a>
+              <a
+                className="cta cta--ghost"
+                href="/city?tour=1"
+                title="Take the guided tour, Hermes narrates the city"
+              >
+                Take the tour <span className="arrow">{'→'}</span>
+              </a>
+            </div>
             <div className="meta-block">

# marketing.css
 .marketing-body .hero-copy .right { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; }
+.marketing-body .hero-copy .right .cta-group { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
```

## Handoff to Manager FINAL

Source code change complete. Atlas redeploy batches this with other Cluster fixes. Real-browser visual verification deferred to post-redeploy Ghaisan manual QA OR Manager FINAL audit pass.
