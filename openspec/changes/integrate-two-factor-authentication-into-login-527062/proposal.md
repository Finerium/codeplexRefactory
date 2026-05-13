# Proposal: Integrate Two-Factor Authentication into Login

> Authored by Athena (Refactor Mode) on 2026-05-13T02:16:25.274088+00:00. Folder A panitia-facing primary spec; mirror lives at `.agent-openspec/changes/integrate-two-factor-authentication-into-login-527062/` for the internal workflow agent layer.

## Why

Add a second factor challenge to the existing login flow, requiring verification via authenticator app or SMS after password validation. This modifies the login page and auth service, introduces a verification component, and may require new user settings for 2FA enrollment.

## What changes

User intent (verbatim):

> add 2FA to login

Proposal summary: Add a second factor challenge to the existing login flow, requiring verification via authenticator app or SMS after password validation. This modifies the login page and auth service, introduces a verification component, and may require new user settings for 2FA enrollment.

## Impact

- **Affected files** (5): `src/pages/LoginPage.tsx`, `src/services/authService.ts`, `src/store/authSlice.ts`, `src/types/user.ts`, `src/App.tsx`
- **Complexity**: moderate
- **Callsite count from parser pre-pass**: 0

## Ghost building hints

- **TwoFactorVerification component for the challenge step** (generic-residence)
  - Suggested path: `src/components/TwoFactorVerification.tsx`
  - Position: (68.0, 0.0, -22.0)
  - Footprint: 4.0 x 4.0 x 8.0
  - Connections: `src/pages/LoginPage.tsx` (reference), `src/services/authService.ts` (import)
- **TwoFactorSetup page for initial enrollment** (generic-residence)
  - Suggested path: `src/pages/TwoFactorSetupPage.tsx`
  - Position: (78.0, 0.0, -22.0)
  - Footprint: 4.0 x 4.0 x 8.0
  - Connections: `src/App.tsx` (reference), `src/services/authService.ts` (import)
- **Service for 2FA token verification and enrollment logic** (generic-warehouse)
  - Suggested path: `src/services/twoFactorService.ts`
  - Position: (88.0, 0.0, -22.0)
  - Footprint: 5.0 x 5.0 x 6.0
  - Connections: `src/services/authService.ts` (import), `src/store/authSlice.ts` (callsite)

## Out of scope

- The simulation engine writes ALL files under `drafts/integrate-two-factor-authentication-into-login-527062/`; production code is untouched until the user clicks Accept at the dual review gate.
- This proposal does NOT auto-create a PR. Per OQ-09, the Accept path returns a downloadable diff for manual apply.

## Open questions

- _None at proposal time. Add concerns to `_meta/uncertainty/pandora-cycle<N>-<timestamp>.md` if they surface during simulation._
