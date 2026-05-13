# Internal workflow proposal: Integrate Two-Factor Authentication into Login

> Folder B mirror of `openspec/changes/integrate-two-factor-authentication-into-login-527062/proposal.md`. Internal workflow agent layer; NOT panitia-facing. Pandora Wave 3 + Aletheia audit consume.

## What

Add a second factor challenge to the existing login flow, requiring verification via authenticator app or SMS after password validation. This modifies the login page and auth service, introduces a verification component, and may require new user settings for 2FA enrollment.

## Why this matters to the workflow agent

This proposal triggered the Refactor Mode simulation engine on 2026-05-13T02:16:25.275057+00:00. The agent layer records this so Aletheia audit can verify the 9-stage SimulationStage sequence completed.

## Workflow agent specific concerns

- `simulationId` = `integrate-two-factor-authentication-into-login-527062` (matches Folder A change name)
- Athena V4-Pro thinking high call recorded in Demeter `llm_call_log` table.
- Drafts isolation property AD-19 verified at write-time (see `backend/tests/test_drafts_isolation_smoke.py`).
