import { NextResponse, type NextRequest } from "next/server";

/**
 * Hestia Wave 1 OAuth handoff stub.
 *
 * Returns a 302 redirect to /city?mock_auth=true. This is a deliberate
 * placeholder consumed by the Entry page CTA "Connect GitHub". Wave 3 Hades
 * replaces the body of this handler with the real GitHub OAuth start flow
 * (state CSRF + PKCE + minimal scopes per PRD Section 19.3).
 *
 * Contract:
 *   _meta/contracts/hestia-to-hades.md (Wave 1 producer to Wave 3 consumer)
 *
 * Stub recognition: the query param ?stub=true makes the placeholder origin
 * explicit in dev tools + Playwright smoke tests. The handler honors any
 * inbound query (stub=true or absent) and always redirects in Wave 1 so the
 * frontend CTA stays click-through without a real OAuth app yet.
 *
 * [STUB: real GitHub OAuth start flow handled by Hades Wave 3 backend
 * FastAPI router at backend/app/api/auth.py]
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const redirectUrl = new URL("/city", request.url);
  redirectUrl.searchParams.set("mock_auth", "true");

  // Preserve the inbound stub marker so downstream consumers (e.g. Eunomia
  // audit, Playwright snapshot) can confirm the path traveled.
  const inboundStub = request.nextUrl.searchParams.get("stub");
  if (inboundStub === "true") {
    redirectUrl.searchParams.set("stub", "true");
  }

  return NextResponse.redirect(redirectUrl, 302);
}
