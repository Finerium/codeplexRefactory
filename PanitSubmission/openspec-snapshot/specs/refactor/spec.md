# Refactor Mode Specification (SAFETY-FIRST)

## Purpose

Refactor Mode is product mode 3 of 5 with SAFETY-FIRST positioning. Hero use case: AI proposal author plus drafts/ simulation isolation plus dual review gate plus pitch defensibility. Resident: Athena (City Hall landmark, Greek temple).

Source authority: PRD Section 9.3 FR-Mode-3 + AD-08 + AD-19.

## Requirements

### Requirement: User intent to proposal author flow

Athena SHALL draft 3-part proposal from user natural-language refactor intent via DeepSeek V4-Pro thinking high.

#### Scenario: Intent to proposal

- **WHEN** user types "implement 2FA in auth district" in chat panel
- **THEN** Hades parser service analyzes affected files via tree-sitter AST within 5 seconds
- **AND** Athena V4-Pro thinking high drafts proposal.md plus design.md plus tasks.md within 30 seconds
- **AND** output is written to openspec/changes/<change-name>/ Folder A primary

### Requirement: Ghost building visualization

The system SHALL render affected and new files as ghost buildings with transparent body and animated dashed outline at proposed locations.

#### Scenario: Existing file modification

- **WHEN** proposal modifies existing file
- **THEN** ghost overlay renders on top of solid building at 50 percent opacity

#### Scenario: New file creation

- **WHEN** proposal creates new file
- **THEN** ghost building only renders no solid behind

#### Scenario: Animated outline

- **WHEN** ghost building visible
- **THEN** animated dashed outline pulses 2 to 3 second cycle

### Requirement: Refactor simulation engine multi-turn

The Pandora simulation engine SHALL execute 3-turn multi-turn coordination producing drafts output via DeepSeek V4-Pro and V4-Flash routing.

#### Scenario: Three turn flow

- **WHEN** user clicks "Run Simulation"
- **THEN** Turn 1 test_gen V4-Pro thinking high generates failing tests within 60 seconds
- **AND** Turn 2 impl_gen V4-Pro thinking high generates implementation code to make tests pass within 60 seconds
- **AND** Turn 3 diff_serialize V4-Flash non-thinking serializes unified diff format within 20 seconds

#### Scenario: Reasoning content multi-turn anti-pattern

- **WHEN** multi-turn calls execute
- **THEN** reasoning_content from prior turns is NEVER replayed to DeepSeek API (passes only content field)

### Requirement: drafts/ isolation safety property AD-19 LOCKED

The system SHALL write all simulation output to drafts/<simulation-id>/ ONLY and NEVER modify production code via simulation engine.

#### Scenario: drafts only

- **WHEN** simulation engine writes any file
- **THEN** target path is within drafts/<simulation-id>/ subtree

#### Scenario: Production untouched

- **WHEN** simulation completes
- **THEN** static check verifies no file modification outside drafts/<simulation-id>/

#### Scenario: drafts regenerable

- **WHEN** new simulation runs with new simulation-id
- **THEN** drafts/<new-simulation-id>/ created fresh and existing drafts kept until Accept or Discard

### Requirement: Dual review gate UI

The system SHALL present 3-section side panel plus 2-action review gate before user accepts or discards simulation result.

#### Scenario: Side panel render

- **WHEN** simulation completes
- **THEN** side panel slides in showing proposal review section plus simulation result section plus evidence chain section

#### Scenario: Accept action

- **WHEN** user clicks Accept
- **THEN** openspec archive <change-name> runs
- **AND** real diff created via PR draft or local patch
- **AND** ghost buildings transition to solid via 2 to 3 second ghost-to-solid animation

#### Scenario: Discard action

- **WHEN** user clicks Discard
- **THEN** drafts/<simulation-id>/ deleted
- **AND** ghost building visual reverts

### Requirement: GitHub Issue fallback

The system SHALL fall back to GitHub Issue creation when target repo lacks openspec/ folder.

#### Scenario: Fallback trigger

- **WHEN** target repo filesystem check finds no openspec/ folder
- **THEN** Pandora creates GitHub Issue with proposal plus design plus tasks markdown sections
- **AND** suggested label `refactor-proposal` applied
- **AND** user can convert to PR manually post-issue creation

### Requirement: Multi-turn cost budget per simulation

Each Refactor simulation SHALL cost less than $0.50 total combined V4-Pro and V4-Flash.

#### Scenario: Cost tracking

- **WHEN** simulation completes
- **THEN** llm_call_log table aggregate for simulation-id sums cost_estimate_usd less than 0.50

### Requirement: Ghost-to-solid animation 60fps

The system SHALL maintain 60fps during ghost-to-solid animation transition over 2 to 3 second GSAP timeline.

#### Scenario: Animation smoothness

- **WHEN** user clicks Accept
- **THEN** ghost-to-solid animation runs at 60fps with no frame drops

## Worker ownership

- Asclepius Wave 2 owns ghost building visual plus animated dashed outline plus ghost-to-solid animation plus dual review gate UI buttons
- Pandora Wave 3 owns Athena proposal author plus simulation engine multi-turn plus drafts/ isolation plus dual review gate backend
- Triton Wave 3 owns per-resident routing Athena V4-Pro thinking high plus thinking-mode toggle plus defensive layer
- Demeter Wave 3 owns OpenSpec runtime integration plus change folder archive on Accept
- Hades Wave 3 owns parser service for affected files plus dependency graph

## Cross-references

- PRD Section 9.3 FR-Mode-3 Refactor Mode
- PRD Section 12.2 Layer 2 Refactor Mode Simulation Execution
- PRD AD-08 plus AD-19 drafts/ isolation safety property LOCKED
- `_meta/contracts/asclepius-to-pandora.md`
- `_meta/contracts/pandora-to-asclepius.md`
- `_meta/contracts/pandora-to-demeter.md`
- `.claude/agents/pandora.md`
