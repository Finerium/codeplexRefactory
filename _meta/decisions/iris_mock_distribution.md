# Iris Mock Data Distribution Decision

**Author**: Iris (Wave 1)
**Date**: 2026-05-12 (Wave 1 Cycle 4)
**Cross-ref**: `_meta/decision_log/iris.md` D-Iris-07, D-Iris-08.

## Building count target

240 buildings (counted at module load from squarifyTreemap output).

Pythia contract `iris-to-hera.md` validates 100-300 range. 240 sits in the
middle with:
- 40 building margin above 200 (H1 hypothesis lower bound, rigorous test)
- 60 building margin below 300 (headroom for Hera Wave 2 PM overlay nodes
  per building)

## Tree shape

Modeled after `fastapi/full-stack-fastapi-template` (PRD Section 14.1
demo dataset), 7 top-level districts:

| District | File count (approx) | Owner | Landmark resident |
|---|---|---|---|
| backend | ~85 | @backend-team, @data, @security, @platform | Athena, Apollo, Argus |
| frontend | ~80 | @frontend-team | Clio, Hermes |
| infra | ~17 | @platform | (none, generic only) |
| scripts | ~14 | @platform | (none) |
| tests | ~28 | @backend-team | (none) |
| docs | ~12 | @hafiz | (none) |
| openspec | ~15 | @hafiz | (none) |

Plus a small number of root-level files (3-5).

Folder depth: 2-3 levels max. backend has 9 subfolders, frontend has 7
subfolders. No 4+ level recursion (avoids floating-point overlap edge
case per uncertainty journal U-Iris-04).

## Landmark slot assignment (mock Wave 1)

Pinned to specific file paths for stable visual reference:

| Resident | Archetype | Mock file | LOC | Activity |
|---|---|---|---|---|
| Athena | temple | backend/app/core/main.py | 540 | 0.82 |
| Apollo | cross-shape | backend/app/health/diagnostic.py | 380 | 0.68 |
| Argus | surveillance-tower | backend/app/security/scanner.py | 420 | 0.74 |
| Clio | vertical-stack | frontend/src/history/timeline.tsx | 410 | 0.66 |
| Hermes | glass-cube | frontend/src/onboarding/tour.tsx | 340 | 0.71 |

Each landmark has high LOC + high activity to read as "important file" in
city verticality + brightness. Wave 3 real-mode assignment algorithm
deferred per OQ-Iris-B in handoff log.

## Owner pool

6 mock teams hashed across all files:

- @backend-team
- @frontend-team
- @platform
- @security
- @data
- @hafiz

Distribution chosen so:
- Backend has 4 of 6 teams (realistic codebase complexity)
- Frontend dominated by 1 team (typical)
- Cross-cutting roles (@platform, @hafiz) appear in multiple districts

## Activity distribution

Bucket assignment via path hash (deterministic):

| Bucket | % of files | Activity range |
|---|---|---|
| Active | 30% | 0.55 to 0.85 |
| Medium | 50% | 0.20 to 0.50 |
| Idle | 20% | 0.05 to 0.19 |

Same path always lands in same bucket = same activity value, deterministic
city rendering.

## LOC weight distribution

Bucket via path hash:

| Bucket | % of files | LOC range |
|---|---|---|
| Typical | 90% | 60 to 339 |
| Outlier (skyscraper) | 10% | 460 to 1000 |

Skyscraper outliers trigger encodeHeight polynomial boost reaching the
NYC/Dubai tier per PRD Section 13.1 "verticality stretch vector".

## What this mock is NOT

- NOT an actual parse of the fastapi/full-stack-fastapi-template repo. It is
  a hand-shaped tree that mimics the typical layout + file count +
  ownership distribution. Real Wave 3 mode replaces wholesale via Demeter
  event-store streaming from tree-sitter backend.
- NOT designed to fire the 5 Apollo health detectors. NodeGoat demo dataset
  is the Health Mode hero (per PRD Section 14.2). Mock here is for the
  Sprint Mode + 3D city geometry baseline.
- NOT permanent. mockCityData.ts is replaced at Wave 3 boundary.

## Verification

`mockCityData.ts` includes a dev-only console.warn if building count falls
outside the 100-320 band. Production build strips the assertion.

Tested informally: import + measure result.buildings.length = 245 at
authoring time. Within range. May drift slightly if tree shape edited.
