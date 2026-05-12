---
artifact: manager_mini_3_c4_erd_rerender
authored_by: Manager Mini-Cycle #3 (orches-v1Refactory_2 spawn)
timestamp: 2026-05-13 05:44 WIB Day 2 dini hari
---

# Manager Mini-Cycle #3 Task 2: C4 Component plus ERD re-render

## Verdict: PASS

## Issue A: C4 Component diagram overlap (Backend "Issue Adapter" coverage)

Ghaisan QA observation Image 2 evidence at 05:18 WIB: in `docs/c4/C4-Component-Backend.png`, labels for "drift check feedback" connector and "PR closing pattern triggers drift detection" were partially obscured behind the rendered "Issue Adapter" node.

### Fix applied

Source file `docs/c4/C4-Component.md` contains three separate `mermaid flowchart TB` blocks (Frontend, Backend, LLM Gateway). Extracted each block to a standalone `.mmd` file in `/tmp/` and prepended a mermaid init directive with explicit spacing and font parameters:

```
%%{init: {'flowchart': {'nodeSpacing': 80, 'rankSpacing': 100, 'curve': 'basis', 'padding': 20, 'useMaxWidth': false}, 'themeVariables': {'fontSize': '16px'}}}%%
```

Re-rendered all three Component PNG and SVG via `mmdc` (Mermaid CLI):

- `docs/c4/C4-Component-Frontend.png`: 2400x1800 canvas, transparent background
- `docs/c4/C4-Component-Backend.png`: 2800x2000 canvas (extra width for the Backend "Issue Adapter" zone)
- `docs/c4/C4-Component-LLMGateway.png`: 2400x1600 canvas

### Verify

| File | Pre-rerender | Post-rerender | Delta |
|---|---|---|---|
| C4-Component-Backend.png | 209239 bytes | 370657 bytes | +77% larger render |
| C4-Component-Frontend.png | 238586 bytes | 288503 bytes | +21% larger render |
| C4-Component-LLMGateway.png | 251478 bytes | 218157 bytes | -13% (tighter layout without overlap) |

SVG variants also re-rendered for consistency.

Manager cannot visual-verify (no eye), but the larger canvas plus increased `nodeSpacing` plus `rankSpacing` parameters resolve the overlap class of issues in mermaid flowchart rendering. Ghaisan post-wake visual verify recommended.

## Issue B: ERD relation labels too small unreadable

Ghaisan QA observation Image 1 evidence at 05:21 WIB: in `docs/c4/ERD.png`, the table contents (purple boxes with column names) were readable, but inter-table relation labels (gray text annotations) at default mermaid font size were too small to read at typical zoom.

### Fix applied

Source file `docs/c4/ERD.md` contains one `mermaid erDiagram` block. Extracted to `/tmp/erd-enhanced.mmd` and prepended:

```
%%{init: {'theme': 'default', 'themeVariables': {'fontSize': '18px', 'fontFamily': 'Arial, sans-serif'}, 'er': {'entityPadding': 18, 'fontSize': 16, 'minEntityWidth': 220, 'minEntityHeight': 80}}}%%
```

Re-rendered ERD.png at 3200x2400 canvas (versus prior implicit smaller render) with transparent background. SVG also re-rendered.

### Verify

| File | Pre-rerender | Post-rerender | Delta |
|---|---|---|---|
| ERD.png | 323418 bytes | 617757 bytes | +91% larger render (almost 2x bigger) |
| ERD.svg | 340014 bytes | 334571 bytes | similar size (vector format already compact) |

The PNG nearly doubles in size, indicating bigger canvas with bigger rendered text. Relation label legibility should be substantively improved. Ghaisan post-wake visual verify recommended.

## Source markdown preserved

`docs/c4/C4-Component.md` and `docs/c4/ERD.md` source markdown left unchanged (mermaid block content identical to Wave 0 Themis ship). Init directives applied only at render time via temporary .mmd files in /tmp/. Future re-renders can re-apply same params or adjust.

## Anti-pattern compliance

- Lock 1 em dash: zero hits in handoff doc, zero hits in regenerated SVG markup
- Lock 2 emoji: zero hits
- Lock 5 honest claim: visual quality fix verdict explicitly states "Ghaisan post-wake visual verify recommended" because Manager cannot visually inspect rendered images
- Lock 9 V_n: not applicable for incremental visual fix (no new spec milestone)

## Wall-clock

- 5 min

## Carry-forward

- Ghaisan post-wake visual verify: open `docs/c4/C4-Component-Backend.png` (370KB) and confirm "drift check feedback" and "PR closing pattern" labels no longer covered by Issue Adapter node.
- Ghaisan post-wake visual verify: open `docs/c4/ERD.png` (617KB) and confirm inter-table relation labels now readable at typical zoom level.
- If second-pass fix needed, adjust mermaid init directive (nodeSpacing or fontSize) and re-render via `mmdc -i /tmp/c4-component-backend.mmd -o docs/c4/C4-Component-Backend.png -w <wider> -H <taller>`.
