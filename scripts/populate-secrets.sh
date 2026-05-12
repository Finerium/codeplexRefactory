#!/usr/bin/env bash
#
# Codeplex Chronicle K8s Secret population (Atlas Wave 3)
#
# Reads `.env` (project root, mode 600, gitignored) and creates or updates 4
# Secret objects in namespace duopoly using the idempotent dry-run-and-apply
# pattern. Real secret values NEVER touch a committed YAML file.
#
# 4 Secrets:
#   duopoly-deepseek      api-key
#   duopoly-github-oauth  client-id + client-secret + webhook-secret
#   duopoly-db            url
#   duopoly-session       secret  (auto-generated if SESSION_SECRET absent in .env)
#
# Idempotent: safe to re-run. `--dry-run=client -o yaml | kubectl apply -f -`
# pattern creates if missing, updates if present.
#
# Usage:
#   ./scripts/populate-secrets.sh
#
# Pre-flight:
#   - .env populated with DEEPSEEK_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
#     GITHUB_WEBHOOK_SECRET, DATABASE_URL
#   - ~/.kube/duopoly-config readable (mode 600)
#   - kubectl installed

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

KUBECONFIG_PATH="${KUBECONFIG_PATH:-${HOME}/.kube/duopoly-config}"
K8S_NAMESPACE="${K8S_NAMESPACE:-duopoly}"

log() { echo "[populate-secrets.sh $(date +%H:%M:%S)] $*"; }

# Pre-flight
if [ ! -f .env ]; then
    log "[FAIL] .env not present at $PROJECT_ROOT"
    exit 1
fi

if [ ! -f "$KUBECONFIG_PATH" ]; then
    log "[FAIL] kubeconfig not found at $KUBECONFIG_PATH"
    exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
    log "[FAIL] kubectl not installed"
    exit 1
fi

# Source .env into shell. set -a auto-exports all subsequently assigned vars.
# Note: DATABASE_URL has URL-encoded special chars (%2A, %3E, %7B, %3F) and
# the value is already URL-encoded so shell does not need to handle special
# chars again.
log "Loading .env"
set -a
# shellcheck disable=SC1091
source .env
set +a

# Validate required vars present
required_vars=(
    DEEPSEEK_API_KEY
    GITHUB_CLIENT_ID
    GITHUB_CLIENT_SECRET
    GITHUB_WEBHOOK_SECRET
    DATABASE_URL
)
missing=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        missing+=("$var")
    fi
done
if [ ${#missing[@]} -gt 0 ]; then
    log "[FAIL] missing required env vars in .env: ${missing[*]}"
    exit 1
fi

# SESSION_SECRET: use from .env if present, else generate 32-byte urlsafe
if [ -z "${SESSION_SECRET:-}" ]; then
    log "SESSION_SECRET not set in .env, generating fresh 32-byte urlsafe"
    if command -v python3 >/dev/null 2>&1; then
        SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    elif command -v openssl >/dev/null 2>&1; then
        SESSION_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 43)
    else
        log "[FAIL] need python3 or openssl to generate SESSION_SECRET"
        exit 1
    fi
fi

log "[OK] all required env vars resolved"

# Helper: create-or-update secret via dry-run-and-apply (idempotent)
kc() {
    kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" "$@"
}

apply_secret() {
    local name="$1"
    shift
    log "Applying secret: $name"
    kc create secret generic "$name" \
        "$@" \
        --dry-run=client -o yaml \
        | kc apply -f -
}

# Verify namespace accessible. Refactory pre-provisioned namespace `duopoly`
# with a namespace-scoped service account. The SA may NOT have cluster-scope
# `get namespace` permission, so we probe via a namespace-scoped resource list
# instead (`get secrets` returns 200 OK when the namespace exists and the SA
# is authorized). Atlas D-Atlas-16 cycle 3.
if ! kc get secrets >/dev/null 2>&1; then
    log "[FAIL] namespace $K8S_NAMESPACE not accessible (kubectl get secrets failed)"
    log "       check KUBECONFIG_PATH=$KUBECONFIG_PATH and Refactory namespace provisioning"
    exit 1
fi
log "[OK] namespace $K8S_NAMESPACE accessible"

# 1. DeepSeek API key
apply_secret duopoly-deepseek \
    --from-literal=api-key="$DEEPSEEK_API_KEY"

# 2. GitHub OAuth (3 keys)
apply_secret duopoly-github-oauth \
    --from-literal=client-id="$GITHUB_CLIENT_ID" \
    --from-literal=client-secret="$GITHUB_CLIENT_SECRET" \
    --from-literal=webhook-secret="$GITHUB_WEBHOOK_SECRET"

# 3. Database URL
apply_secret duopoly-db \
    --from-literal=url="$DATABASE_URL"

# 4. Session signing key (auto-generated if absent in .env)
apply_secret duopoly-session \
    --from-literal=secret="$SESSION_SECRET"

log ""
log "=== Secrets populated ==="
kc get secrets -l app=codeplex-chronicle,owner=atlas 2>/dev/null || \
    kc get secrets duopoly-deepseek duopoly-github-oauth duopoly-db duopoly-session
log ""
log "Next: ./scripts/deploy.sh (or kubectl apply -f infra/k8s/ for manifest only)"
