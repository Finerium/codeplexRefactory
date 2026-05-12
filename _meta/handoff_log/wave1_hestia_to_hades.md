# Handoff: Hestia (Wave 1) to Hades (Wave 3)

**Date**: 2026-05-12 18:54 WIB
**Producer**: Hestia, Wave 1 Application Entry page executor
**Consumer**: Hades, Wave 3 FastAPI auth scaffold + real GitHub OAuth flow
**Contract**: `_meta/contracts/hestia-to-hades.md` (Pythia-locked Wave 0)

## Output produced (Hestia Wave 1)

### OAuth handoff stub endpoint

- **File**: `frontend/app/api/auth/github/start/route.ts`
- **Handler**: `GET`, Next.js 16 Route Handler
- **Behavior**:
  - Returns `NextResponse.redirect(new URL("/city?mock_auth=true", request.url), 302)`.
  - When inbound query has `?stub=true`, the redirect URL also carries `&stub=true` so downstream telemetry / Playwright snapshots can confirm the stub path traveled.
  - When no inbound query, the redirect carries only `mock_auth=true`.
  - Header comment includes `[STUB:]` label per Lock 5 plus reference to this handoff.
- **Smoke test results** (Hestia internal verification):
  ```
  GET /api/auth/github/start              -> 302, Location: /city?mock_auth=true
  GET /api/auth/github/start?stub=true    -> 302, Location: /city?mock_auth=true&stub=true
  ```

### Frontend CTA wiring

- **File**: `frontend/components/entry/EntryApp.tsx`
- **Wiring**: when the left window (Import a repository) finishes the 2.2 second door-open animation, `window.location.href = "/api/auth/github/start?stub=true"`. The CTA chip in the sill reads "Connect GitHub" verbatim per Designer Prompt 2 line 115.
- The right window (Build from scratch) navigates to `/blank` placeholder, NOT to the auth endpoint.

## What Hades replaces

Hades Wave 3 owns the real GitHub OAuth flow per PRD Section 19.3 (scope minimization) + Section 19.4 (data residency disclosure already on Hestia page).

Replacement actions:

1. **Remove the stub branch entirely** in `frontend/app/api/auth/github/start/route.ts`. Either delete the Next.js Route Handler (and proxy to FastAPI), OR rewrite it to forward to the FastAPI start endpoint.

2. **Implement real OAuth start** at `backend/app/api/auth.py` (FastAPI router). Per the locked contract `_meta/contracts/hestia-to-hades.md`:
   - Generate `state` = `secrets.token_urlsafe(32)` for CSRF.
   - Generate `code_verifier` = `secrets.token_urlsafe(64)` plus `code_challenge` = `hashlib.sha256(code_verifier.encode()).digest()` base64url for PKCE S256.
   - Build redirect URL to `https://github.com/login/oauth/authorize` with:
     - `client_id` from env `GITHUB_CLIENT_ID`
     - `redirect_uri` = `https://duopoly.hackathon.sev-2.com/api/auth/github/callback` (dev: `http://localhost:3000/api/auth/github/callback`)
     - `scope` = `read:repo read:org read:issues read:pull_requests write:issues` (NO `repo`, NO `admin:*`)
     - `state` (the CSRF token above)
     - `code_challenge` plus `code_challenge_method=S256`
   - Set HTTP-only cookies `oauth_state` + `oauth_verifier` with `secure=True, samesite="lax", max_age=600`.
   - Return `RedirectResponse(url=oauth_url, status_code=302)`.

3. **Implement callback** at `GET /api/auth/github/callback`:
   - Validate `state` cookie matches `state` query param (HTTP 400 if mismatch).
   - Validate `oauth_verifier` cookie present (HTTP 400 if missing).
   - Exchange `code` for access token via POST to `https://github.com/login/oauth/access_token` with `code_verifier` for PKCE proof.
   - Persist user record via Demeter (`users` table). Foreign-key references the session JWT subject.
   - Sign session JWT with `SESSION_SECRET` env var.
   - Set HTTP-only `session_token` cookie.
   - Redirect to `/city` (no `mock_auth` query).

4. **Frontend session helper** at `frontend/lib/auth.ts`:
   - `getSession(): Promise<Session>` Server Component reader.
   - `useSession(): Session` Client Component hook.
   - `Session = SessionUser | SessionAnonymous` discriminated union per the contract.

## What Hades preserves

- The `frontend/app/start/page.tsx` plus `frontend/components/entry/*` content stays. Hades only touches the route handler + adds the backend FastAPI auth router + the frontend session helper.
- The CTA copy "Connect GitHub" verbatim stays. Designer line 115 lock.
- The PrivacyNotice copy stays as-is. PRD Section 19.4 lock.
- Wave 3 should NOT alter the Hermes-removal Revision 1 nor the `animated-city` motion default Revision 2.

## Assumption baked (Hestia to Hades)

1. **GitHub OAuth app creation timing** (Themis open question U1 carryover): per Themis handoff `wave0_themis_to_wave1.md`, Atlas Wave 3 likely creates the OAuth app at Finerium account during K8s Secret population. Hestia's stub is purely client-side, no env var dependency. Hades must coordinate with Atlas for `GITHUB_CLIENT_ID` plus `GITHUB_CLIENT_SECRET` populated before Hades real flow goes live.
2. **`/city` route**: Wave 2 (likely Hera Sprint or Selene Activity / Health) authors `/city`. Hestia + Hades both redirect there; the destination is sibling-owned.
3. **`/blank` route**: PRD AD-15 scope-cut candidate. Hestia redirects there from the right window. Wave 3 may keep as stub or drop-protocol. Out of Hades scope unless Hades chooses to consolidate the build-from-scratch onboarding into the auth flow.
4. **Session storage**: Demeter Wave 3 schema includes `users` table per Themis ERD. Hades validates schema present before persisting.

## Validation needed by Hades

- [ ] Read this file plus `_meta/contracts/hestia-to-hades.md` at Wave 3 spawn.
- [ ] Confirm GitHub OAuth app `client_id` plus `client_secret` populated in env before going live. Coordinate with Atlas + Themis.
- [ ] Replace `frontend/app/api/auth/github/start/route.ts` per the contract.
- [ ] Author `backend/app/api/auth.py` per the contract.
- [ ] Author `frontend/lib/auth.ts` session helper per the contract.
- [ ] Smoke test browser flow: click `/start` Import CTA, traverse GitHub consent, land on `/city` with valid session cookie.
- [ ] Aletheia Wave 3 audit reads this handoff plus Hades output.

## Edge cases (locked contract reference)

Per `_meta/contracts/hestia-to-hades.md` "Edge case handling":

- OAuth state CSRF mismatch: HTTP 400 plus redirect to `/start?error=csrf`.
- Token exchange retry: 2 attempts exponential backoff plus HTTP 502 plus `/start?error=token_exchange`.
- User denies consent: `?error=access_denied` callback param plus `/start?error=declined`.
- Session cookie tampering: 401 plus clear cookie plus redirect `/start`.

Hestia stub does NOT exercise these paths. Hades implements them fresh.

## Ferry candidates from Hestia for V1 Orch awareness (zero HIGH bar)

None. Three medium-confidence observations surfaced in `_meta/uncertainty/hestia-cycle1-20260512-1854.md` for Eunomia plus V1 Orch but none escalate to Hades.

## Closing

Hestia ships the Wave 1 frontend OAuth initiation surface. Hades inherits the route handler file plus the CTA copy + the privacy notice copy, and replaces the stub branch with the real OAuth flow per Pythia-locked contract.

Bridge from Wave 1 frontend to Wave 3 backend is the 302 redirect chain. Hades preserves the visitor-facing surface, only the handler body changes.
