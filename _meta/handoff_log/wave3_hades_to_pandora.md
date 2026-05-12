# Handoff Log: Hades Wave 3 to Pandora Wave 3 (intra-wave)

**Edge**: intra-wave (Wave 3 internal, parallel-spawn batch)
**Contract**: `_meta/contracts/hades-to-pandora.md` (locked Wave 0 Pythia)
**Date**: 2026-05-12 21:50 WIB
**Producer**: Hades (Wave 3, FastAPI foundation + tree-sitter parser)
**Consumer**: Pandora (Wave 3, Athena proposal author + simulation engine +
              OpenSpec change folder + drafts isolation)
**Status**: Hades SHIP CLEAN. Pandora parallel-spawn already shipped cycle
1 + 2 (`backend/app/services/refactor/*`). Hades parser API + WebSocket
`/api/ws/refactor-events` + Demeter stub all wired to support Pandora's
analyze_intent + drafts verify + ghost-to-solid event publish path.

## What Hades delivers for Pandora consume

### ParserService (in-process import, identical surface to Nemesis)

```python
from app.parsers import get_parser_service, ParsedFile, ParsedRepo, ParsedSymbol
from pathlib import Path

svc = get_parser_service()  # singleton, same instance Nemesis uses
parsed: ParsedRepo = await svc.parse_repo(Path("/path/to/repo"))

# Pandora's primary methods per `hades-to-pandora.md` Section 'Schema specifics':
#   parser.find_callsites(repo_root, symbol_name, language=None) -> list[ParsedSymbol]
#   parser.parse_file(path) -> ParsedFile  (drafts verify per Pythia line 51)
#   parser.query_tree(path, query) -> NotImplementedError (see scope narrow)
```

`parse_file` real impl via tree-sitter-language-pack process(). Pandora's
`verify_draft_syntax(drafts_dir)` uses `asyncio.gather` over all files in
drafts_dir; any ParsedFile with `parse_error` populated signals simulation
engine produced invalid code.

`find_callsites` is regex word-boundary fallback (see Nemesis handoff for
details). For Pandora's `analyze_intent` impact assessment, this is
sufficient because the LLM-driven file identification (Athena V4-Pro think
high) already shortlists candidate symbols; find_callsites only needs to
rank by proximity rather than enumerate exhaustively.

### Drafts isolation safety (AD-19 LOCKED) cross-check

Pandora cycle 1 already shipped `backend/app/services/refactor/drafts_isolation.py`
with `DraftIsolationViolation` raised on any of 5 attack vectors. Hades
ParserService respects this by reading files only when the explicit
file_path argument is provided; never writes inside drafts/ directory.
ParserService is read-only on the filesystem.

For Pandora's `verify_draft_syntax(drafts_dir)` flow:

```python
from app.services.refactor.drafts_isolation import simulation_dir
from app.parsers import get_parser_service

draft_dir = simulation_dir(simulation_id="sim-2fa-001")  # resolves to drafts/sim-2fa-001/
parser = get_parser_service()
parsed_drafts = await asyncio.gather(*[
    parser.parse_file(f)
    for f in draft_dir.rglob("*")
    if f.is_file() and is_supported_extension(f)
])
# Pandora inspects each ParsedFile.parse_error to gate Turn 2 + Turn 3
```

### WebSocket refactor-events channel (Pandora produces)

Pandora's simulation engine publishes 9-stage SimulationEvent to event_bus
topic `'refactor_events'`:

```python
from app.services.event_bus import get_event_bus
bus = get_event_bus()
await bus.publish("refactor_events", {
    "type": "simulation.stage",  # or "ghost_building.appear" etc
    "simulationId": "sim-2fa-001",
    "stage": "test_gen",  # one of 9 stages per Asclepius Wave 2 enum
    "timestamp": "2026-05-12T21:50:00+00:00",
    "payload": {...}
})
```

Asclepius Wave 2's WebSocket subscriber at `/api/ws/refactor-events` (Hades
endpoint) automatically fans out to all subscribed frontend clients. Pandora
does NOT manage the WebSocket lifecycle; just publishes to event_bus.

### OAuth + user identity (cross-edge)

Pandora's OpenSpec change folder author may want to attribute proposals to
the authenticated user. Hades exposes session via:

```python
from app.services.auth_session import verify_session_jwt, SessionClaims

# In a FastAPI handler:
async def my_handler(session: dict = Depends(require_session)):
    user_login = session["github_login"]
    if not session["is_authenticated"]:
        # anonymous user, attribute as "demo-user"
        ...
```

`require_session` FastAPI dependency was added by Triton Wave 3 parallel-ship
to `backend/app/services/auth_session.py`; it returns an open anonymous
session in dev mode and authenticated claims when cookie+JWT valid. Hades
cycle 2 (if needed) hardens to 401 reject.

### Demeter persist (for proposal records)

Hades's Demeter stub covers `upsert_user` + `persist_pr_event`. Pandora's
proposal records persist to the `proposals` table (Demeter Wave 3 SQLAlchemy
schema). Demeter Wave 3 cycle 2 extends Protocol with `persist_proposal`.
Pandora calls:

```python
from app.services.demeter_service import get_demeter_service
demeter = get_demeter_service()
# Demeter cycle 2 method: await demeter.persist_proposal(proposal_record)
```

## Scope narrow disclosed (Lock 3 + Lock 5)

Same as Nemesis handoff: `query_tree` raises NotImplementedError. Pandora's
`analyze_intent` uses LLM (V4-Pro think high via Triton) for symbol
identification; the parser confirmation step uses ParsedFile.symbols list
+ ParsedRepo.files list. No tree-sitter query DSL execution needed in the
canonical Pandora flow.

If Pandora's later impl needs more precise callsite ranking (e.g., for
proposal complexity estimation), 3 options:
a. Inspect ParsedFile.symbols + imports for declaration vs use
b. Combine find_callsites regex + line-by-line context inspection
c. Install `tree_sitter` + per-language grammar PyPI packages independently

## What Pandora has already shipped (parallel observation)

Per filesystem scan at 21:50 WIB:

- `backend/app/services/refactor/__init__.py` (re-exports types module)
- `backend/app/services/refactor/types.py` (9-stage SimulationStage enum
  + GhostBuildingHint + SimulationEvent + RefactorProposalEvent +
  ProposalStage + ProposalContext + RefactorProposal)
- `backend/app/services/refactor/drafts_isolation.py` (AD-19 safety property
  + 5 attack vector reject + DraftIsolationViolation exception)
- `backend/app/services/refactor/proposal_author.py` (Athena LLM-driven intent
  to ghost building hint + OpenSpec change folder generator dispatch)
- `backend/app/services/refactor/prompts.py` (system prompts)
- `backend/app/services/refactor/llm_stub.py` (Triton stub bridge)
- `backend/tests/test_drafts_isolation_smoke.py` (5/5 attack vector tests)
- `backend/tests/test_refactor_types_smoke.py` (Pydantic round-trip)
- `backend/tests/test_simulation_engine_smoke.py` (7 E2E tests)

All Pandora tests PASS in shared backend pytest run (125/125 total).

## What Pandora cycle 2-N may still need from Hades

Hades is single-cycle ship. If Pandora discovers a need for parser surface
extension (e.g., specific symbol type Pandora wants but isn't in
ParsedSymbol.kind Literal), ferry to V1 Orch with the explicit need;
ParserService can be extended without breaking existing callers.

## Acceptance criteria (Aletheia Wave 3 audit gate verifies)

- [ ] Pandora `analyze_intent` round-trips Hades parser per NodeGoat fork
      2FA proposal use case (Aletheia audit lines 82-86)
- [ ] Drafts/ isolation safety property: production code NEVER changed by
      simulation (verify drafts/<sim_id>/ paths only)
- [ ] Dual review gate Accept downloads diff (no PR create per OQ-09)
- [ ] Dual review gate Discard cleans drafts/<sim_id>/ recursively

## Ferry to V1 Orch

NOT triggered. Pandora + Hades both shipped clean in parallel batch; surface
contract stable.

## Closing

Parser API + Demeter stub + event_bus topic + WebSocket fanout all wired to
support Pandora's complete simulation engine flow. Lock 3 + Lock 5 scope
narrow on query_tree documented; substitution paths sufficient for Pandora's
LLM-driven flow.
