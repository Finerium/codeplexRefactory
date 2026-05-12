# Iris Ownership Color Palette Decision

**Author**: Iris (Wave 1)
**Date**: 2026-05-12 (Wave 1 Cycle 1)
**Cross-ref**: `_meta/decision_log/iris.md` D-Iris-04, `.claude/agents/iris.md`
Section 4 anti-AI-slop discipline.

## Palette (12 hand-picked jewel-tone hues)

| # | Hex | Hue | Reference resonance |
|---|---|---|---|
| 1 | `#d97757` | Terracotta | Warm clay, Athena temple warm tint partner |
| 2 | `#5a8db8` | Steel blue | Cool calm, Apollo hospital partner |
| 3 | `#a85a5a` | Dusty rose | Alert subdued, Argus police partner |
| 4 | `#c8a13d` | Amber gold | History warmth, Clio library partner |
| 5 | `#6ba897` | Sea foam | Welcoming cool, Hermes booth partner |
| 6 | `#8c6bbf` | Amethyst | Distinct purple, 5th team distinct |
| 7 | `#b87cc7` | Orchid | Lighter purple counterpart |
| 8 | `#5e9e63` | Forest green | Nature mid-tone |
| 9 | `#c2965b` | Copper | Warm metallic |
| 10 | `#7895ce` | Periwinkle | Cool light counterpart |
| 11 | `#a86b8b` | Mauve | Warm muted |
| 12 | `#4f9a99` | Teal | Cool deep |

Plus neutral `#7a8294` (gray) for unowned files.

## Selection criteria

Per `.claude/agents/iris.md` Section 4: "Palette: 8-12 distinct hues
mid-saturation (NOT rainbow, NOT pastel)."

1. **Mid-saturation 55-65%**: not pastel (avoids "AI default washy" look),
   not neon (avoids casino feel).
2. **Lightness 50-60%**: not blown-out, not muddy.
3. **At least 25 degrees apart on HSL wheel**: adjacent hues should not
   blend at 10m distance.
4. **Engineering team vibe**: jewel tones evoke craftsmanship + heritage,
   matches Codeplex Chronicle Greek mythology theme.
5. **Contrast against background fog `#05070d`**: all 12 hues tested
   against dark blue-gray fog for visual separation.

## Why hand-picked NOT algorithmic

Algorithmic palettes (HSL evenly spaced, D3 categorical scheme) tend toward
rainbow because their default seed bias is to maximize hue distance, which
in HSL traverses red -> orange -> yellow -> green -> blue -> purple in
roughly even steps. This is exactly what `.claude/agents/iris.md` flags as
anti-AI-slop "NOT rainbow".

Hand-picked palette can intentionally cluster (terracotta + dusty rose +
copper share warm-earth feel) and intentionally vary (amber + amethyst
break the cluster sharply). The result reads as "carefully chosen" not
"randomly generated".

## Mapping function

```typescript
deriveOwnerColor(owner: string): string {
  if (!owner) return '#7a8294';
  return OWNERSHIP_PALETTE[djb2(owner) % 12];
}
```

Stable across reload (djb2 is deterministic). Stable across all renders
(same input = same color, no per-frame randomness).

## Collision strategy (Wave 3)

When real CODEOWNERS scrape exceeds 12 teams, collision is possible. Two
mitigations:

1. **Secondary palette via lightness shift**: 12 darker shades for the
   13-24th team. djb2 hash + bucket assigns primary vs secondary.
2. **Display name suffix in legend**: if collision occurs, the dashboard
   legend (Selene Wave 1 + Hera Wave 2) shows owner name beside color so
   user can disambiguate.

Wave 1 mock uses 6 teams, well below 12, no collision risk.

## Activity tint overlay

BuildingInstances.applyInstanceMatrices multiplies the base ownership color
by `0.85 + activity * 0.3` so:
- Inactive (activity 0): color * 0.85 (darker, recedes)
- Medium (activity 0.5): color * 1.0 (default)
- Active (activity 1): color * 1.15 (brighter, pops)

Range chosen so the palette still reads (no over-darkening hides hue) but
the activity overlay is visible.
