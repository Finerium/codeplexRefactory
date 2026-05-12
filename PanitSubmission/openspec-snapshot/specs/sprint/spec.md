# Sprint Mode Specification (HERO)

## Purpose

Sprint Mode is product mode 2 of 5 and the HERO differentiator. Hero use case: agile workflow plus ticket overlay plus spatial PM workspace plus dual audience. Resident: Athena (City Hall landmark, Greek temple).

Source authority: PRD Section 9.2 FR-Mode-2.

## Requirements

### Requirement: 14 PM concept visual mapping overlay

The system SHALL provide toggle-able overlay layer mapping 14 agile concepts to 3D city visuals filterable by status.

#### Scenario: Overlay toggle

- **WHEN** user toggles "Sprint Mode" in top navigation
- **THEN** 14 PM concept overlay appears within 1 second

#### Scenario: Filter by status

- **WHEN** user filters by status In Progress
- **THEN** only buildings with In Progress story render visible overlay

#### Scenario: Concept mappings

- **WHEN** overlay ON for a building with active story
- **THEN** scaffolding wraps the building
- **WHEN** overlay ON for a building with open PR
- **THEN** crane animation operates on the building
- **WHEN** overlay ON for backlog story
- **THEN** blueprint pin floats above empty slot or district
- **WHEN** overlay ON for done story this sprint
- **THEN** building has transient 24-hour green halo glow
- **WHEN** overlay ON for blocked story
- **THEN** yellow tape plus warning icon visible on building
- **WHEN** overlay ON for open bug issue
- **THEN** smoke or crack visual appears on building
- **WHEN** overlay ON for story points size
- **THEN** size badge S, M, L, or XL visible on scaffolding
- **WHEN** overlay ON for active sprint
- **THEN** sprint goal banner visible on Athena City Hall
- **WHEN** overlay ON for epic
- **THEN** district border highlighted with epic flag at center
- **WHEN** overlay ON for Definition of Done
- **THEN** checklist floats above building under construction
- **WHEN** overlay ON for PR under review
- **THEN** inspector NPC orbits building until approved
- **WHEN** overlay ON for dependency or blocker
- **THEN** red glowing bridge connects dependent buildings
- **WHEN** overlay ON for Athena refactor proposal
- **THEN** ghost building transparent with animated dashed outline appears
- **WHEN** overlay ON for spec drift
- **THEN** retak crack pattern visual A-E appears on building

### Requirement: PR comment surfacing visual

The system SHALL surface PR review comments as visual annotation on buildings non-overlapping with scaffolding, crane, or banner.

#### Scenario: Comment annotation

- **WHEN** PR has unresolved comment
- **THEN** visual indicator (sticky note 3D OR floating bubble OR marker pin plus badge per OQ-05 decided hari-H) appears on building with badge showing unread comment count

#### Scenario: Non-overlap z-fighting check

- **WHEN** building has scaffolding plus crane plus banner plus sticky note
- **THEN** all elements render without z-fighting and Dike Wave 2 audit verifies non-overlap

### Requirement: Click building to ticket panel

The system SHALL slide ticket panel in showing linked artifacts when user clicks building with active overlay.

#### Scenario: Active story click

- **WHEN** user clicks building with scaffolding
- **THEN** ticket panel slides in showing linked issue plus assignee plus status plus size badge plus linked PR

#### Scenario: Open PR click

- **WHEN** user clicks building with crane
- **THEN** ticket panel shows PR plus reviewer plus last activity

#### Scenario: Blocked story click

- **WHEN** user clicks building with yellow tape
- **THEN** ticket panel shows block reason plus dependency reference

### Requirement: PR to Building auto-sync webhook visual state machine

The system SHALL transition building visual state machine in real-time based on GitHub webhook events.

#### Scenario: PR opened

- **WHEN** GitHub webhook PR opened event fires
- **THEN** crane appears at corresponding building within 2 seconds

#### Scenario: PR review_requested

- **WHEN** webhook fires
- **THEN** inspector NPC starts orbiting building

#### Scenario: PR approved

- **WHEN** webhook fires
- **THEN** green halo transient 30 minute appears on building

#### Scenario: PR merged

- **WHEN** webhook fires
- **THEN** crane removes and scaffolding cleared from building

#### Scenario: PR closed without merge

- **WHEN** webhook fires
- **THEN** crane drops and cleanup occurs leaving building untouched

### Requirement: Sprint goal banner on City Hall

The system SHALL display current sprint goal as 3D banner on Athena City Hall building visible from city center camera position.

#### Scenario: Banner content

- **WHEN** Milestone has description text
- **THEN** banner displays sprint goal text from Milestone description

#### Scenario: Real-time update

- **WHEN** Milestone description updates
- **THEN** banner refreshes within 5 seconds via WebSocket push

### Requirement: Performance Lighthouse 85 plus with 5 modes active

The system SHALL maintain Lighthouse Performance score 85+ when 5 product modes active including Sprint Mode overlay ON.

#### Scenario: Performance assertion

- **WHEN** Dike Wave 2 audit runs Lighthouse on dashboard plus city view with all 5 mode overlays ON
- **THEN** Performance score is 85 or higher

## Worker ownership

- Hera Wave 2 owns 14 PM concept overlay plus PR comment surfacing decide OQ-05 plus click-to-ticket-panel plus PR-to-Building auto-sync state machine
- Persephone Wave 2 owns ticket panel slot integration
- Hades Wave 3 owns GitHub webhook receiver plus WebSocket push
- Demeter Wave 3 owns ticket state aggregation plus materialized view

## Cross-references

- PRD Section 9.2 FR-Mode-2 Sprint Mode HERO
- `_meta/contracts/iris-to-hera.md`
- `_meta/contracts/hera-to-persephone.md`
- `_meta/contracts/hera-to-hades.md`
- `.claude/agents/hera.md`
