#!/usr/bin/env bash
#
# Codeplex Chronicle smoke test E2E (Atlas Wave 3, SC-04 ship criteria)
#
# Runs the Python httpx automation 3 times consecutively. All 3 trials must
# PASS with NO mid-run recovery to satisfy PRD SC-04 ship criteria.
#
# Per Atlas-to-Production contract + Aletheia Wave 3 final audit gate.
#
# Usage:
#   ./scripts/smoke-test-e2e.sh                # default: 3 trial run
#   TRIALS=5 ./scripts/smoke-test-e2e.sh       # override trial count
#   TARGET=https://other.example.com ./scripts/smoke-test-e2e.sh  # alt target

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

TRIALS="${TRIALS:-3}"
TARGET="${TARGET:-https://duopoly.hackathon.sev-2.com}"

log() { echo "[smoke-test-e2e.sh $(date +%H:%M:%S)] $*"; }

# Pre-flight
if ! command -v python3 >/dev/null 2>&1; then
    log "[FAIL] python3 not installed"
    exit 1
fi

# Ensure httpx available
if ! python3 -c "import httpx" 2>/dev/null; then
    log "[NOTE] httpx not installed in default python3, installing"
    python3 -m pip install --quiet --user httpx
fi

log "=== Smoke test E2E (Atlas Wave 3, SC-04) ==="
log "TARGET=$TARGET"
log "TRIALS=$TRIALS (consecutive, no mid-run recovery)"
log ""

# Run Python smoke test
TARGET="$TARGET" TRIALS="$TRIALS" python3 "$PROJECT_ROOT/tests/smoke_test_e2e.py"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    log ""
    log "=== ALL $TRIALS TRIALS PASS (SC-04 satisfied) ==="
    log "Atlas Wave 3 ship criteria smoke test complete."
    log "Next: handoff to Aletheia final audit."
    exit 0
else
    log ""
    log "=== SMOKE TEST FAIL (exit $RESULT) ==="
    log "SC-04 NOT satisfied. Atlas re-deploy or ferry V1 Orch required."
    exit "$RESULT"
fi
