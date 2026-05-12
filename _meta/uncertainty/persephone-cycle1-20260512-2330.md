# Persephone Uncertainty Journal Cycle 1

**Worker**: Persephone (Wave 2 UI panels architect + OQ-03 implementation)
**Cycle**: 1
**Timestamp**: 2026-05-12 23:30 WIB
**Confidence level**: medium (3 concerns) + low (0 concern, no ferry)

## U1: Hand-author shadcn primitives over CLI init (medium confidence)

**Concern**: D1 picks hand-author `frontend/components/ui/*` over `npx shadcn@latest init`. Risk: hand-author may diverge subtly from canonical shadcn pattern, future maintenance harder.

**Risk severity**: low (hackathon scope, Wave 2 ship-now over long-term maintenance).

**Mitigation already baked**:
- Each hand-authored primitive references canonical shadcn at https://ui.shadcn.com/docs/components/<primitive> in JSDoc header
- API surface (composable parts, prop signatures) matches canonical 1-to-1
- Uses `clsx` + `cn` helper from `frontend/lib/utils.ts` (same as shadcn pattern)
- If Pan post-Wave 3 wants real CLI init, can run `npx shadcn@latest add <component>` on top + diff manually

**Decision authority**: Persephone Wave 2 (D1 + agent prompt scope). Documented here for Eunomia-equivalent Dike audit gate awareness.

**Escalation**: medium concern. Not ferry-worthy. Document + proceed.

## U2 (REVISED): Pythia contract `hera-to-persephone.md` line 62 `storyPoints: number` vs Hera production `storyPoints: StorySize ('XS' | 'S' | 'M' | 'L' | 'XL')`

**Concern**: D3 originally planned a defensive Hera stub. Wave 2 coordination scan post-Cycle-1 entry showed Hera SUDAH shipped `frontend/src/modes/sprint/heraStore.ts` production version. Stub plan ABORTED.

**Schema divergence surfaced**: Hera `BuildingSprintContext.storyPoints` is `StorySize = 'XS' | 'S' | 'M' | 'L' | 'XL'` (T-shirt sizing) while Pythia contract `hera-to-persephone.md` line 62 declared `storyPoints: number | null`. Hera's choice is per agile-orthodox convention; Pythia contract slightly diverged.

**Risk severity**: low.
1. Hera is the producer worker per Pythia contract; the producer authors the type, the contract reflects intent. Hera's actual ship reflects production reality.
2. Persephone consumes Hera's surface verbatim (canonical post-ship). My SizeBadge component renders the StorySize letter directly.
3. Dike Wave 2 audit can review; if contract correction needed, document at Pythia Wave 0 V_n+1 snapshot (or accept Hera's StorySize as canonical).

**Mitigation already baked**:
- Persephone Wave 2 author SizeBadge component to render StorySize letter (`'M'` `'XL'` etc.) not numeric points.
- Decision log D3 documents the schema swap discovery + Persephone consume of Hera surface.
- This uncertainty journal entry surfaces for Dike.

**Decision authority**: Hera Wave 2 (schema producer) + Persephone Wave 2 (consumer). Document for Dike audit gate visibility.

**Escalation**: medium concern (schema divergence from Pythia V0 lock). Not ferry-worthy: schema change is non-breaking (literal union vs number, both nullable, no field rename). Dike audit gate can decide if Pythia contract correction is needed Wave 2 end.

## U3: Tooltip + Dialog shadcn primitives = Wave 2 stub, defer to Pan

**Concern**: Tooltip + Dialog primitives need Radix `@radix-ui/react-tooltip` + `@radix-ui/react-dialog` for full focus management + portal + click-outside-dismiss. Hand-author without Radix may yield a11y degradation (Lighthouse a11y 90+ floor Selene D9 + Eunomia parallel concern).

**Risk severity**: medium (a11y floor risk if Wave 2 Tooltip + Dialog ship without Radix).

**Mitigation already baked**:
- Cycle 2 Tooltip primitive ships as **simple CSS-driven hover/focus** (no portal, no escape handling, no focus trap) labeled `[STUB: Wave 2 minimal; Pan post-Wave 3 add Radix wrapper for a11y]`
- Cycle 3 Dialog primitive ships as **modal overlay div** with `aria-modal="true"` + focus on mount + Escape key close (manual handler) labeled `[STUB: Wave 2 minimal; Pan post-Wave 3 add Radix Dialog for focus trap + portal]`
- Lighthouse a11y target 85+ per Dike Wave 2 audit (degraded from Wave 1 90+) acceptable
- Pan post-Wave 3 may run `npm install @radix-ui/react-tooltip @radix-ui/react-dialog` + swap

**Decision authority**: Persephone Wave 2 (D1 hand-author scope). Documented here for Dike awareness.

**Escalation**: medium concern. Not ferry-worthy. Tooltip + Dialog are not Wave 2 mandatory panel components (they decorate ticket panel + side panel detail). Wave 2 ship without them = OK. Pan polish.

## Closing

3 medium concerns documented; 0 low-confidence concerns; 0 ferry triggers. Persephone Wave 2 proceeds Cycle 1 → 4 per plan. Re-evaluate per cycle checkpoint.
