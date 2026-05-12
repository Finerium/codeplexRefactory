# Contract: Hestia to Hades

**Edge type**: cross-wave (Wave 1 to Wave 3)
**Wave**: Wave 1 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:11 WIB

## Producer

**Worker**: Hestia (Wave 1)
**Domain**: Entry page execution at `frontend/app/start/page.tsx`. CTA "Connect GitHub ->" wired to OAuth handoff stub (Wave 1 placeholder URL chain). Hestia produces the frontend OAuth initiation surface that Wave 3 Hades replaces with real flow.

## Consumer

**Worker**: Hades (Wave 3)
**Domain**: FastAPI async scaffold + GitHub OAuth real flow (state CSRF + PKCE + scope minimization per PRD Section 19.3). Hades replaces Hestia's Wave 1 stub endpoint with real OAuth initiation + callback handler. Hades also owns webhook receiver + WebSocket setup (separate concern, see `hades-to-demeter.md`).

## Output schema (producer to consumer)

Hestia Wave 1 stub:

```typescript
// frontend/app/start/page.tsx (Hestia)
// CTA "Connect GitHub ->" onClick handler:
const handleImportRepository = () => {
  // Wave 1 stub: redirect to placeholder
  window.location.href = '/api/auth/github/start?stub=true';
};

// Stub endpoint (Hestia authors mock; Hades Wave 3 replaces)
// File: frontend/app/api/auth/github/start/route.ts (Wave 1 mock)
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isStub = url.searchParams.get('stub') === 'true';
  if (isStub) {
    // Wave 1 mock: redirect to fake consent page
    return NextResponse.redirect(new URL('/city?mock_auth=true', request.url));
  }
  // Wave 3 Hades real implementation replaces this branch
  return NextResponse.json({ error: 'OAuth not yet wired' }, { status: 501 });
}
```

Hades Wave 3 real implementation contract (replaces Wave 1 stub):

```python
# backend/app/api/auth.py (Hades)
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
import secrets
import hashlib

router = APIRouter(prefix="/api/auth")

@router.get("/github/start")
async def github_oauth_start(request: Request) -> RedirectResponse:
    """Initiates GitHub OAuth flow with PKCE + state CSRF.

    Returns 302 redirect to github.com/login/oauth/authorize with:
      - client_id (from env GITHUB_CLIENT_ID)
      - redirect_uri (https://duopoly.hackathon.sev-2.com/api/auth/github/callback)
      - scope (read:repo read:org read:issues read:pull_requests write:issues)
      - state (32-byte random, stored in HTTP-only cookie)
      - code_challenge (PKCE S256)
      - code_challenge_method (S256)
    """
    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = hashlib.sha256(code_verifier.encode()).digest()
    # Encode S256 base64url
    ...
    # Set state + verifier cookies (HTTP-only, secure, samesite=lax)
    response = RedirectResponse(url=oauth_url)
    response.set_cookie("oauth_state", state, httponly=True, secure=True, samesite="lax", max_age=600)
    response.set_cookie("oauth_verifier", code_verifier, httponly=True, secure=True, samesite="lax", max_age=600)
    return response


@router.get("/github/callback")
async def github_oauth_callback(request: Request, code: str, state: str) -> RedirectResponse:
    """Handles GitHub OAuth callback.

    Validates:
      - state cookie matches state query param (CSRF protection)
      - code_verifier cookie present (PKCE)
    Exchanges code for access token via POST to github.com/login/oauth/access_token.
    Persists token in encrypted session cookie + Demeter user record.
    Redirects to /city.
    """
    ...
```

Frontend session contract (Hades exposes to Hestia + Wave 2 panels):

```typescript
// frontend/lib/auth.ts (Hades Wave 3 authors; consumed by Hestia + Wave 2)
export interface SessionUser {
  githubLogin: string;
  githubId: number;
  avatarUrl: string;
  /** OAuth token NEVER exposed client-side; server-side only via HTTP-only cookie. */
  authenticated: true;
}

export interface SessionAnonymous {
  authenticated: false;
}

export type Session = SessionUser | SessionAnonymous;

/** Server Component helper to read session from cookies. */
export async function getSession(): Promise<Session>;

/** Client hook for session reactivity. */
export function useSession(): Session;
```

## Storage location

- Wave 1 Hestia stub: `frontend/app/api/auth/github/start/route.ts` (Next.js Route Handler stub)
- Wave 3 Hades real: `backend/app/api/auth.py` (FastAPI router); frontend routes proxy to backend via Next.js rewrite or direct fetch.
- Session cookie: HTTP-only `session_token` encoded JWT, signed with `SESSION_SECRET` env var.
- Token storage backend: PostgreSQL `users` table (Demeter Wave 3 authors schema, foreign-key referenced by Hades auth flow).

## Asumption baked

1. GitHub OAuth app created at Finerium account Wave 0 (Themis duty per Metis Section 5.1). Client ID + secret populated in `.env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`).
2. Redirect URI registered at GitHub OAuth app: `https://duopoly.hackathon.sev-2.com/api/auth/github/callback`. Dev redirect for local: `http://localhost:3000/api/auth/github/callback` (Themis registers both).
3. OAuth scopes minimal per PRD Section 19.3: `read:repo, read:org, read:issues, read:pull_requests, write:issues`. NOT `repo` (write code) or `admin:*`.
4. Session JWT signed by `SESSION_SECRET` (Themis generates Wave 0 + populates .env).
5. Hestia Wave 1 stub redirect `?mock_auth=true` query param signals demo mode; Wave 3 Hades route remove stub branch entirely (no fallback to mock in production).
6. Hades does NOT store OAuth refresh tokens (read-only scopes don't issue refresh tokens by GitHub policy). Token expiry handled by re-auth flow if expired.

## Validation steps

**Producer responsibility (Hestia)**:
- "Connect GitHub ->" CTA wired with onClick handler that navigates to `/api/auth/github/start?stub=true`.
- Wave 1 stub endpoint at `frontend/app/api/auth/github/start/route.ts` returns 302 to `/city?mock_auth=true`.
- Document stub endpoint in handoff to Hades: "Stub at `?stub=true` query param; remove stub branch in Wave 3 real impl."
- Network tab smoke test: click CTA, observe 302 redirect chain to `/city`.

**Consumer responsibility (Hades)**:
- Remove Wave 1 stub branch entirely; implement real OAuth start + callback at `backend/app/api/auth.py`.
- Validate state cookie matches state query param on callback (HTTP 400 if mismatch).
- Validate PKCE code_verifier on callback (HTTP 400 if missing).
- Exchange OAuth code for access token via POST to `https://github.com/login/oauth/access_token`.
- Persist user record via Demeter (`users` table); foreign-key from session JWT subject claim.
- Set HTTP-only session cookie + redirect to `/city`.
- Smoke test: browser flow start to callback completes; session cookie present; `/city` route loads with authenticated session.
- Refactory pre-provisioned domain `duopoly.hackathon.sev-2.com` validates against GitHub OAuth app registered redirect URI.

## Edge case handling

- OAuth state CSRF mismatch: Hades returns HTTP 400 "OAuth state mismatch, please retry" + redirect to `/start` with error param.
- Token exchange fails (GitHub down or rate-limited): Hades retries up to 2 times with exponential backoff, then returns HTTP 502 + redirect to `/start` with error.
- User denies OAuth consent: GitHub redirects to callback with `error=access_denied` query param. Hades displays "OAuth declined, you may try again or use Build from scratch flow." on `/start` page.
- Session cookie tampering: JWT signature verification fails on every request; tampered cookie returns 401 + clear cookie + redirect to `/start`.
- Multiple concurrent OAuth attempts same browser: each gets unique state cookie; only the latest valid state succeeds, others return CSRF mismatch.

## Open questions

- "Build from scratch" flow Wave 3 implementation status: PRD AD-15 marks as scope-cut candidate. Wave 1 Hestia stub redirects to placeholder `/blank` route; Wave 3 may keep as stub or drop-protocol if time pressure. Cross-reference `eunomia-wave1-audit.md` (Wave 1 audit gate verifies stub renders).
- Token refresh: GitHub OAuth tokens for read-only scopes do not expire by default. If user revokes app authorization on GitHub, next API call returns 401; Hades returns 401 to frontend + redirects to `/start` re-auth.

## Reference

- Metis Agentic Structure md Section 2 DAG: Hestia OAuth handoff stub consumed by Wave 3 Hades real OAuth flow
- Metis Section 5.2 Hestia ship criteria + Section 5.6 Hades ship criteria
- PRD Section 19 (Security) + Section 19.3 (OAuth scope minimization)
- PRD Section 18 (DeepSeek Integration) for env var conventions
- sourceoftruth Section 3.2 (GitHub OAuth pending Wave 0 state)
- Themis delegation Section 10 (Themis creates OAuth app at Finerium Wave 0)
