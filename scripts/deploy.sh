#!/usr/bin/env bash
#
# Codeplex Chronicle deploy script (Atlas Wave 3)
#
# Builds the multi-arch Docker image, pushes to ghcr.io (or docker.io fallback
# via REGISTRY env override), populates K8s Secrets from .env, applies all
# manifests to namespace duopoly, waits for rollout, then verifies via curl.
#
# Usage:
#   ./scripts/deploy.sh                  # default: ghcr.io/finerium, tag :latest
#   REGISTRY=docker.io/finerium ./scripts/deploy.sh
#   TAG=20260513-0530 ./scripts/deploy.sh
#   SKIP_BUILD=1 ./scripts/deploy.sh     # skip docker build (apply manifests only)
#   SKIP_PUSH=1 ./scripts/deploy.sh      # build local only, no registry push
#   SINGLE_ARCH=1 ./scripts/deploy.sh    # AMD64-only (buildx fallback)
#
# Pre-flight:
#   - .env populated with DEEPSEEK_API_KEY, GITHUB_*, DATABASE_URL
#   - ~/.kube/duopoly-config readable (mode 600)
#   - docker (or docker buildx for multi-arch) installed
#   - kubectl installed
#   - logged into ghcr.io: `echo $GITHUB_PAT | docker login ghcr.io -u finerium --password-stdin`

set -euo pipefail

# Resolve project root (script lives in scripts/)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration with sensible defaults
REGISTRY="${REGISTRY:-ghcr.io/finerium}"
IMAGE_NAME="${IMAGE_NAME:-codeplexrefactory}"
TAG="${TAG:-latest}"
IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
KUBECONFIG_PATH="${KUBECONFIG_PATH:-${HOME}/.kube/duopoly-config}"
K8S_NAMESPACE="${K8S_NAMESPACE:-duopoly}"
APP_DOMAIN="${APP_DOMAIN:-duopoly.hackathon.sev-2.com}"

# Optional skips for partial workflows
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_PUSH="${SKIP_PUSH:-0}"
SINGLE_ARCH="${SINGLE_ARCH:-0}"

log() { echo "[deploy.sh $(date +%H:%M:%S)] $*"; }

# Step 0: Pre-flight checks
log "=== Pre-flight checks ==="
if [ ! -f .env ]; then
    log "[FAIL] .env not present at project root. Cannot populate secrets."
    exit 1
fi

if [ ! -f "$KUBECONFIG_PATH" ]; then
    log "[FAIL] kubeconfig not found at $KUBECONFIG_PATH"
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    log "[FAIL] docker not installed. Atlas Cycle 2 requires Docker tooling."
    exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
    log "[FAIL] kubectl not installed. Atlas Cycle 3 requires kubectl."
    exit 1
fi

log "[OK] all pre-flight tools present"
log "    REGISTRY=$REGISTRY"
log "    IMAGE=$IMAGE"
log "    KUBECONFIG=$KUBECONFIG_PATH"
log "    NAMESPACE=$K8S_NAMESPACE"
log "    APP_DOMAIN=$APP_DOMAIN"

# Step 1: Build Docker image (multi-arch via buildx, or single-arch fallback)
if [ "$SKIP_BUILD" = "1" ]; then
    log "=== SKIP_BUILD set, skipping image build ==="
else
    log "=== Building Docker image ==="

    BUILD_PUSH_FLAG="--push"
    if [ "$SKIP_PUSH" = "1" ]; then
        BUILD_PUSH_FLAG="--load"
        log "[NOTE] SKIP_PUSH set, building locally with --load (single-arch implicit)"
        SINGLE_ARCH=1
    fi

    if [ "$SINGLE_ARCH" = "1" ]; then
        log "Single-arch build (linux/amd64 only)"
        if docker buildx version >/dev/null 2>&1; then
            docker buildx build \
                --platform linux/amd64 \
                --tag "$IMAGE" \
                --file infra/docker/Dockerfile \
                $BUILD_PUSH_FLAG \
                .
        else
            log "[NOTE] buildx absent, using legacy docker build (no push, requires manual push)"
            docker build \
                --tag "$IMAGE" \
                --file infra/docker/Dockerfile \
                .
            if [ "$SKIP_PUSH" != "1" ]; then
                docker push "$IMAGE"
            fi
        fi
    else
        log "Multi-arch build (linux/amd64 + linux/arm64)"
        if ! docker buildx version >/dev/null 2>&1; then
            log "[FAIL] docker buildx not installed. Falling back to single-arch."
            log "       Re-run with SINGLE_ARCH=1 to suppress this check."
            exit 1
        fi
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            --tag "$IMAGE" \
            --file infra/docker/Dockerfile \
            $BUILD_PUSH_FLAG \
            .
    fi
    log "[OK] image built: $IMAGE"
fi

# Step 2: Populate K8s Secrets from .env
log "=== Populating K8s Secrets ==="
"$PROJECT_ROOT/scripts/populate-secrets.sh"
log "[OK] secrets populated"

# Step 3: Apply K8s manifests
log "=== Applying K8s manifests ==="
# Apply order: configmap first (deployment env refs require it), then deployment,
# service, ingress. secrets-template.yaml is NOT applied (placeholder values
# would overwrite real secrets created by populate-secrets.sh).
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" apply -f infra/k8s/configmap.yaml
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" apply -f infra/k8s/deployment.yaml
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" apply -f infra/k8s/service.yaml
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" apply -f infra/k8s/ingress.yaml
log "[OK] manifests applied"

# Step 4: Force pod restart to pick up new image (imagePullPolicy: Always is set
# but a no-op apply does not trigger rollout; rollout restart forces fresh pull).
log "=== Forcing rollout restart ==="
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" rollout restart deployment/codeplex-chronicle
log "[OK] rollout restart triggered"

# Step 5: Wait for rollout
log "=== Waiting for rollout (max 300s) ==="
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" rollout status deployment/codeplex-chronicle --timeout=300s

# Step 6: Verify live
log "=== Verifying live deploy ==="
sleep 5  # NGINX ingress propagation grace

VERIFY_URL="https://${APP_DOMAIN}/"
HEALTH_URL="https://${APP_DOMAIN}/api/../health"  # NGINX serves /health via backend route

log "Checking $VERIFY_URL ..."
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -I "$VERIFY_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    log "[OK] $VERIFY_URL returned $HTTP_CODE"
else
    log "[WARN] $VERIFY_URL returned $HTTP_CODE (expected 200/301/302)"
fi

log "Checking https://${APP_DOMAIN}/health ..."
HEALTH_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://${APP_DOMAIN}/health" || echo "000")
if [ "$HEALTH_CODE" = "200" ]; then
    log "[OK] /health returned 200"
else
    log "[WARN] /health returned $HEALTH_CODE (expected 200)"
fi

# Step 7: Print pod status
log "=== Pod status ==="
kubectl --kubeconfig="$KUBECONFIG_PATH" -n "$K8S_NAMESPACE" get pods -l app=codeplex-chronicle

log ""
log "=== Deploy complete ==="
log "Visit: https://${APP_DOMAIN}/"
log ""
log "Next: run ./scripts/smoke-test-e2e.sh to verify 3x consecutive trial run (SC-04)"
