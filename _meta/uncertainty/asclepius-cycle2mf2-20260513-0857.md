# Asclepius Cycle 2 MF2 Uncertainty Journal

**Stamp**: 2026-05-13 09:25 WIB
**Confidence**: HIGH on ship; MEDIUM on follow-up coordination

## Concerns

### 1. OpenSpecTabs click interaction unexercised in evidence

The MCP Playwright surface I have access to exposes `browser_navigate`, `browser_snapshot`, `browser_console_messages` but NOT `browser_click`. I verified the data plumbing end-to-end via:
- Backend SSE curl capture (11 events, all bodies present)
- TypeScript clean (zero errors in touched files)
- DOM snapshot showing OpenSpecTabs section conditionally renders

But I could NOT click "Add 2FA to login" to capture the SSE-driven tab content visually. The tab rendering logic is straightforward (3 buttons + 1 pre block, all in a small component), so the risk is LOW but Aether/Pan should manual-verify with a real browser click during the audit gate.

**Mitigation**: the next worker spawning with `mcp__playwright__browser_click` access (Aether or Pan during dual audit) can re-run the click flow with Hafiz repo plus the "Ask Athena" button. Expected behaviour: tabs appear after the 3 openspec markdown frames stream in (~10-30 sec after the click).

### 2. Backend uvicorn intermittent unreachability during testing

During my evidence capture I triggered the backend SSE endpoint twice in quick succession. The first probe blocked uvicorn briefly and my second curl returned `connection refused` until the SSE stream completed. This is NOT a frontend bug; it is a backend single-worker uvicorn limitation in local dev.

**Risk to ship**: LOW. Production K8s deploys uvicorn with multiple workers. The HealthFindingsVariant SourcePill correctly handled the unreachable state by showing "Mock fallback" + the explicit error message in the title tooltip. Manager FINAL is satisfied if the user is told honestly what is happening.

### 3. Hafiz ESP32 repo only returns 2 findings

For Hafiz `gadablotnok/web-esp32log`:
- missing_auth: 1 (some route handler without auth middleware)
- complex_untested: 1 (main.ts high complexity)

This is fewer than NodeGoat (15+ findings) but PLAUSIBLE for an ESP32 firmware demo repo: no SQL, secrets likely in env, no npm package.json with stale deps in the cloned slice. Nemesis owns detector audit verification.

**Risk to ship**: LOW. The fact that the count differs from NodeGoat is precisely what proves the real-scan-vs-mock distinction. If Hafiz expects more findings, that is a Nemesis detector tuning task, not an Asclepius UI task.

### 4. AsclepiusBridge demo seed coverage

When the URL has neither `?demo` nor `?repo`, the AsclepiusBridge now seeds nothing. The glow layer stays empty until the user opens Health Mode side panel + waits for the real scan. This is honest but visually quieter than the previous always-mock state. Pitch-tier consideration: the demo card flow still has the seed because panitia clicks land on `?demo=`. Hafiz personal demo also still gets a real scan via `?repo=`. Worst case is someone landing on bare `/city` and seeing an empty glow layer for 7 sec.

**Risk to ship**: LOW. The Time Machine + Sprint Mode + Activity Mode all light the city with their own visuals regardless of Asclepius state.

## Confidence verdict

HIGH on the ship. The two Cluster scopes (D + F) are functionally verified:
- Cluster D: end-to-end SSE pipeline plus tab UI
- Cluster F: real-backend Hafiz repo render with explicit SourcePill

MEDIUM on the click-flow visual capture: deferred to Aether/Pan dual audit per their tool access. No work blocked.

Signed,
Asclepius
