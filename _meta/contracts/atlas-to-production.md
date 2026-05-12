# Contract: Atlas to Production Deploy

**Edge type**: terminal (Wave 3 to production environment)
**Wave**: Wave 3 producer to production deployment target
**Status**: locked
**Authored**: 2026-05-12 16:29 WIB

## Producer

**Worker**: Atlas (Wave 3)
**Domain**: Docker multi-arch + K8s manifests + NGINX verify + K8s Secret population + feature flag runtime ConfigMap + smoke test E2E 3x consecutive successful trial run. Atlas is the last-mile worker that takes Wave 1-3 outputs and deploys to Refactory pre-provisioned Kubernetes namespace `duopoly` at https://duopoly.hackathon.sev-2.com.

## Consumer

**Production environment**: Refactory-managed Kubernetes cluster (server 103.185.52.45:6443) with pre-provisioned namespace `duopoly`, NGINX ingress, HTTPS termination, pre-configured domain `duopoly.hackathon.sev-2.com`. Refactory Postgres at `103.185.52.138:1185`. Terminal consumer: the deployed application accessible by panitia judges + Tim Duopoly demo flow.

## Output schema (producer to consumer)

Atlas produces deploy artifacts + executes deploy steps.

```dockerfile
# infra/docker/Dockerfile (Atlas authors, multi-stage build)
# Stage 1: Frontend build
FROM node:22-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_ENABLE_DOF
ARG NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3
ARG NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT
RUN pnpm build

# Stage 2: Backend build
FROM python:3.12-slim AS backend-builder
WORKDIR /build/backend
RUN pip install uv
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ ./

# Stage 3: Runtime
FROM python:3.12-slim AS runtime
WORKDIR /app

# Install runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend with venv
COPY --from=backend-builder /build/backend /app/backend
ENV PATH="/app/backend/.venv/bin:$PATH"

# Copy frontend static export
COPY --from=frontend-builder /build/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /build/frontend/public /app/frontend/public
COPY --from=frontend-builder /build/frontend/package.json /app/frontend/

# Install Node runtime for Next.js standalone server
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8000 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health && curl -f http://localhost:3000 || exit 1

# Start command launches both Next.js and FastAPI
COPY infra/docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
```

```bash
# infra/docker/start.sh (Atlas)
#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations
cd /app/backend
.venv/bin/alembic upgrade head

# Start FastAPI (backend) and Next.js standalone server in parallel
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd /app/frontend
node .next/standalone/server.js &
FRONTEND_PID=$!

# Trap SIGTERM, kill both
trap "kill $BACKEND_PID $FRONTEND_PID" SIGTERM SIGINT

wait
```

K8s manifests:

```yaml
# infra/k8s/deployment.yaml (Atlas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codeplex-chronicle
  namespace: duopoly
spec:
  replicas: 1
  selector:
    matchLabels:
      app: codeplex-chronicle
  template:
    metadata:
      labels:
        app: codeplex-chronicle
    spec:
      containers:
      - name: app
        image: ghcr.io/finerium/codeplex-chronicle:latest
        ports:
        - containerPort: 3000
          name: frontend
        - containerPort: 8000
          name: backend
        env:
        - name: DEEPSEEK_API_KEY
          valueFrom:
            secretKeyRef:
              name: duopoly-deepseek
              key: api-key
        - name: DEEPSEEK_BASE_URL
          value: "https://api.deepseek.com"
        - name: DEEPSEEK_MODEL_FLASH
          value: "deepseek-v4-flash"
        - name: DEEPSEEK_MODEL_PRO
          value: "deepseek-v4-pro"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: duopoly-db
              key: url
        - name: GITHUB_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: duopoly-github-oauth
              key: client-id
        - name: GITHUB_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: duopoly-github-oauth
              key: client-secret
        - name: GITHUB_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: duopoly-github-oauth
              key: webhook-secret
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: duopoly-session
              key: secret
        - name: ENABLE_WRITE_OPS
          valueFrom:
            configMapKeyRef:
              name: duopoly-feature-flags
              key: ENABLE_WRITE_OPS
        - name: ENABLE_WRITE_OPS_LAYER_2
          valueFrom:
            configMapKeyRef:
              name: duopoly-feature-flags
              key: ENABLE_WRITE_OPS_LAYER_2
        - name: ENABLE_DOF
          valueFrom:
            configMapKeyRef:
              name: duopoly-feature-flags
              key: ENABLE_DOF
        - name: ENABLE_SPARKLES_TIER_3
          valueFrom:
            configMapKeyRef:
              name: duopoly-feature-flags
              key: ENABLE_SPARKLES_TIER_3
        - name: ENABLE_THIRD_DIRECTIONAL_LIGHT
          valueFrom:
            configMapKeyRef:
              name: duopoly-feature-flags
              key: ENABLE_THIRD_DIRECTIONAL_LIGHT
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

```yaml
# infra/k8s/service.yaml (Atlas)
apiVersion: v1
kind: Service
metadata:
  name: codeplex-chronicle-svc
  namespace: duopoly
spec:
  selector:
    app: codeplex-chronicle
  ports:
  - name: frontend
    port: 3000
    targetPort: 3000
  - name: backend
    port: 8000
    targetPort: 8000
  type: ClusterIP
```

```yaml
# infra/k8s/ingress.yaml (Atlas)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: codeplex-chronicle-ingress
  namespace: duopoly
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
spec:
  ingressClassName: nginx
  rules:
  - host: duopoly.hackathon.sev-2.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: codeplex-chronicle-svc
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: codeplex-chronicle-svc
            port:
              number: 3000
  tls:
  - hosts:
    - duopoly.hackathon.sev-2.com
    secretName: duopoly-tls  # Refactory-managed
```

```yaml
# infra/k8s/configmap-feature-flags.yaml (Atlas)
apiVersion: v1
kind: ConfigMap
metadata:
  name: duopoly-feature-flags
  namespace: duopoly
data:
  ENABLE_WRITE_OPS: "true"
  ENABLE_WRITE_OPS_LAYER_2: "true"
  ENABLE_DOF: "true"
  ENABLE_SPARKLES_TIER_3: "true"
  ENABLE_THIRD_DIRECTIONAL_LIGHT: "true"
```

Deploy script:

```bash
# scripts/deploy.sh (Atlas; per OQ-04 manual kubectl recommended)
#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io/finerium}"
IMAGE="codeplex-chronicle"
TAG="${TAG:-latest}"

# Build multi-arch image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ${REGISTRY}/${IMAGE}:${TAG} \
  --file infra/docker/Dockerfile \
  --push \
  .

# Apply K8s manifests
KUBECONFIG="${HOME}/.kube/duopoly-config"
kubectl --kubeconfig=$KUBECONFIG -n duopoly apply -f infra/k8s/

# Wait for rollout
kubectl --kubeconfig=$KUBECONFIG -n duopoly rollout status deployment/codeplex-chronicle --timeout=300s

# Smoke test
curl -fsS https://duopoly.hackathon.sev-2.com/health
echo "Deploy successful. Visit https://duopoly.hackathon.sev-2.com"
```

Secret creation (one-time setup):

```bash
# scripts/k8s-secrets.sh (Atlas runs once at Wave 3 deploy)
#!/usr/bin/env bash
set -euo pipefail

source .env  # Load DEEPSEEK_API_KEY, GITHUB_*, DATABASE_URL, SESSION_SECRET

KUBECONFIG="${HOME}/.kube/duopoly-config"

kubectl --kubeconfig=$KUBECONFIG -n duopoly create secret generic duopoly-deepseek \
  --from-literal=api-key="$DEEPSEEK_API_KEY" \
  --dry-run=client -o yaml | kubectl --kubeconfig=$KUBECONFIG apply -f -

kubectl --kubeconfig=$KUBECONFIG -n duopoly create secret generic duopoly-github-oauth \
  --from-literal=client-id="$GITHUB_CLIENT_ID" \
  --from-literal=client-secret="$GITHUB_CLIENT_SECRET" \
  --from-literal=webhook-secret="$GITHUB_WEBHOOK_SECRET" \
  --dry-run=client -o yaml | kubectl --kubeconfig=$KUBECONFIG apply -f -

kubectl --kubeconfig=$KUBECONFIG -n duopoly create secret generic duopoly-db \
  --from-literal=url="$DATABASE_URL" \
  --dry-run=client -o yaml | kubectl --kubeconfig=$KUBECONFIG apply -f -

kubectl --kubeconfig=$KUBECONFIG -n duopoly create secret generic duopoly-session \
  --from-literal=secret="$SESSION_SECRET" \
  --dry-run=client -o yaml | kubectl --kubeconfig=$KUBECONFIG apply -f -
```

## Storage location

- Dockerfile: `infra/docker/Dockerfile` (Atlas)
- Start script: `infra/docker/start.sh` (Atlas)
- K8s manifests: `infra/k8s/*.yaml` (Atlas; deployment + service + ingress + configmap)
- Deploy script: `scripts/deploy.sh` (Atlas)
- Secret bootstrap script: `scripts/k8s-secrets.sh` (Atlas)
- GitHub OAuth secrets: env vars populated by Themis Wave 0 + Atlas Wave 3 reads from .env to populate K8s Secret

## Asumption baked

1. Multi-arch image (ARM64 + AMD64) supports both M-series local + cluster x86; minor overhead acceptable.
2. Refactory K8s cluster ingress controller is NGINX; pre-managed by Refactory team.
3. HTTPS termination at ingress; backend runs HTTP within cluster.
4. Single replica Wave 3 default; horizontal scaling out of scope.
5. Alembic migrations run on container start (start.sh); race condition with concurrent starts non-issue at replicas=1.
6. K8s Secrets created via dry-run-and-apply pattern (idempotent); no plaintext secret committed to manifest files.
7. Feature flags as ConfigMap allow runtime toggle without container rebuild (kubectl edit + pod restart).
8. Docker image registry = ghcr.io (Finerium account); Themis Wave 0 configures GitHub Container Registry credentials.

## Validation steps

**Producer responsibility (Atlas)**:
- Dockerfile builds successfully multi-arch (`docker buildx build --platform linux/amd64,linux/arm64`).
- Image size < 1.5 GB (frontend static + backend with deps).
- K8s manifests `kubectl apply -f` succeeds in namespace `duopoly`.
- Rollout completes within 300s (5 minutes).
- `/health` endpoint returns 200 OK.
- Frontend route `/` loads at https://duopoly.hackathon.sev-2.com.
- Smoke test E2E (3x consecutive): load landing -> Import a repository -> OAuth flow -> switch to City View -> click building -> query Hermes tour -> switch Health Mode -> see findings glow -> click finding -> Convert to Backlog Ticket -> verify GitHub issue created.
- 0 critical errors in container logs during 5-minute soak test.

**Consumer responsibility (Production environment)**:
- NGINX ingress routes /api to backend, / to frontend.
- TLS cert valid + auto-renewed (Refactory-managed).
- PostgreSQL connection works from pod network.

## Edge case handling

- Container image too large (> 2 GB): Atlas optimizes multi-stage build, alpine variants where possible.
- Cold start slow (> 60s): Atlas extends startup probe initialDelaySeconds to 60s.
- Migration fails: Atlas's start.sh exits with error; pod restart loops; kubectl logs identify issue for Pan rescue.
- Webhook receive fails: ingress timeout or HMAC verification fails. Atlas + Hades cross-validate webhook URL registration vs deploy domain.
- Secret rotation: Wave 3 ship state = manual; production deploy hooks deferred.

## Open questions

- OQ-04 (CI/CD GitHub Actions vs manual kubectl): Metis recommends manual `scripts/deploy.sh` for hackathon scope. GitHub Actions overhead unwarranted. Pan Day 2 may add Actions if Day 2 demand.
- Docker image registry choice: ghcr.io (Finerium) primary; docker.io fallback if rate-limit hit.
- Day 2 jam 11-13 final deploy: Atlas + Pan execute together; Atlas owns deploy script execution, Pan validates demo flow E2E 3x consecutive.

## Reference

- Metis Agentic Structure md Section 2 DAG: Atlas K8s manifests + Dockerfile deployed at duopoly.hackathon.sev-2.com, terminal edge
- Metis Section 5.6 Atlas ship criteria (multi-stage Dockerfile + multi-arch + K8s manifests + smoke test E2E 3x consecutive)
- PRD Section 17.4 (Kubernetes deployment locked at duopoly namespace)
- PRD Section 19 (Security + K8s Secret + TLS)
- PRD Section 24 (Submission deliverable)
- PRD Section 25 OQ-04 (Manual kubectl recommended)
- sourceoftruth Section 3.3 (Refactory Postgres + K8s credentials live)
- sourceoftruth Section 5 (Submission deliverable mapping)
- Phase B Topic 3a (Anthropic Agent Teams: Wave 3 concurrent agents include Atlas)
