# Proposal: Add 2FA to login

> Authored by Athena (Refactor Mode) on 2026-05-12T20:21:36.102557+00:00. Folder A panitia-facing primary spec; mirror lives at `.agent-openspec/changes/add-2fa-to-login-31a9ca/` for the internal workflow agent layer.

## Why

Introduce TOTP-based second factor on the login endpoint.

## What changes

User intent (verbatim):

> I want to add 2FA to login.

Proposal summary: Introduce TOTP-based second factor on the login endpoint.

## Impact

- **Affected files** (1): `backend/app/security/auth.py`
- **Complexity**: moderate
- **Callsite count from parser pre-pass**: 0

## Ghost building hints

- **2FA verifier module** (generic-office)
  - Suggested path: `backend/app/security/two_factor.py`
  - Position: (68.0, 0.0, -22.0)
  - Footprint: 6.0 x 6.0 x 12.0
  - Connections: `backend/app/security/auth.py` (import)

## Out of scope

- The simulation engine writes ALL files under `drafts/add-2fa-to-login-31a9ca/`; production code is untouched until the user clicks Accept at the dual review gate.
- This proposal does NOT auto-create a PR. Per OQ-09, the Accept path returns a downloadable diff for manual apply.

## Open questions

- _None at proposal time. Add concerns to `_meta/uncertainty/pandora-cycle<N>-<timestamp>.md` if they surface during simulation._
