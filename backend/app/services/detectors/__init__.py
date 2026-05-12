"""Nemesis 11 detector suite.

5 Apollo detector (secrets, outdated_deps, missing_auth, unsafe_sql, complex_untested)
+ Argus security CVSS enrich
+ 5 spec-drift pattern A-E (stale_closed, closed_without_merge, spec_impl_lag,
                              reopened_cycle, openspec_drift)
= 11 detector total.

See _meta/decisions/nemesis_drift_algo.md for algorithm decisions
+ _meta/plans/nemesis-wave3-cycle-plan.md for cycle plan.
"""
from app.services.detectors.types import (
    Severity,
    FindingCategory,
    ApolloDetectorId,
    SpecDriftPattern,
    ApolloFinding,
    CVSSScore,
    FindingPersist,
    DriftEvent,
    DriftEventPersist,
    FindingEvent,
    ScanResult,
    DETECTOR_TO_CATEGORY,
    SECURITY_CATEGORIES,
    PATTERN_LABELS,
)

__all__ = [
    "Severity",
    "FindingCategory",
    "ApolloDetectorId",
    "SpecDriftPattern",
    "ApolloFinding",
    "CVSSScore",
    "FindingPersist",
    "DriftEvent",
    "DriftEventPersist",
    "FindingEvent",
    "ScanResult",
    "DETECTOR_TO_CATEGORY",
    "SECURITY_CATEGORIES",
    "PATTERN_LABELS",
]
