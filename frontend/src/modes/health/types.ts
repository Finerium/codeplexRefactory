/**
 * Health Mode types.
 *
 * Owner: Asclepius (Wave 2).
 * Contracts:
 *   - `_meta/contracts/asclepius-to-triton.md` (canonical ApolloFinding +
 *      ApolloContext + Severity + FindingCategory schema, Wave 2 producer to
 *      Wave 3 Triton consumer for chat routing)
 *   - `_meta/contracts/nemesis-to-asclepius.md` (feedback FindingEvent shape,
 *      Wave 3 Nemesis publisher to Wave 2 Asclepius consumer)
 *
 * Schema reconciliation note (D1 in `_meta/decision_log/asclepius.md`): the
 * Pythia output contract `asclepius-to-triton.md` lines 33 + 44 uses 5-enum
 * Severity (critical / high / medium / low / info) plus 5-enum kebab-case
 * FindingCategory (hardcoded-secret / outdated-dependency / missing-auth /
 * unsafe-sql / complex-untested). This file is the canonical type surface;
 * the worker prompt `asclepius.md` Section 3 schema block uses a different
 * variant (red/orange/yellow doubles + snake-case categories) that does NOT
 * match the locked Pythia contract. We follow the locked contract because
 * Nemesis Wave 3 publishes per `nemesis-to-asclepius.md` lines 42-49 in the
 * 5-enum kebab-case form, and ApolloFinding flows through to Triton's
 * `/api/chat/apollo` system prompt context per contract line 130-160. PRD
 * Section 11 visually maps the 5-enum to red / orange / yellow tint at
 * critical / high / medium severity; low + info get a neutral blue tint
 * (subtle, decay-style). See `_meta/decision_log/asclepius.md` D1 for the
 * full mapping table.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (Severity color
 * mapping locked at PRD Section 11). Lock 5 ([STUB] hooks labeled at source).
 */

/**
 * Apollo finding severity. 5-enum per Pythia `asclepius-to-triton.md` line 33.
 * Visual mapping at PRD Section 11:
 *   - critical -> red, pulsing intense
 *   - high     -> orange, steady glow
 *   - medium   -> yellow, subtle steady
 *   - low      -> blue, very subtle steady
 *   - info     -> blue, very subtle steady (slightly cooler than low)
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Apollo detector category. 5-enum per Pythia `asclepius-to-triton.md` line 44.
 * Each category maps to one of the 5 deterministic detectors Apollo monitors
 * per PRD Section 10.2 + Section 11. Wave 3 Nemesis publishes via
 * `nemesis-to-asclepius.md` line 44 in this kebab-case enum form.
 */
export type FindingCategory =
  | 'hardcoded-secret'
  | 'outdated-dependency'
  | 'missing-auth'
  | 'unsafe-sql'
  | 'complex-untested';

/**
 * Apollo finding canonical record. Per Pythia `asclepius-to-triton.md` lines
 * 35-59. Wave 3 Nemesis populates fields after detector run; Wave 2 mock
 * hardcodes 5 sample findings (one per category) plus a few extras to drive
 * the smoke route demo. Asclepius store keeps these in a Map keyed by id;
 * Apollo findings panel reads the map; click sets selectedFindingId.
 */
export interface ApolloFinding {
  /** Stable finding identifier. Mock IDs prefixed `mock-finding-`. */
  id: string;
  /** Building affected. Must match a BuildingData.id from Iris mockCityData. */
  buildingId: string;
  /** File path inside repo. */
  filePath: string;
  /** Line range start (1-indexed, matches gitleaks output convention). */
  lineStart: number;
  /** Line range end (inclusive, same as lineStart for single-line findings). */
  lineEnd: number;
  category: FindingCategory;
  severity: Severity;
  /** Short title for findings panel list row. */
  title: string;
  /** Long description with evidence chain. Lazy-loaded for Wave 3; full at mock for Wave 2. */
  description: string;
  /** Suggested remediation copy. Lazy-loaded for Wave 3; full at mock for Wave 2. */
  suggestedFix: string;
  /** First detection timestamp ISO 8601. */
  detectedAt: string;
  /** Status: open, snoozed, ticketed (linked to GitHub issue), resolved. */
  status: 'open' | 'snoozed' | 'ticketed' | 'resolved';
  /** GitHub issue number if ticketed. Wave 3 Demeter populates; null in mock. */
  linkedIssueNumber: number | null;
}

/**
 * Glow window aggregate state per affected building. Computed by the store
 * selector across all findings, so multi-finding buildings get the max
 * severity glow (D2 decision in `_meta/decision_log/asclepius.md`: max over
 * findings, NOT sum, to keep the visual readable at city scale). Triton
 * consumer reads via useApolloQueryContext for chat routing.
 */
export interface GlowWindowState {
  /** Building id receiving glow. */
  buildingId: string;
  /** Max severity over the building's open findings. */
  severity: Severity;
  /** Count of open findings on this building. */
  count: number;
}

/**
 * Apollo filter applied to findings panel list. Persisted in store; users
 * toggle severity + category chips to narrow the list. Default = no filter
 * applied (all severities + categories selected).
 */
export interface ApolloFilter {
  severity: Severity[];
  category: FindingCategory[];
}

/**
 * Aggregated Apollo context exposed to Triton chat routing per
 * `asclepius-to-triton.md` lines 61-73. Wave 3 Persephone chat panel reads
 * via useApolloQueryContext + sends in request payload.
 */
export interface ApolloContext {
  /** Map of building id to current glow severity. */
  glowingBuildings: Record<string, Severity>;
  /** Map of finding id to full finding record. */
  findings: Record<string, ApolloFinding>;
  /** Currently selected finding for evidence panel + chat context. */
  selectedFindingId: string | null;
  /** Filter applied to the findings panel. */
  filter: ApolloFilter;
}

/**
 * Severity rank for max-severity computation. Higher number = more severe.
 * Used by the store selector that derives GlowWindowState from per-building
 * finding aggregation.
 */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/**
 * Severity hex palette per PRD Section 9.5 line 586-588 + Section 11. Read by
 * GlowWindow shader uniform + by FindingsPanel chip badge styling.
 *
 * 5 DISTINCT severity tier (Wave-Fixing #2 Bug #11 fix, STAMP=20260513-0313):
 *   - critical -> red    (#ff4757, pulsing intense)
 *   - high     -> orange (#ff8c42, steady glow)
 *   - medium   -> yellow (#ffd23f, subtle steady)
 *   - low      -> blue   (#5fa8d3, cool calm, distinct from info)
 *   - info     -> gray   (#9ba1a8, neutral grey for informational notices)
 *
 * The info tier was previously a blue-grey (#7aa8c2) which collided
 * visually with low (#5fa8d3) under bloom. Manager Wave-Fixing #2 directive
 * Cluster 7 mandates 5 distinct hues (red/orange/yellow/blue/gray) so a
 * juror can identify severity at a glance.
 *
 * Lock 4 (locked color mapping per PRD): the palette here is canonical. If a
 * worker needs to remap, ferry V1 Orch per Section 4 hard rule.
 */
export const SEVERITY_PALETTE: Record<Severity, string> = {
  critical: '#ff4757', // red, pulsing intense
  high: '#ff8c42', // orange, steady glow
  medium: '#ffd23f', // yellow, subtle steady
  low: '#5fa8d3', // blue, low cool calm
  info: '#9ba1a8', // gray, informational neutral
};

/**
 * Display label per category. Used by findings panel chip labels + evidence
 * panel heading. Designer voice retained (warm + clinical Apollo persona).
 */
export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  'hardcoded-secret': 'Hardcoded secret',
  'outdated-dependency': 'Outdated dependency',
  'missing-auth': 'Missing auth',
  'unsafe-sql': 'Unsafe SQL',
  'complex-untested': 'Complex untested',
};
