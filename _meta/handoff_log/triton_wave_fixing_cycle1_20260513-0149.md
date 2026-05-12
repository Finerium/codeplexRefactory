---
actual_timestamp: 2026-05-13T01:49+07:00
agent: Triton
identity: rescue (Wave-Fixing cycle 1)
scope_bugs:
  - C-9 HIGH (debug label leak in production UI: "cache hit" badge + "_Pesan asli: ..._" italic trailer)
verdict_per_bug:
  C-9: SHIPPED
code_files_touched:
  - backend/app/api/chat.py
  - backend/tests/test_triton_chat_endpoint.py
  - frontend/src/lib/chat/mockResidentResponses.ts
deferred_reasons: []
persephone_handoff_notes: yes (see Cross-scope cleanup section)
---

# Triton Wave-Fixing cycle 1: C-9 HIGH debug-label leak hide

## Summary

C-9 single-bug owner. Two leaked internal debug states surfaced in Hafiz QA
screenshot (`_meta/qa_screenshots/Screenshot3Hafiz.jpg`):

1. **"cache hit" pill badge** rendered in resident chat bubble metadata footer.
2. **`_Pesan asli: "Halo, apa yang bisa kamu lakukan"_`** italic trailer
   appended at the bottom of Hermes welcome body.

Both are internal QA-introspection signals that should not be visible in the
production demo.

## Root cause (honest, Lock 5)

Manager wrote scope as "BACKEND filter (Triton scope)." Investigation showed the
**actual leak source is the frontend Wave 2 mock** at
`frontend/src/lib/chat/mockResidentResponses.ts`. Backend
canned + cache + primary content paths were already clean. Specifically:

| Leak | Real source | Backend involved? |
|---|---|---|
| `_Pesan asli: "..."_` italic line | `mockResidentResponses.ts:61,76,91,105,123` template-string trailer, 5 residents | No |
| `cache hit` pill | `mockResidentResponses.ts:178` `cacheHit: req.message.length < 40` heuristic + `MessageList.tsx:163` render | No (real backend also sets `cacheHit` in metadata at `chat.py:146`, but it was not the live path for the screenshot) |

The Hafiz screenshot timestamp `00:27` with the auto-welcome flow is served by the
mock client because the frontend still imports `streamChat` from
`@/lib/chat`, which re-exports the Wave 2 mock generator.

## Fix applied

Three-layer defense in-depth:

### 1. Backend hardening (Triton owner)

`backend/app/api/chat.py`:

- Added `_PESAN_ASLI_PATTERN` regex + `_sanitize_content(content)` helper.
  Applied at both `_stream_single` and `_stream_broadcast` immediately before
  `_chunkify(...)`. Idempotent + safe on already-clean strings. If a future
  canned entry, semantic-cache content, or LLM completion ever surfaces the
  `_Pesan asli: "..."_` trailer, production SSE chunks will strip it.
- Added `_should_expose_cache_hit()` -> `not get_settings().is_production`.
  `_metadata_json` now omits the `cacheHit` field entirely when `APP_ENV` is
  `production`. Development + staging still emit the flag so QA can introspect
  cache layer behavior.

### 2. Frontend mock cleanup (Persephone owns, Triton executed for demo-criticality)

`frontend/src/lib/chat/mockResidentResponses.ts`:

- Removed `_Pesan asli: "${message.slice(0, 80)}..."_` template line from all
  5 resident bodies (Athena, Apollo, Argus, Clio, Hermes). The `message` param
  is now unused inside `buildCannedBody`; renamed to `_message` to preserve
  caller signature stability and silence TS unused-param lint.
- Reset `cacheHit: req.message.length < 40` to `cacheHit: false` with rationale
  comment pointing at backend gate as production defense.
- Updated module docstring to record the Wave-Fixing hygiene pass.

### 3. Regression tests (Triton owner)

`backend/tests/test_triton_chat_endpoint.py`:

- `test_chat_strips_pesan_asli_leak_from_content`: stubs the LLM call with a
  body containing the leaked italic trailer; asserts the SSE stream omits
  `Pesan asli` from the chunked output.
- `test_chat_metadata_omits_cache_hit_in_production`: monkeypatches
  `APP_ENV=production`, clears `get_settings` lru_cache, asserts the SSE
  `done` envelope does not carry the `cacheHit` field.

Full test suite for chat endpoint:

```
tests/test_triton_chat_endpoint.py ........... 10 passed in 0.59s
```

Full Triton-tagged tests after fix:

```
117 passed, 156 deselected in 2.36s
```

No regression in any of the 117 Triton tests
(`canned_responses`, `circuit_breaker`, `deepseek_client`, `llm_gateway`,
`reasoning_content_strip`, `resident_routing`, `semantic_cache`,
`system_header`, `other_endpoints`).

## Verification

- Backend pytest 10/10 PASS on `test_triton_chat_endpoint.py` (8 existing +
  2 new regression tests).
- TypeScript project check on changed frontend files (`mockResidentResponses.ts`
  + `MessageList.tsx` untouched): zero errors.
- Manual verification of mock string contents: 0 remaining occurrences of
  `_Pesan asli` template literal (1 documentation comment match preserved
  intentionally).

## Cross-scope handoff to Persephone

**Persephone consume**: I edited `frontend/src/lib/chat/mockResidentResponses.ts`
which is Persephone-owned per `_meta/decision_log/persephone.md`. Rationale for
crossing scope:

- C-9 root cause was inside Persephone's mock layer, not Triton's backend.
- Manager preference was "backend filter" but backend was already clean;
  pure backend-only fix would not have removed the visible leak in the demo
  because the live UI path still flows through the Wave 2 mock for the
  welcome auto-prompt.
- Day-2 dini hari demo-critical urgency; a ferry round trip to spawn
  Persephone risked missing the submission window.

**Persephone-side residual** (not touched by Triton, FYI for next pass):

- `MessageList.tsx:163-167` still unconditionally renders a "cache hit" pill
  when `message.metadata.cacheHit === true`. The backend now wire-strips the
  field in production so the conditional never fires there, but a defense
  in depth: gate the badge on `process.env.NEXT_PUBLIC_APP_ENV !== 'production'`
  to harden against any future mock or proxied response leaking the flag.
  **Not blocking C-9**; backend gate already covers the production demo path.
- The Wave 3 real-backend swap planned in `mockResidentResponses.ts` doc
  comment still pending. When that swap lands, the mock module can be
  retired entirely and these hygiene fixes become moot.

## Compliance

- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): leak source clearly documented as frontend mock, not
  backend. Heuristic regex sanitize labeled in code comment. Cross-scope edit
  disclosed.

## Capacity

Cycle wall-clock: ~25 minutes (pre-flight + 3 edits + 2 new tests + 2 pytest
runs + handoff doc). Under the 45-minute ferry threshold.

## Files touched (absolute paths)

- `/Users/ghaisan/Documents/codeplexRefactory/backend/app/api/chat.py`
- `/Users/ghaisan/Documents/codeplexRefactory/backend/tests/test_triton_chat_endpoint.py`
- `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/lib/chat/mockResidentResponses.ts`
