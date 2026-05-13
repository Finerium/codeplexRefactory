# Internal workflow proposal: Add Two-Factor Authentication to Login

> Folder B mirror of `openspec/changes/add-two-factor-authentication-to-login-3f7663/proposal.md`. Internal workflow agent layer; NOT panitia-facing. Pandora Wave 3 + Aletheia audit consume.

## What

Introduce a TOTP-based second factor step after primary credentials, modifying login UI, auth service, and user profile storage.

## Why this matters to the workflow agent

This proposal triggered the Refactor Mode simulation engine on 2026-05-13T02:16:33.607069+00:00. The agent layer records this so Aletheia audit can verify the 9-stage SimulationStage sequence completed.

## Workflow agent specific concerns

- `simulationId` = `add-two-factor-authentication-to-login-3f7663` (matches Folder A change name)
- Athena V4-Pro thinking high call recorded in Demeter `llm_call_log` table.
- Drafts isolation property AD-19 verified at write-time (see `backend/tests/test_drafts_isolation_smoke.py`).
