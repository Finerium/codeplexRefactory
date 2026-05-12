# Health Mode Specification

## Purpose

Health Mode is product mode 5 of 5. Hero use case: 5 deterministic detector findings plus Argus CVSS scoring plus Clio spec-drift narration plus 1-click GitHub issue creation Hybrid Layer 1. Residents: Apollo (Hospital landmark, cross shape), Argus (Police Station landmark, surveillance tower), Clio (Library landmark, book stack).

Source authority: PRD Section 9.5 FR-Mode-5 + PRD Section 11 Spec-Drift Detection + AD-09.

## Requirements

### Requirement: 5 Apollo deterministic detectors

The Nemesis detector service SHALL implement 5 deterministic Apollo detectors producing ApolloFinding Pydantic model output.

#### Scenario: Hardcoded secrets detector

- **WHEN** detector runs on demo repo file
- **THEN** gitleaks pattern matching plus entropy 3.5 to 4.5 threshold plus custom .gitleaks.toml rules detect hardcoded secrets producing finding with severity critical

#### Scenario: Outdated dependencies detector

- **WHEN** detector runs on package manifest file (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, Gemfile, composer.json)
- **THEN** OSV API CVE check identifies outdated dependencies producing finding with severity high or critical based on CVE severity

#### Scenario: Missing auth on protected routes detector

- **WHEN** detector runs on framework route handler (Express, FastAPI, Flask, Django, Gin, Echo, Spring, Actix)
- **THEN** tree-sitter query identifies missing decorator or middleware on protected routes producing finding with severity high

#### Scenario: Unsafe SQL patterns detector

- **WHEN** detector runs on file with SQL context
- **THEN** regex plus tree-sitter query identifies raw string concatenation in SQL producing finding with severity critical

#### Scenario: Complex untested files detector

- **WHEN** detector runs on Python file
- **THEN** radon cyclomatic complexity plus test coverage stub via import parse identifies complex files lacking tests producing finding with severity medium

### Requirement: Glow window visual per severity

The system SHALL render severity-coded glow window on buildings with active findings.

#### Scenario: Critical red glow

- **WHEN** building has critical severity finding
- **THEN** building emits red glow

#### Scenario: High orange glow

- **WHEN** building has high severity finding
- **THEN** building emits orange glow

#### Scenario: Medium yellow glow

- **WHEN** building has medium severity finding
- **THEN** building emits yellow glow

#### Scenario: Low subtle blue glow off by default

- **WHEN** building has low severity finding and low glow toggle ON
- **THEN** building emits subtle blue glow

### Requirement: Apollo findings panel UI

The system SHALL show side panel with finding list grouped by severity and per-finding actions.

#### Scenario: Panel slide-in

- **WHEN** user clicks building with glow
- **THEN** Apollo findings panel slides in showing finding list grouped by severity

#### Scenario: Per-finding content

- **WHEN** panel renders
- **THEN** each finding shows detector type plus evidence snippet plus suggested remediation plus Argus CVSS score if security-related

#### Scenario: Convert to backlog ticket action

- **WHEN** user clicks "Convert to Backlog Ticket" on finding
- **THEN** GitHub issue creation initiates Hybrid Layer 1 flow

#### Scenario: View evidence action

- **WHEN** user clicks "View Evidence"
- **THEN** deeper drilldown to AST snippet renders

### Requirement: Argus CVSS scoring

Argus SHALL enrich security-related findings with CVSS v3.1 base score plus CVE reference plus mitigation via DeepSeek V4-Flash thinking low.

#### Scenario: Security finding enrichment

- **WHEN** Apollo finding is security-related (detector 1 secrets, 3 missing auth, or 4 unsafe SQL)
- **THEN** Argus looks up public CVE database
- **AND** computes CVSS v3.1 base score
- **AND** suggests mitigation with advisory reference
- **AND** output enriched ApolloFinding contains cvss_score, cve_reference, mitigation fields

#### Scenario: Grounded in CVE database

- **WHEN** Argus produces CVSS score
- **THEN** score is backed by public CVE reference or omitted with explanation (no hallucination)

### Requirement: 1-click GitHub issue creation Hybrid Layer 1

The system SHALL create GitHub issue with pre-filled evidence chain within 5 seconds when user clicks "Convert to Backlog Ticket".

#### Scenario: Issue creation

- **WHEN** user clicks button on finding
- **THEN** GitHub API POST /repos/.../issues fires with pre-filled body containing evidence chain plus suggested remediation plus CVSS score if applicable
- **AND** suggested labels applied (health-finding-<severity>, apollo-detector-<type>, security if security-related)
- **AND** confirmation toast appears within 5 seconds

#### Scenario: Drop protocol Layer 1

- **WHEN** GitHub API rate limit hit OR consecutive integration fail 2x
- **THEN** Hybrid Layer 1 drops gracefully
- **AND** toast displays "Backlog Ticket creation degraded. Copy evidence chain manually."
- **AND** in-app evidence display remains functional

### Requirement: 5 spec-drift detector patterns A E

The Nemesis detector service SHALL implement 5 deterministic spec-drift patterns producing DriftEvent output and retak building visual.

#### Scenario: Pattern A stale closed issue

- **WHEN** issue closed > 6 months ago and file mentioned in issue continues to be edited after closed
- **THEN** Pattern A drift event fires producing retak building visual

#### Scenario: Pattern B closed without merge

- **WHEN** issue closed without any PR merge touching relevant file
- **THEN** Pattern B drift event fires

#### Scenario: Pattern C spec-implementation lag

- **WHEN** issue closed and file touched, but gap between closed timestamp and file last commit exceeds configurable threshold X months
- **THEN** Pattern C drift event fires

#### Scenario: Pattern D reopened cycle

- **WHEN** issue reopened >= 2x OR multiple closing PRs reverted
- **THEN** Pattern D drift event fires

#### Scenario: Pattern E OpenSpec drift

- **WHEN** commit touches file referenced in archived OpenSpec change but commit message lacks `opsx:` prefix
- **THEN** Pattern E drift event fires (hook bypass or merge from branch without workflow-guard)

### Requirement: Clio narration spec-drift patterns

Clio SHALL narrate spec-drift pattern context via DeepSeek V4-Flash non-thinking grounded in deterministic detector output.

#### Scenario: Narration on detection

- **WHEN** retak building visual fires for Pattern A
- **THEN** Clio narrates context within 5 seconds (e.g., "Issue #123 closed 8 months ago, but auth/login.ts has 5 commits since. Pattern A signal.")

#### Scenario: Grounded narration

- **WHEN** Clio narrates
- **THEN** all numbers and facts come from deterministic detector output (LLM is storyteller, NOT judge per AD-09)

### Requirement: Zero hallucinated findings

The system SHALL produce zero hallucinated findings across 5 Apollo plus 5 spec-drift detectors.

#### Scenario: Aletheia final audit

- **WHEN** Aletheia Wave 3 final audit runs on demo repos
- **THEN** all findings have deterministic backing (file path, line number, evidence snippet, detector type) with zero hallucinated entries

## Worker ownership

- Asclepius Wave 2 owns glow window visual plus Apollo findings panel UI plus 1-click ticket viz plus click-finding-to-evidence drilldown
- Nemesis Wave 3 owns 5 Apollo detector plus Argus CVSS scoring plus 5 spec-drift pattern A-E
- Triton Wave 3 owns Apollo plus Argus plus Clio prompt wiring plus per-resident routing
- Demeter Wave 3 owns finding event persist plus 1-click GitHub issue creation backend plus drift_log table
- Hades Wave 3 owns parser service for detector input plus tree-sitter AST

## Cross-references

- PRD Section 9.5 FR-Mode-5 Health Mode
- PRD Section 11 Spec-Drift Detection
- PRD AD-09 5 deterministic detector (NOT AI-driven)
- `_meta/contracts/nemesis-to-asclepius.md`
- `_meta/contracts/nemesis-to-demeter.md`
- `_meta/contracts/asclepius-to-triton.md`
- `.claude/agents/nemesis.md`
- `.claude/agents/asclepius.md`
