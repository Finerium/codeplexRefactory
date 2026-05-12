#!/usr/bin/env bash
#
# Codeplex Chronicle deploy health diagnostic (Atlas Wave 3)
#
# Snapshots the current deploy state for troubleshooting:
#   - kubectl get pods (running, ready, restart count)
#   - kubectl describe pod (latest events + container status)
#   - kubectl logs (recent backend + frontend output)
#   - kubectl get ingress
#   - curl probes against live URL
#
# Use this between deploy.sh + smoke-test-e2e.sh to confirm the pod is
# actually serving before invoking the 3x consecutive trial run.
#
# Usage:
#   ./scripts/check-deploy-health.sh
#   APP_DOMAIN=other.example.com ./scripts/check-deploy-health.sh

set -uo pipefail
# note: set -e omitted so partial diagnostic still completes even if a
# subcommand fails (we want to see all diagnostic output).

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

KUBECONFIG_PATH="${KUBECONFIG_PATH:-${HOME}/.kube/duopoly-config}"
K8S_NAMESPACE="${K8S_NAMESPACE:-duopoly}"
APP_DOMAIN="${APP_DOMAIN:-duopoly.hackathon.sev-2.com}"

log() { echo "[health $(date +%H:%M:%S)] $*"; }

if ! command -v kubectl >/dev/null 2>&1; then
    log "[FAIL] kubectl not installed"
    exit 1
fi

if [ ! -f "$KUBECONFIG_PATH" ]; then
    log "[FAIL] kubeconfig not found at $KUBECONFIG_PATH"
    exit 1
fi

kc() {
    kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" "$@"
}

log "=== Atlas Wave 3 deploy health diagnostic ==="
log "namespace=$K8S_NAMESPACE domain=$APP_DOMAIN"
log ""

log "--- pods ---"
kc get pods -l app=codeplex-chronicle -o wide
log ""

log "--- deployment ---"
kc get deployment codeplex-chronicle -o wide 2>/dev/null
log ""

log "--- service ---"
kc get svc codeplex-chronicle-svc 2>/dev/null
log ""

log "--- ingress ---"
kc get ingress codeplex-chronicle-ingress 2>/dev/null
log ""

log "--- pod describe (events + container status) ---"
POD_NAME=$(kc get pods -l app=codeplex-chronicle -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$POD_NAME" ]; then
    kc describe pod "$POD_NAME" | tail -60
else
    log "[WARN] no pod found matching app=codeplex-chronicle"
fi
log ""

log "--- recent container logs (last 100 lines) ---"
if [ -n "$POD_NAME" ]; then
    kc logs "$POD_NAME" --tail=100 2>&1 || log "[WARN] cannot fetch logs"
fi
log ""

log "--- live URL probes ---"
for path in "/" "/start" "/health" "/api/auth/github/start" "/city?mock_auth=true" "/dashboard"; do
    code=$(curl -sS -o /dev/null -w "%{http_code}" -I "https://${APP_DOMAIN}${path}" --max-time 10 2>/dev/null || echo "000")
    log "  https://${APP_DOMAIN}${path}  HTTP $code"
done
log ""

log "=== Health diagnostic complete ==="
