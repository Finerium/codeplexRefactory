# Internal workflow proposal: Add 2FA to login

> Folder B mirror of `openspec/changes/add-2fa-to-login-d17dca/proposal.md`. Internal workflow agent layer; NOT panitia-facing. Pandora Wave 3 + Aletheia audit consume.

## What

Introduce TOTP-based second factor on the login endpoint.

## Why this matters to the workflow agent

This proposal triggered the Refactor Mode simulation engine on 2026-05-12T20:21:36.136436+00:00. The agent layer records this so Aletheia audit can verify the 9-stage SimulationStage sequence completed.

## Workflow agent specific concerns

- `simulationId` = `add-2fa-to-login-d17dca` (matches Folder A change name)
- Athena V4-Pro thinking high call recorded in Demeter `llm_call_log` table.
- Drafts isolation property AD-19 verified at write-time (see `backend/tests/test_drafts_isolation_smoke.py`).
