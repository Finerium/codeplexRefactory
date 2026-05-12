# Onboarding Mode Specification

## Purpose

Onboarding Mode is product mode 1 of 5. Hero use case: new hire scenario where peta mental codebase kebentuk dalam 30 menit vs 2-week baseline. Resident: Hermes (Tourist Info booth landmark, glass cube beacon).

Source authority: PRD Section 9.1 FR-Mode-1.

## Requirements

### Requirement: Hermes tour script DSL

Hermes SHALL accept 4 tour variant via natural language intent: generic 30-second tour, sprint goal scoped tour, feature scoped tour, and cross-onboarding @username tour.

#### Scenario: Generic 30-second tour

- **WHEN** user clicks Hermes landmark and types "Give me 30-second tour"
- **THEN** camera fly starts within 1 second visiting top-3 districts deterministically

#### Scenario: Sprint goal scoped tour

- **WHEN** user types "Tour for sprint goal X"
- **THEN** Hermes reads sprint goal from current Milestone description and adapts tour route

#### Scenario: Feature scoped tour

- **WHEN** user types "Tour for feature Y"
- **THEN** Hermes follows dependency graph from feature entry point

#### Scenario: Cross-onboarding @username tour

- **WHEN** user types "Tour as @username"
- **THEN** Hermes routes through districts owned or frequented by that user

### Requirement: Camera fly deterministic top-3 district

The system SHALL select top-3 districts deterministically based on ownership concentration and recent activity, producing same picks for same repo state across runs.

#### Scenario: Deterministic district selection

- **WHEN** two tour runs execute on the same repo state
- **THEN** both runs visit the same top-3 districts in the same order

#### Scenario: Wave 2 mock dataset

- **WHEN** Wave 2 frontend tour runs without real backend
- **THEN** hardcoded mock commit frequency per district drives deterministic selection

### Requirement: Building glow during flyover

The system SHALL emit a transient glow on prominent buildings as the camera passes through each district.

#### Scenario: Gold halo flyover

- **WHEN** camera enters a district during tour
- **THEN** top 3 to 5 buildings by LOC plus recent commits emit gold halo glow with 2 to 3 second fade

### Requirement: Hermes narration overlay synchronized to camera position

Hermes SHALL produce text overlay in chat panel synchronized to camera position via DeepSeek V4-Flash non-thinking.

#### Scenario: Real-time narration

- **WHEN** camera enters a new district during tour
- **THEN** Hermes narration text overlay appears in chat panel within 1 second describing the district context

#### Scenario: Bilingual voice

- **WHEN** Hermes narrates
- **THEN** voice is warm welcoming bilingual Indonesian plus English code-switch natural

### Requirement: Ending summary panel

The system SHALL display ending summary panel after 30-second tour ends.

#### Scenario: Summary panel content

- **WHEN** tour completes
- **THEN** side panel slides in showing starting file recommendation plus owner contact plus 3 follow-up tour suggestions

### Requirement: Performance 60fps during fly

The system SHALL maintain 60fps target on M-series MacBook Pro 16GB during camera fly with 200 to 300 building active and post-processing pipeline ON.

#### Scenario: Performance assertion

- **WHEN** Eunomia Wave 1 audit runs H1 performance assertion
- **THEN** 60fps measured during simulated camera fly on M-series MBP 16GB

### Requirement: Tour duration 30 second total

The system SHALL complete tour within 30 second budget across all 3 districts plus ending summary.

#### Scenario: Tour timing budget

- **WHEN** generic 30-second tour runs
- **THEN** total duration is District 1 fly 8 seconds plus District 2 fly 8 seconds plus District 3 fly 8 seconds plus ending summary 6 seconds totaling 30 seconds

### Requirement: prefers-reduced-motion honored

The system SHALL honor prefers-reduced-motion user OS preference.

#### Scenario: Reduced motion mode

- **WHEN** user OS has prefers-reduced-motion ON
- **THEN** camera fly skips animation and jumps to district end positions instantly while Hermes narration still presented

## Worker ownership

- Boreas Wave 2 owns camera fly deterministic top-3 plus Hermes narration overlay plus ending summary panel plus 4 tour variant routing
- Triton Wave 3 owns Hermes prompt wiring plus V4-Flash non-thinking client plus shared header cache
- Demeter Wave 3 owns event-store query for top-3 district calculation plus CODEOWNERS lookup

## Cross-references

- PRD Section 9.1 FR-Mode-1 Onboarding
- `_meta/contracts/boreas-to-triton.md`
- `_meta/contracts/boreas-to-demeter.md`
- `.claude/agents/boreas.md`
