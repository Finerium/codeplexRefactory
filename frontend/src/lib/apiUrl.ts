/**
 * Centralized API base URL resolver + safe endpoint composer.
 *
 * Wave-Fixing 3 Manager FINAL ship (Triton, STAMP 20260513-0626).
 *
 * Why this exists:
 *   T-1 RECURRING bug root-cause: production ConfigMap previously set
 *   `NEXT_PUBLIC_API_URL: "/api"` which caused every frontend fetch site
 *   (chat, dashboard, repos) to compose `${apiBase}/api/<endpoint>` =
 *   `/api/api/<endpoint>`. Result: HTTP 404 on every backend call because the
 *   ingress only routed `/api/*` once. Manager hot-fix swapped the ConfigMap
 *   + Docker ARG to empty string which produces correct same-origin
 *   `/api/<endpoint>` paths.
 *
 *   This helper is the DEFENSIVE GUARD against the same bug recurring in a
 *   future cycle: even if someone accidentally re-adds `/api` to
 *   `NEXT_PUBLIC_API_URL`, `apiUrl()` strips the trailing `/api` segment
 *   before composing. The fetch path is correct under all three
 *   ConfigMap states:
 *     1. NEXT_PUBLIC_API_URL=""        -> apiUrl("/chat") -> "/api/chat"
 *     2. NEXT_PUBLIC_API_URL="/api"   -> apiUrl("/chat") -> "/api/chat"
 *     3. NEXT_PUBLIC_API_URL="https://duopoly.hackathon.sev-2.com" ->
 *        apiUrl("/chat") -> "https://duopoly.hackathon.sev-2.com/api/chat"
 *     4. NEXT_PUBLIC_API_URL="http://localhost:8000" -> dev override:
 *        apiUrl("/chat") -> "http://localhost:8000/api/chat"
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): this is the canonical helper. Older inline
 *   `resolveApiBase` + `backendBase` patterns are deprecated and now
 *   delegate to this module.
 */

/**
 * Trim trailing slash(es) for clean composition.
 */
function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Defensive: strip a trailing `/api` segment if accidentally present in
 * `NEXT_PUBLIC_API_URL`. Manager FINAL Wave-Fixing 3 root-cause fix proven:
 * a value of `/api` produced `/api/api/<endpoint>` 404 on every redeploy.
 * This helper makes the bug impossible to reintroduce via ConfigMap edit.
 */
function stripTrailingApi(s: string): string {
  return trimTrailingSlash(s).replace(/\/api$/i, '');
}

/**
 * Resolve the backend base URL from the build-time + runtime env, applying
 * the double-`/api` safety guard.
 *
 * Production deploys serve frontend + backend under the same origin via the
 * Traefik ingress (`/` -> frontend, `/api/*` -> backend), so the empty
 * string makes relative paths like `/api/chat` resolve correctly.
 *
 * Dev override: set `NEXT_PUBLIC_API_URL=http://localhost:8000` in
 * `.env.local` to point the local frontend at a separate backend pod.
 *
 * Note: `process.env.NEXT_PUBLIC_API_URL` is statically inlined by Next.js
 * at build time, so the K8s ConfigMap value only takes effect on container
 * image rebuilds (see `infra/docker/Dockerfile` ARG NEXT_PUBLIC_API_URL).
 * The runtime ConfigMap remains useful for the FastAPI backend side.
 */
export function resolveApiBase(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined;

  if (!fromEnv || fromEnv.trim().length === 0) {
    // Production same-origin: empty string composes to `/api/<endpoint>`.
    return '';
  }

  // Special-case the legacy `localhost:8000` value when running in browser
  // production (no localhost reachable). When the env truly is local dev,
  // the browser is on localhost so the value still works; we only swap
  // when the env value looks like a non-dev URL OR when window.location
  // is not localhost. Wave-Fixing 3 default behaviour: keep the env value
  // unless it is empty.
  return stripTrailingApi(fromEnv);
}

/**
 * Compose a fully-qualified API URL from a path segment.
 *
 * @param path The path WITHOUT the leading `/api`. Examples:
 *   `apiUrl("/chat")` -> "/api/chat"
 *   `apiUrl("/repos/list")` -> "/api/repos/list"
 *   `apiUrl("/dashboard?range=sprint")` -> "/api/dashboard?range=sprint"
 *
 * Tolerated input variants (defensive):
 *   `apiUrl("chat")` -> "/api/chat"  (leading slash optional)
 *   `apiUrl("/api/chat")` -> "/api/chat"  (already-prefixed safe)
 */
export function apiUrl(path: string): string {
  const base = resolveApiBase();
  // Normalize the path: ensure single leading slash + strip stray `/api`
  // prefix if a caller accidentally already added it.
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.toLowerCase().startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4); // remove "/api"
  } else if (normalizedPath.toLowerCase() === '/api') {
    normalizedPath = '';
  }
  return `${base}/api${normalizedPath}`;
}

/**
 * Test helpers (named export deliberate; no default).
 */
export const _internal = {
  trimTrailingSlash,
  stripTrailingApi,
  resolveApiBase,
  apiUrl,
} as const;
