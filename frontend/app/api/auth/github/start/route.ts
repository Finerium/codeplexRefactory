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
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

  // Strip the stub=true marker if present; preserve any other inbound query.
  const inboundParams = new URLSearchParams(request.nextUrl.searchParams);
  inboundParams.delete("stub");

  const trailing = inboundParams.toString();
  const targetUrl = `${backendBase}/api/auth/github/start${
    trailing ? `?${trailing}` : ""
  }`;

  return NextResponse.redirect(targetUrl, 302);
}
