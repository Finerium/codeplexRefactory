# Handoff Log: Hades Wave 3 to Nemesis Wave 3 (intra-wave)

**Edge**: intra-wave (Wave 3 internal, parallel-spawn batch)
**Contract**: `_meta/contracts/hades-to-nemesis.md` (locked Wave 0 Pythia)
**Date**: 2026-05-12 21:50 WIB
**Producer**: Hades (Wave 3, FastAPI foundation + tree-sitter parser)
**Consumer**: Nemesis (Wave 3, 5 Apollo detector + Argus CVSS + 5 spec-drift)
**Status**: Hades SHIP CLEAN, parser API surface stable for Nemesis cycle 2
consume.

## What Hades delivers

### ParserService Protocol satisfied (in-process import)

```python
from app.parsers import get_parser_service, ParsedRepo, ParsedFile, ParsedSymbol, Language
from pathlib import Path

svc = get_parser_service()  # singleton
parsed: ParsedRepo = await svc.parse_repo(Path("/path/to/nodegoat-fork"))
```

Schema parity verified:
- `ParsedSymbol` (name, kind, file_path, line_start/end 1-indexed,
  column_start/end 0-indexed, decorators list) per contract lines 35-48
- `ParsedFile` (file_path, language, line_count, symbols, imports, parse_error)
  per contract lines 51-62
- `ParsedRepo` (repo_root, files, languages_used, stats dict with total_files
  + total_loc + parse_errors + count_<language>) per contract lines 65-73
- `Language` Literal 12 members per contract lines 29-32

`parse_file(path)`: real impl via `tree_sitter_language_pack.process()`. Auto
language detection from `EXTENSION_TO_LANGUAGE` map (covers .ts, .tsx, .js,
.jsx, .mjs, .py, .pyi, .go, .java, .c, .h, .cpp, .cc, .hpp, .rs, .rb, .php,
.kt, .kts, .swift). Unsupported extension returns ParsedFile with parse_error
populated.

`parse_repo(repo_root, exclude_globs)`: real impl walks os.walk top-down,
prunes excluded dirs in-place (node_modules, .git, .venv, __pycache__, target,
dist, build, vendor, .next, coverage), concurrent file parse via
asyncio.Semaphore(16) per Pythia Asumption 1, aggregates ParsedRepo + stats.

### Scope narrow disclosed honestly (Lock 3 + Lock 5)

#### query_tree (tree-sitter query DSL execution): NOT IMPLEMENTED

Pythia contract `hades-to-nemesis.md` Section 'Output schema' lines 101-112
spec'd:

```python
async def query_tree(self, file_path: Path, query_source: str) -> list[dict]: ...
```

Hades cycle 1 raises `NotImplementedError` with explicit substitution-path
message. **Root cause**: tree-sitter-language-pack v1.8.0 Python binding does
NOT expose raw Tree nodes (process() returns ProcessResult only; pack.get_parser()
returns a Rust-native `builtins.Parser` object unsendable across threads
and without exposed `.parse()` method).

**Substitution path for Nemesis 5 Apollo detectors**:

1. **hardcoded-secret**: regex over file source (e.g., `(api_key|secret|password)\s*=\s*['\"][\w-]{20,}['\"]`).
   ParsedFile.parse_error already empty for production code; ParserService
   gives you line_count + symbol declarations for context.

2. **outdated-dependency**: parse `package.json` + `requirements.txt` +
   `Cargo.toml` etc as text + version compare. Not tree-sitter dependent.

3. **missing-auth**: walk `ParsedFile.symbols` for routes/handlers (kind=function
   with name matching common router patterns), then inspect file source via
   regex for missing `@require_session` / `auth_required` decorator. Process()
   already extracts `decorators` list per symbol when grammar supports it
   (Python @decorator captured into ParsedSymbol.decorators).

4. **unsafe-sql**: regex over file source for SQL-like strings concatenated
   with user input (`f"SELECT * FROM {user_input}"` or `cursor.execute("..." + var)`).
   ParserService gives you line numbers via parse_file scan.

5. **complex-untested**: walk ParsedFile.symbols to find function declarations,
   compute cyclomatic complexity via simple AST traversal (or count branches
   via regex `\b(if|elif|else|for|while|case|except)\b`), then check if a
   sibling test file exists (file_path replace `src/` -> `tests/test_`).

If Nemesis NEEDS true tree-sitter query DSL (e.g., for nested AST pattern that
regex cannot express cleanly), 3 fallback options:

a. Use `tree_sitter` PyPI package + per-language grammar binding (e.g.,
   `tree_sitter_python`, `tree_sitter_javascript`); install only the
   grammars Nemesis actually queries. PRD D17 still satisfied because the
   foundational scaffold uses tree-sitter-language-pack.
b. Use `process()` output's structure tree (StructureItem.children) for
   nested walks; less expressive than query DSL but covers most patterns.
c. Wait for tree-sitter-language-pack to add Tree exposure in a future
   release; ferry to V1 Orch if blocking.

Hades does NOT block Nemesis from option (a) - install whatever grammar
packages Nemesis needs to its own pyproject; cohabit with Hades's pack.

#### find_callsites: regex word-boundary fallback (not full AST analysis)

Implementation: `re.compile(r"\b" + escape(symbol_name) + r"\s*\(", MULTILINE)`
over file source. Captures positions but does NOT distinguish:
- function CALL vs function MENTION inside a string literal
- direct call `f()` vs method-style `obj.f()` vs static `Class::f()` (Rust)

Returns ParsedSymbol with `kind='method'` for the call use. Nemesis +
Pandora consumers should treat as best-effort; for the Health Mode + Refactor
Mode demo flow this is sufficient (per PRD SC-04 acceptance is "no mid-run
recovery", not perfect callsite precision).

### Building event integration (cross-edge with Hera Wave 2)

Hades's webhook receiver translates GitHub webhook payload to 14-event
BuildingEvent union and publishes to `event_bus` topic `'building_events'`.
Nemesis can SUBSCRIBE to this topic for live-fire detector triggers on PR
events:

```python
from app.services.event_bus import get_event_bus
bus = get_event_bus()
async with bus.subscribe("building_events") as q:
    while True:
        event = await q.get()
        if event is bus.shutdown_sentinel:
            break
        if event["type"] == "pr.opened":
            files = event["payload"].get("filesChanged", [])
            # run detectors on changed files
```

Topic `'finding_events'` reserved for Nemesis-to-Asclepius push. Nemesis can
publish via `bus.publish("finding_events", finding_dict)` and Asclepius
WebSocket subscriber `/api/ws/finding-events` automatically fans out.

### Demeter persist (cross-edge with Demeter Wave 3)

For Nemesis findings persistence to `finding_events` table (Demeter Wave 3
SQLAlchemy schema), Nemesis calls Demeter via:

```python
from app.services.demeter_service import get_demeter_service
demeter = get_demeter_service()
# Demeter Wave 3 will extend the service with persist_finding method
```

Hades's `DemeterServiceProtocol` covers `upsert_user` + `persist_pr_event`
only. Demeter Wave 3 cycle 2 extends Protocol with `persist_finding` (Nemesis
authors that interface in `_meta/contracts/nemesis-to-demeter.md` already
locked Wave 0).

## What Nemesis cycle 1 + 2 needs to do

### Cycle 1 (stub-and-sync)

- [ ] Read this handoff + `_meta/contracts/hades-to-nemesis.md`
- [ ] Read scope-narrow Section above
- [ ] Decide per-detector: regex vs process() output vs install
      `tree_sitter_python` PyPI for true query DSL
- [ ] Author 5 detector module stubs at `backend/app/services/detectors/*.py`
      with locked input/output signatures
- [ ] Smoke test: parse NodeGoat fork via Hades parser, verify ParsedFile
      symbols + imports populated

### Cycle 2 (full impl)

- [ ] Real 5 Apollo detector impl per scope-narrow substitution paths
- [ ] Argus CVSS scoring via Triton V4-Flash thinking low (Triton client
      already shipped, import via `app.services.llm_client` or
      `app.llm.types`)
- [ ] WebSocket push findings via `bus.publish("finding_events", ...)`
- [ ] Persist findings via Demeter `persist_finding` (await Demeter cycle 2)
- [ ] Smoke test: 5/5 detectors fire on NodeGoat fork (Aletheia audit gate
      lines 65-69)

## Test fixtures

Hades ships `backend/tests/test_parser_smoke.py` covers parse_file Python +
TypeScript + H3 cold-start + parse_repo aggregation + query_tree raise +
find_callsites regex.

Nemesis can pattern-match own tests against same fixtures. Verify
`pytest backend/tests/` exit 0 after Nemesis spawn cycle 1.

## Acceptance criteria (Aletheia Wave 3 audit gate verifies)

- [ ] Nemesis parse NodeGoat fork end-to-end via Hades parser
- [ ] 5/5 Apollo detector fires (substitution path documented)
- [ ] Argus CVSS scoring per finding
- [ ] WebSocket push to `/api/ws/finding-events` < 1 second after detector
      completion
- [ ] Findings persist to Demeter `finding_events` table

## Ferry to V1 Orch

NOT triggered. If Nemesis surfaces a detector pattern that cannot be
expressed via the substitution paths above (regex + process() output +
optional tree_sitter PyPI), ferry to V1 Orch with reference to the failing
detector + an example AST pattern needed.

## Closing

Hades parser API stable + tested. Scope narrow on `query_tree` documented
honestly per Lock 3 + Lock 5. find_callsites regex fallback documented as
medium-precision approximation. Nemesis cycle 1 can begin immediately,
parallel with remaining Wave 3 workers.
