# Activity Mode Specification

## Purpose

Activity Mode is product mode 4 of 5. Hero use case: timeline scrubber plus hotspot intensity plus ownership heatmap to surface activity patterns visible to managers. Resident: Clio (Library landmark, vertical book stack).

Source authority: PRD Section 9.4 FR-Mode-4.

## Requirements

### Requirement: Timeline scrubber 30 60 90 day toggle

The system SHALL provide toggle for 30, 60, or 90 day time range and drag-scrub interaction within selected range.

#### Scenario: Range selection

- **WHEN** user selects 30 day range from toggle
- **THEN** building glow updates within 1 second showing activity within last 30 days

#### Scenario: Scrubber drag

- **WHEN** user drags scrubber within selected range
- **THEN** building glow updates in real-time at 60fps as scrubber moves

### Requirement: Hotspot intensity glow encoding

The system SHALL encode commit frequency as glow intensity per building within selected time range using warm gradient.

#### Scenario: Cold zero commits

- **WHEN** building has 0 commits in selected range
- **THEN** building shows no glow

#### Scenario: Warm 1 to 3 commits

- **WHEN** building has 1 to 3 commits
- **THEN** building shows dim warm glow

#### Scenario: Hot 4 to 10 commits

- **WHEN** building has 4 to 10 commits
- **THEN** building shows medium glow

#### Scenario: Hot core 11+ commits

- **WHEN** building has 11 or more commits
- **THEN** building shows bright glow

### Requirement: Ownership heatmap toggle

The system SHALL provide toggle for ownership heatmap layer with 8 to 10 distinct hues for owners and 500ms color transition.

#### Scenario: Heatmap ON

- **WHEN** user toggles ownership heatmap ON
- **THEN** buildings recolor by primary owner per CODEOWNERS lookup or top contributor with 500ms transition

#### Scenario: Heatmap OFF

- **WHEN** user toggles ownership heatmap OFF
- **THEN** buildings revert to default archetype color with 500ms transition

#### Scenario: Shared ownership gradient

- **WHEN** building has multiple owners
- **THEN** gradient color blend renders representing primary plus secondary ownership

### Requirement: Clio narration of patterns

Clio SHALL narrate top 3 hot districts plus top 3 contributors plus notable patterns via DeepSeek V4-Flash non-thinking within 5 seconds.

#### Scenario: Activity question

- **WHEN** user clicks Clio Library and asks "what's been changing recently?"
- **THEN** Clio responds within 5 seconds with top 3 hot districts plus top 3 contributors by commit count plus notable patterns

#### Scenario: Voice register

- **WHEN** Clio narrates
- **THEN** voice is factual elegant Indonesian plus English code-switch

### Requirement: Activity drilldown side panel

The system SHALL show activity drilldown side panel when user clicks any glowing building.

#### Scenario: Drilldown content

- **WHEN** user clicks glowing building
- **THEN** side panel slides in showing commit list within selected time range plus top 3 contributors plus linked PRs plus cycle time for related issues

### Requirement: Wave 2 mock data integration

The system SHALL render with mock commit frequency dataset in Wave 2 and real materialized view query in Wave 3.

#### Scenario: Mock fallback

- **WHEN** Wave 2 frontend runs without real Demeter event store
- **THEN** hardcoded mock commit frequency per file drives glow encoding

#### Scenario: Real query

- **WHEN** Wave 3 backend Demeter materialized views online
- **THEN** real activity_aggregate query drives glow encoding identical visual to mock render

## Worker ownership

- Boreas Wave 2 owns timeline scrubber plus hotspot intensity glow encoding plus ownership heatmap toggle
- Triton Wave 3 owns Clio prompt wiring plus V4-Flash non-thinking client
- Demeter Wave 3 owns event store materialized views cycle_time_aggregate plus lead_time_aggregate plus ownership_distribution

## Cross-references

- PRD Section 9.4 FR-Mode-4 Activity Mode
- `_meta/contracts/boreas-to-demeter.md`
- `_meta/contracts/demeter-to-boreas.md`
- `_meta/contracts/boreas-to-triton.md`
- `.claude/agents/boreas.md`
