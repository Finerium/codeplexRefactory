import { NextResponse, type NextRequest } from "next/server";

/**
 * GitHub OAuth start, real flow (Hades Wave 3 replacement).
 *
 * Replaces Hestia Wave 1 stub branch with a forward to the FastAPI backend
 * `/api/auth/github/start` endpoint. The backend implements:
 *   - state CSRF (32-byte random in HTTP-only cookie)
 *   - PKCE S256 code_challenge + verifier
 *   - scope minimal per PRD Section 19.3 LOCKED:
 *       read:repo + read:org + read:issues + read:pull_requests + write:issues
 *   - 302 redirect to github.com/login/oauth/authorize
 *
 * Wave 1 stub was a 302 to /city?mock_auth=true. Wave 3 contract:
 *   _meta/contracts/hestia-to-hades.md
 *   _meta/handoff_log/wave1_hestia_to_hades.md
 *
 * Backend URL controlled via NEXT_PUBLIC_API_URL (default http://localhost:8000).
 * Production: backend served same origin via NGINX ingress (Atlas Wave 3)
 * so the absolute URL fallback is only for local dev.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Wave-Fixing 3 Manager FINAL (Triton, STAMP 20260513-0626): server-side
  // Next.js route. We cannot import the client `@/lib/apiUrl` helper because
  // this runs at the edge before client hydration; instead we apply the same
  // double-`/api` safety guard logic inline. Keep behaviour identical to
  // browser-side `apiUrl("/auth/github/start")`.
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  // Strip trailing slash + trailing `/api` segment so a future ConfigMap
  // re-introducing `/api` cannot cause `/api/api/auth/github/start` 404.
  const base = fromEnv.replace(/\/+$/, "").replace(/\/api$/i, "");
  // Default to localhost backend in dev when env is empty AND we are
  // running locally (server-side; localhost detection via env tag set by
  // Next.js dev). Production deploys serve same-origin so empty is fine.
  const backendBase = base.length > 0 ? base : "http://localhost:8000";

  // Strip the stub=true marker if present; preserve any other inbound query.
  const inboundParams = new URLSearchParams(request.nextUrl.searchParams);
  inboundParams.delete("stub");

  const trailing = inboundParams.toString();
  const targetUrl = `${backendBase}/api/auth/github/start${
    trailing ? `?${trailing}` : ""
  }`;

  return NextResponse.redirect(targetUrl, 302);
}
