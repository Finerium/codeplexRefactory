# Contract: Hades to Pandora

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:53 WIB

## Producer

**Worker**: Hades (Wave 3)
**Domain**: Same parser service as `hades-to-nemesis.md` (FastAPI + tree-sitter 11-language lazy-load + symbol queries + callsite finder). Hades's parser is shared infrastructure consumed by both Nemesis (batch repo scan for detection) and Pandora (selective file query for proposal author + simulation engine).

## Consumer

**Worker**: Pandora (Wave 3)
**Domain**: Athena proposal author (V4-Pro thinking high) + OpenSpec change folder generator (Folder A) + Refactor Mode simulation engine multi-turn + drafts/ isolation. Pandora consumes Hades parser for: (1) identifying affected files when user states intent, (2) finding callsites to assess change impact, (3) parsing draft files written by simulation engine to verify syntax validity.

## Output schema (producer to consumer)

Pandora uses the same `ParserService` interface from `hades-to-nemesis.md` but emphasizes different methods.

```python
# Pandora's usage pattern, from backend/app/services/proposal_author.py
from app.parsers import get_parser_service, ParsedFile, ParsedSymbol
from app.services.simulation_engine import SimulationEngine


class ProposalAuthor:
    """Athena's voice. Authors refactor proposals using DeepSeek V4-Pro think high."""

    def __init__(self):
        self.parser = get_parser_service()

    async def analyze_intent(
        self,
        user_intent: str,
        repo_root: Path,
    ) -> ProposalContext:
        """Maps user intent to affected files + dependency graph.

        Steps:
        1. Parse repo (or use cached ParsedRepo).
        2. LLM call (V4-Pro think high) to identify symbols/files matching user intent.
        3. For each candidate symbol, call parser.find_callsites() to assess impact.
        4. Generate ghost building hints for new files implied.
        Returns ProposalContext with affected_files, callsites, ghost_hints.
        """
        ...

    async def verify_draft_syntax(
        self,
        drafts_dir: Path,
    ) -> list[ParsedFile]:
        """After simulation engine writes drafts, verify each parses cleanly.

        Uses parser.parse_file() per draft file.
        Returns list of ParsedFile; any with parse_error populated signals simulation engine produced invalid code.
        """
        return await asyncio.gather(*[
            self.parser.parse_file(f) for f in drafts_dir.rglob("*")
            if f.is_file() and is_supported_extension(f)
        ])
```

Schema specifics Pandora cares about (subset of full ParserService):

```python
# Pandora's primary methods used from ParserService

# 1. Find affected files for user intent (after LLM identifies candidate symbols)
async def find_callsites(
    self,
    repo_root: Path,
    symbol_name: str,
    language: Language | None = None,
) -> list[ParsedSymbol]: ...

# 2. Parse single file (drafts verification)
async def parse_file(self, file_path: Path) -> ParsedFile: ...

# 3. Query AST for specific pattern (used by simulation engine to assess change impact)
async def query_tree(
    self,
    file_path: Path,
    query_source: str,
) -> list[dict]: ...
```

ProposalContext schema Pandora produces (consumed by simulation engine in same Pandora module):

```python
class GhostBuildingHint(BaseModel):
    ghost_id: str
    position: tuple[float, float, float]
    archetype: Literal["generic-residence", "generic-warehouse", "generic-office"]
    width: float
    height: float
    depth: float
    connections: list[dict]  # { target_building_id, relationship }
    label: str
    suggested_file_path: str


class ProposalContext(BaseModel):
    user_intent: str
    affected_files: list[str]
    callsite_count: int
    ghost_hints: list[GhostBuildingHint]
    /** OpenSpec change folder relative path Pandora will create. */
    openspec_change_path: str
    /** Estimated complexity (informs simulation engine turn budget). */
    complexity: Literal["simple", "moderate", "complex"]
```

## Storage location

- Parser service shared: `backend/app/parsers/__init__.py` (Hades; same as `hades-to-nemesis.md`)
- Pandora consumer: `backend/app/services/proposal_author.py` + `backend/app/services/simulation_engine.py`
- Drafts directory: `drafts/<simulation_id>/` (Pandora writes; ParsedFile verification reads back)
- OpenSpec change folder: `openspec/changes/<simulation_id>/` (Pandora writes proposal.md + design.md + tasks.md)

## Asumption baked

1. Parser service singleton shared in-process; Pandora reuses Hades's parsed repo cache when available (Demeter persists cache).
2. `find_callsites` returns ALL uses of symbol across repo; Pandora ranks by file proximity for proposal impact analysis.
3. Pandora's `analyze_intent` does NOT mutate parser state; LLM-driven file/symbol identification is informational, parser confirms via deterministic AST query.
4. Drafts verification step: Pandora parses every file in drafts dir post-simulation; if any has parse_error, simulation flagged invalid (Asclepius UI shows error state via `pandora-to-asclepius.md` feedback).
5. Ghost building hints use deterministic position computation: place near most-related existing building (max callsite proximity). Iris does not override; Asclepius renders directly.
6. Complexity estimation: simple = 1-3 affected files, moderate = 4-10, complex = 10+. Drives simulation engine turn budget per Pandora ship criteria.

## Validation steps

**Producer responsibility (Hades)**:
- Same as `hades-to-nemesis.md` parser validation.
- `find_callsites` returns accurate callsite list; tree-sitter query DSL handles language-specific call expression syntax.
- Concurrent parser calls from Pandora + Nemesis safe (parser service thread/coroutine-safe).

**Consumer responsibility (Pandora)**:
- Call `analyze_intent` early in simulation pipeline (Turn 0 of simulation engine).
- Validate drafts syntax after each simulation turn (Turn 1 tests + Turn 2 impl); halt simulation if drafts contain parse errors > 50% of files.
- Ghost hints serialization matches `asclepius-to-pandora.md` GhostBuildingHint schema field-by-field.
- Simulation engine writes only inside `drafts/<id>/`; parser.parse_file paths validated against drafts dir prefix (no path traversal).

## Edge case handling

- User intent ambiguous (LLM cannot identify candidate symbols): Pandora returns ProposalContext with `affected_files: []` + LLM-generated clarification question; UI prompts user to refine intent.
- Callsite count > 100 (sweeping refactor across whole repo): Pandora flags complexity 'complex' + limits simulation scope to top-20 most-relevant files; surface this scope limitation in proposal summary.
- Drafts dir empty after simulation: Pandora marks simulation 'completed' with `error: "No changes generated"` and 0 ghost buildings.
- Parse error in draft file: Pandora retries simulation Turn 2 with stricter prompt; if persistent, marks simulation 'failed' with error message.

## Open questions

- LLM-driven file identification confidence: how to handle low-confidence Athena suggestions? Pandora's `analyze_intent` may include confidence score; if < 0.5, ask user for clarification before running full simulation.
- OpenSpec change folder Folder B mirror: Folder A is panitia-facing; Folder B (`.agent-openspec/changes/<id>/`) internal workflow. Pandora writes to Folder A by default; Folder B mirror via Themis if needed (decision out of Pythia scope, Themis handles).

## Reference

- Metis Agentic Structure md Section 2 DAG: Hades parser API consumed by Pandora
- Metis Section 5.6 Hades + Pandora ship criteria
- PRD Section 9.3 (Refactor Mode SAFETY-FIRST + drafts/ sandbox)
- PRD Section 18.6 (DeepSeek multi-turn coordination Refactor Mode)
- PRD AD-19 (drafts/ isolation safety property)
- Contract `hades-to-nemesis.md` (sibling parser API consumer)
- Contract `asclepius-to-pandora.md` (ghost-to-solid simulation events upstream consumer)
- Contract `triton-to-pandora.md` (LLM client multi-turn coordination)
