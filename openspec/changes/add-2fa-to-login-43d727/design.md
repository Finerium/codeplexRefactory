# Design: Add 2FA to login

> Technical approach plus alternatives considered. Authored by Athena (Refactor Mode) on 2026-05-12T14:57:19.424688+00:00.

## Approach

Athena V4-Pro thinking high routed via Triton client. Simulation engine 3-turn workflow:

- Turn 1 (V4-Pro think high): generate failing tests against the proposed module.
- Turn 2 (V4-Pro think high): generate implementation code that makes Turn 1 tests pass.
- Turn 3 (V4-Flash non-think): serialise the test plus impl changes into a unified diff.

Per PRD Section 18.6 + Phase B Topic 3c.

## Alternatives considered

1. **Single-turn generation**: rejected. V4-Pro think high benefits from explicit test-first prompting; single-turn output mixes test plus impl and tends to produce inconsistent test/impl pairs.
2. **Auto-apply diff on simulation completion**: rejected per PRD AD-19. Production code never changes by the simulation engine. Only the user-explicit Accept path materialises a downloaded diff (OQ-09).
3. **Multi-language simulation**: deferred. Wave 3 demo covers TypeScript / JavaScript (NodeGoat) + Python (PyGoat) only.

## Trade-offs

- **Cost**: 3 V4-Pro think high calls per simulation cost ~$0.05 to $0.20. Hafiz $5 budget covers 25 to 100 simulations.
- **Latency**: V4-Pro think high turns can take 5 to 15 seconds each. Total simulation ~30 to 60 seconds. Acceptable for the SAFETY-FIRST pitch beat ("AI explores in drafts; you commit to production").
- **Ghost position layout**: deterministic placement at x >= 65 outside the Iris treemap envelope. Cycle 2 polish: adopt a per-district adjacent-band placement if the 2D scrubber overlays the ghosts.

## drafts/ isolation safety property (AD-19 LOCKED)

The simulation engine writes ONLY under `drafts/add-2fa-to-login-43d727/`. The
guard at `backend/app/services/refactor/drafts_isolation.py` enforces
this via `pathlib.Path.resolve` plus a subpath check; escape attempts
raise `DraftIsolationViolation` before any filesystem write.

## DeepSeek reasoning_content quirk (Phase B Topic E)

Multi-turn coordination does NOT replay `reasoning_content` from prior
turns. The Triton client builder strips `reasoning_content` from
assistant messages before submitting subsequent turns; the Pandora
prompt builders also drop it defensively (see `prompts.py`).
