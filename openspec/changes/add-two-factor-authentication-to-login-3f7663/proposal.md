# Proposal: Add Two-Factor Authentication to Login

> Authored by Athena (Refactor Mode) on 2026-05-13T02:16:33.606386+00:00. Folder A panitia-facing primary spec; mirror lives at `.agent-openspec/changes/add-two-factor-authentication-to-login-3f7663/` for the internal workflow agent layer.

## Why

Introduce a TOTP-based second factor step after primary credentials, modifying login UI, auth service, and user profile storage.

## What changes

User intent (verbatim):

> add 2FA to login

Proposal summary: Introduce a TOTP-based second factor step after primary credentials, modifying login UI, auth service, and user profile storage.

## Impact

- **Affected files** (3): `src/features/login/login.component.ts`, `src/core/auth.service.ts`, `src/models/user.model.ts`
- **Complexity**: moderate
- **Callsite count from parser pre-pass**: 0

## Ghost building hints

- **Login component with 2FA challenge UI** (generic-residence)
  - Suggested path: `src/features/login/two-factor.component.ts`
  - Position: (68.0, 0.0, -22.0)
  - Footprint: 4.0 x 4.0 x 8.0
  - Connections: `src/core/auth.service.ts` (import), `src/models/user.model.ts` (reference)
- **Auth service extended with 2FA verification logic** (generic-warehouse)
  - Suggested path: `src/core/auth.service.ts`
  - Position: (78.0, 0.0, -22.0)
  - Footprint: 5.0 x 5.0 x 6.0
  - Connections: `src/models/user.model.ts` (reference)
- **User model with 2FA secret and enabled flag** (generic-office)
  - Suggested path: `src/models/user.model.ts`
  - Position: (88.0, 0.0, -22.0)
  - Footprint: 6.0 x 6.0 x 12.0
  - Connections: _(none)_

## Out of scope

- The simulation engine writes ALL files under `drafts/add-two-factor-authentication-to-login-3f7663/`; production code is untouched until the user clicks Accept at the dual review gate.
- This proposal does NOT auto-create a PR. Per OQ-09, the Accept path returns a downloadable diff for manual apply.

## Open questions

- _None at proposal time. Add concerns to `_meta/uncertainty/pandora-cycle<N>-<timestamp>.md` if they surface during simulation._
