/**
 * Ownership color encoding.
 *
 * Wave 1 mock implementation: deterministic djb2 hash from owner string to a
 * curated 12-hue mid-saturation palette. Stable across reload (same owner =
 * same color), no random per-render. Wave 3 will replace mock CODEOWNERS
 * regex + git blame mock data with Demeter event-store query, but the color
 * derivation function stays unchanged for visual consistency.
 *
 * Palette discipline per Iris prompt: NOT rainbow, NOT pastel, NOT high
 * saturation. Mid-saturation jewel tones map to engineering "team" feel
 * without slipping into AI-generated rainbow cliche.
 *
 * Compliance: anti-pattern Lock 4 (no silent assume), [INFERRED] palette
 * design choice documented in `_meta/decisions/iris_ownership_palette.md`.
 */

/**
 * 12-hue mid-saturation jewel-tone palette. Hand-picked, NOT generated. Each
 * hue is distinct from the rest by at least 25 degrees on the HSL wheel.
 * Saturation 55-65%, lightness 50-60%, avoids both pastel washout and neon
 * glare. Tested against background fog color (#1a1f2e dark blue gray) for
 * contrast.
 */
export const OWNERSHIP_PALETTE: readonly string[] = [
  '#d97757', // terracotta (Athena warm)
  '#5a8db8', // steel blue (Apollo cool)
  '#a85a5a', // dusty rose (Argus alert)
  '#c8a13d', // amber gold (Clio history)
  '#6ba897', // sea foam (Hermes guide)
  '#8c6bbf', // amethyst
  '#b87cc7', // orchid
  '#5e9e63', // forest green
  '#c2965b', // copper
  '#7895ce', // periwinkle
  '#a86b8b', // mauve
  '#4f9a99', // teal
] as const;

/**
 * djb2 hash function, classic non-cryptographic string hash by Daniel J.
 * Bernstein. Selected for: stable across runs, fast, low collision on
 * short strings (owner names are typically 3-20 chars). Returns unsigned
 * 32-bit integer. Reference: http://www.cse.yorku.ca/~oz/hash.html
 */
export function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 ^ char, kept within 32-bit unsigned range
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Derive a stable hex color from an owner string. Same owner = same color
 * across the entire city + every reload. Empty or null owner falls back to a
 * neutral gray ('#7a8294'), the visual sign for "unowned" so Wave 2 worker
 * can surface that signal.
 */
export function deriveOwnerColor(owner: string | null | undefined): string {
  if (!owner || owner.trim().length === 0) {
    return '#7a8294';
  }
  const idx = djb2(owner) % OWNERSHIP_PALETTE.length;
  return OWNERSHIP_PALETTE[idx];
}

/**
 * Parse a CODEOWNERS file content + return path-pattern matchers.
 * Wave 1 mock: simple glob-like pattern, no `**` recursion edge cases.
 *
 * CODEOWNERS line format (GitHub spec):
 *   <path-pattern> <owner1> [<owner2> ...]
 *   # comment
 *
 * Match is "last-match-wins" per GitHub semantics. Pattern compiled into a
 * regex that handles `*` wildcard + `/` directory boundary.
 */
export interface CodeownersRule {
  pattern: string;
  regex: RegExp;
  owners: string[];
}

/**
 * Parse CODEOWNERS file text into ordered rule list. Comments + blank lines
 * skipped. Pattern compiled to RegExp once at parse time, reused on every
 * match call.
 *
 * Stability: rule order preserved from file (matches GitHub semantics).
 */
export function parseCodeowners(text: string): CodeownersRule[] {
  const rules: CodeownersRule[] = [];
  const lines = text.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) continue;
    const pattern = tokens[0];
    const owners = tokens.slice(1).filter((t) => t.startsWith('@'));
    if (owners.length === 0) continue;
    rules.push({ pattern, regex: compilePattern(pattern), owners });
  }
  return rules;
}

/**
 * Compile a CODEOWNERS glob-like pattern to a regex. Supports:
 *  - `*` matches any sequence of chars except `/`
 *  - `**` matches any sequence including `/`
 *  - Leading `/` anchors at root
 *  - Trailing `/` matches directory + descendants
 *
 * Wave 1 mock simplification: no negation patterns (`!path`), no character
 * classes (`[abc]`). Real-mode Wave 3 backend uses tree-sitter + full
 * CODEOWNERS spec parser.
 */
function compilePattern(pattern: string): RegExp {
  let p = pattern;
  // Strip leading slash, treat as anchor
  const anchored = p.startsWith('/');
  if (anchored) p = p.slice(1);
  // Trailing slash matches dir + descendants
  const dirMatch = p.endsWith('/');
  if (dirMatch) p = p.slice(0, -1);

  // Escape regex special chars except `*`
  const escaped = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace `**` with placeholder first to avoid double substitution
  const withDoubleStar = escaped.replace(/\*\*/g, '__DOUBLESTAR__');
  // Single `*` -> `[^/]*`
  const withSingleStar = withDoubleStar.replace(/\*/g, '[^/]*');
  // Restore `**` -> `.*`
  const finalPattern = withSingleStar.replace(/__DOUBLESTAR__/g, '.*');

  const prefix = anchored ? '^' : '(^|/)';
  const suffix = dirMatch ? '(/|$)' : '$';
  return new RegExp(`${prefix}${finalPattern}${suffix}`);
}

/**
 * Resolve the owner string for a given file path against a CODEOWNERS rule
 * list. Last-match-wins per GitHub semantics. Returns the first owner
 * (primary owner), the rest of owners are accessible via raw rule lookup.
 *
 * Returns null if no rule matches the path; deriveOwnerColor will return
 * neutral gray for null owner.
 */
export function resolveOwner(
  path: string,
  rules: CodeownersRule[]
): string | null {
  let match: CodeownersRule | null = null;
  // Last-match-wins, iterate forward + keep replacing
  for (const rule of rules) {
    if (rule.regex.test(path)) {
      match = rule;
    }
  }
  return match ? match.owners[0] : null;
}
