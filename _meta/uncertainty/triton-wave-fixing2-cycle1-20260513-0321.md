# Uncertainty Journal: Triton Wave-Fixing #2 cycle 1

**Identity**: Triton (Wave-Fixing #2 cycle 1 rescue)
**Stamp**: 20260513-0321
**Bug scope**: Bug 8 T-1 x 5 (all 5 resident MOCK confirmed)
**Verdict bar**: HIGH (Manager-set: product pitch defensibility depends on real LLM dispatch)

---

## U-1: File-name vs symbol-name retention trade-off

**Confidence**: MEDIUM
**Concern**: The frontend chat module that previously held the Wave 2 mock is
still named `mockResidentResponses.ts` even though its body is now the real
SSE consumer. A future maintainer reading the file system would assume the
file is still a mock and might re-introduce a mock layer.

**Why I proceeded**: Renaming the file requires touching at least 2 import
sites (`index.ts`, `useChatRouting.ts`) plus any worktree state, which the
T-10h pre-submission budget cannot easily absorb. The module-level
docstring carries a clear `[WAVE-FIXING #2 CYCLE 1 Triton 20260513-0312, REAL
SSE WAVE 3 SWAP COMPLETE]` banner so a careful reader sees the truth. The
exported `STREAM_CHAT_MODE` constant flipped from `'mock-wave-2'` to
`'real-wave-3-sse'` for runtime assertions.

**Follow-up if budget allows post-submission**: rename file to
`realChatStream.ts` + update package `index.ts` re-export to point at the
new file. Out of scope for cycle 1.

---

## U-2: Canned safety-net retained as Layer 6, not removed

**Confidence**: HIGH
**Concern**: Manager spec says canned "HANYA aktif kalau real LLM fail." I
demoted canned from Layer 1 to Layer 6 (final fallback). I did NOT remove the
canned store entirely. Why? Because all-layers-fail scenarios still need a
user-visible response, and a domain-appropriate canned reply for the 10 top
demo questions is friendlier than a generic apology.

**Reasoning**: Manager spec separately states "Defensive layer maintain
(semantic cache + canned fallback + retry + circuit breaker)." Canned is part
of the defensive layer, just NOT first. New ordering reaches canned only
when (a) circuit breaker is OPEN with no canned match (apology rendered) or
(b) primary + retry + fallback-model all fail with a canned match available.
Both are end-of-chain. Frontend chat panel canned mock has been REMOVED for
production runtime per Manager spec.

---

## U-3: Production redeploy ownership (Atlas not Triton)

**Confidence**: HIGH
**Concern**: My fix is code-only. Live `/api/llm/health calls_recorded:0`
will remain until Atlas redeploys the new image (Atlas owns
`infra/k8s/` + `infra/docker/` per anti-collision matrix). I cannot prove
post-ship live verdict without Atlas redeploy in the same cycle.

**What I did instead**: Curl-verified that the existing deployed backend
DOES dispatch real LLM when the input does NOT match a canned keyword
(`/api/chat` Apollo + Athena queries returned full real-LLM responses, cost
$0.000143 accumulated in 2 calls). This proves the backend infrastructure
is operationally healthy. The frontend mock + canned-first ordering are the
two blockers I fixed. After Atlas redeploys, the curl evidence will close
the loop.

**Ferry trigger**: N/A. Manager spec explicit: Atlas re-deploy is the next
step after Triton ship. Handoff notes flag Atlas dependency.

---

## U-4: Demo latency expectations now 800-3000ms not 100ms

**Confidence**: MEDIUM
**Concern**: Manager spec is not explicit on whether the 100ms canned-hit
latency promise from PRD Section 18.5 is acceptable to drop. The reorder
necessarily trades canned-hit latency (sub-100ms) for real LLM latency
(800ms V4-Flash, 1500-3000ms V4-Pro think high).

**Why I proceeded HIGH confidence**: Manager spec is explicit on the
priority order: "Bug 8 T-1 x 5: All 5 resident REAL DeepSeek V4 dispatch
end-to-end. Verify routing live per PRD Section 18.3." Real dispatch is the
ship requirement. The 100ms canned-hit was a Phase B PRD aspiration; the
reality is real LLM voice differentiation per resident is the load-bearing
demo signal. Hafiz $5 budget + V4 75-percent-off pricing tolerate the live
dispatch cost for 24 hours of demo rehearsal.

**Risk**: Demo pitch flow may need a "thinking..." spinner UI affordance
for Athena V4-Pro responses (3000ms is long for a chat bubble). Persephone
ChatPanel already renders a streaming placeholder (`Resident is
thinking...` per `ChatPanel.tsx:217`) so this is covered.

---

## U-5: Hermes 4 tour variant naming alignment

**Confidence**: MEDIUM
**Concern**: PRD Section 9.1 uses user-facing query patterns (`"Give me 30-
second tour"`, `"Tour for sprint goal X"`, `"Tour for feature Y"`, `"Tour
as @username"`). Manager rescue spec uses slug-style ids
(`auth_district_tour`, `recent_changes_tour`, `hot_files_tour`,
`personal_ownership_tour`). Wave 2 Persephone mock used the slug-style ids.
The two namings describe the same 4 variants from different angles.

**Decision**: I used the slug-style ids in the Hermes persona expansion
since that matches (a) the Manager rescue spec verbatim, (b) the Wave 2
Persephone mock that already taught users to expect those slug names, (c)
Boreas tour DSL `TourVariant` enum at `backend/app/api/onboarding.py:35`
which uses `generic-30sec` / `sprint-goal` / `feature-scoped` / `cross-
onboarding` (similar kebab-case style).

**Risk if mis-aligned with Boreas**: Boreas's `/api/onboarding/narration`
endpoint accepts `tour_variant: TourVariant` with a different set of 4
literal strings. Hermes persona surfaces slug-style ids that do not match
the Boreas API enum. The user might ask Hermes "trigger auth_district_tour"
and Boreas would 422. Mitigation: Hermes only surfaces the slug as a UI
affordance label; the actual tour trigger goes through ChatPanel +
panelStore which calls Boreas with the correct `tour_variant` literal.
Cross-scope risk noted; not in my domain to reconcile.

---

## U-6: SSE wire format edge cases not in integration test

**Confidence**: MEDIUM
**Concern**: The frontend SSE parser handles chunked decode + trailing
partial buffer + `event: chunk` + `event: done`. Edge cases I did NOT cover
with unit tests (frontend has no Jest/Vitest scaffold):
- Server-sent comment lines (`: keep-alive` heartbeat).
- Multi-byte UTF-8 character split across chunks.
- `id:` and `retry:` SSE fields.

**Why I proceeded MEDIUM**: The Triton backend `/api/chat` endpoint emits
ONLY `event: chunk` + `event: done` records with simple JSON `data:` fields
+ no heartbeats. The `TextDecoder('utf-8', { stream: true })` handles
multi-byte split correctly per WHATWG spec. SSE comments are ignored by my
parser because I only extract `event:` and `data:` lines. If backend ever
adds heartbeats this code keeps working (the comment line yields a
parse-skip).

**Follow-up**: Pan post-Wave 3 demo rehearsal will produce evidence of any
SSE parse bug under real traffic.

---

## U-7: Cache primed from real-LLM responses may amplify cost

**Confidence**: HIGH
**Concern**: The new Layer 2 semantic cache stores real-LLM responses on
primary success. On a cold pod restart the cache is empty, so the first
demo run pays for every real-LLM call. After warm-up, similar queries hit
the cache and cost zero. Manager spec did not address cache warming.

**What I did**: No change. The cache behavior is correct (cosine 0.85
threshold from PRD Section 18.4). Demo rehearsal will warm it. Per
`/api/llm/health total_cost_usd` tracker, current Hafiz $5 budget has
~$4.999857 remaining ($0.000143 from cycle-1 smoke), so even a 100-call
cold demo is comfortably under budget.

---

## U-8: APP_ENV stayed `development` post-redeploy

**Confidence**: LOW-MEDIUM (advisory only)
**Concern**: `.env APP_ENV=development` means `is_production()` returns
False, so `_should_expose_cache_hit()` returns True and the SSE done
envelope surfaces a `cacheHit: bool` field. The intent of the C-9 cycle 1
fix was to wire-strip this field in production.

**Why advisory only**: Frontend mock previously set `cacheHit: false`
unconditionally in the bubble metadata. New SSE consumer relays the field
from backend if present. In development mode, the field IS present and
default false (semantic cache cold). The "cache hit" pill badge MessageList
might re-surface in dev but not in production. Atlas redeploy should set
`APP_ENV=production` in K8s deployment env vars or the `.env` file before
Pan ship.

**Out of scope for Triton**: Atlas owns deployment env vars per anti-
collision matrix.
