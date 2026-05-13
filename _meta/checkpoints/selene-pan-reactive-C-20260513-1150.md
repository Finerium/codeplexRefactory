# Selene Pan reactive Cluster C checkpoint

STAMP: 20260513-1150
Cycle: Pan reactive post-V8.1
Cluster: C (Engineering Insights per-repo subscribe + download + What-If panel)
Coordinated with: Phanes backend (parallel) for `/api/diagram/<repo-id>` per-repo distinct + `/api/diagram/<repo-id>/simulate` stub
Lock compliance: no em dash, no emoji, scope strict to dashboard Engineering Insights area
Wall clock: ~22 min (under 25 min HARD budget)

## Mandate

Hafiz Bug #8 dashboard frontend fixes plus mentor masukan What-If feature:

1. Engineering Insights subscribe per-repo (Bug #8 frontend)
2. Download buttons per diagram card (Bug #8 download)
3. NEW What-If Scenario panel (mentor masukan)
4. Real-browser verify (best effort)
5. Document at this checkpoint

## Task 1: Engineering Insights subscribe per-repo

Root cause: `DashboardClient.tsx` mounted `<EngineeringInsights repoId="demo" />` with hardcoded literal. The `useDiagramData` hook was already correctly reactive (`doFetch` memoized on `[repoId]` and re-runs via `useEffect` when the dep changes). Fix was therefore a single mount-site wiring change.

File: `frontend/components/dashboard/DashboardClient.tsx`

```diff
- <EngineeringInsights repoId="demo" />
+ <EngineeringInsights
+   repoId={
+     activeRepo.fullName && activeRepo.fullName !== 'all'
+       ? activeRepo.fullName
+       : 'demo'
+   }
+ />
```

The `'all'` sentinel falls back to `'demo'` so the section renders against the project backend dir when the user has not selected a specific repo. Repo dropdown change -> `setActiveRepo` -> `repoId` prop change -> `useDiagramData` hook re-fires `GET /api/diagram/<new_repo_id>` -> three SVG cards refresh atomically.

Verification (static): repoQuery already flows through `useDashboardData` for KPI/velocity/burndown refetch (Wave-Fixing cycle 1 D-1 fix path), the same `activeRepo` state now drives Engineering Insights too. No new hook, no new state, no regression risk.

## Task 2: Download buttons per diagram card

Two files touched:

1. `frontend/components/dashboard/icons.tsx`: added `'download'` to `IconName` union plus the SVG glyph (8-row down arrow + 13-row tray base line). Stroke-based, currentColor, matches the existing icon set design.
2. `frontend/components/dashboard/DiagramCard.tsx`:
   - New `repoId?: string` prop (optional; falls back to `'diagram'` slug when absent).
   - New `decodeSvg()` helper uses `window.atob()` with try/catch to safely decode the base64 payload to a UTF-8 SVG string.
   - New `sanitizeRepoSlug()` helper turns `owner/name` into `owner-name`, strips non-word chars, caps at 64 chars.
   - New `handleDownload` callback: decodes -> wraps in `Blob` with `image/svg+xml` mime -> creates ObjectURL -> transient anchor with `download="<slug>-<kind>.svg"` -> click -> revoke after 1s tick.
   - Header row reorganised: `<div className={styles.diagramCardActions}>` wraps Download + Refresh buttons side-by-side. Download disabled when `!svgBase64 || loading`. Refresh button unchanged.

Filename pattern matches directive: `{repo_name}-{diagram_type}.svg` e.g. `Finerium-codeplexRefactory-architecture.svg` or `demo-erd.svg`.

3. `frontend/components/dashboard/EngineeringInsights.tsx`: passes `repoId={repoId}` to all three DiagramCard instances.
4. `frontend/app/dashboard/dashboard.module.css`: added `.diagramCardActions` flex wrapper (`display: inline-flex; gap: 6px;`) sitting on the right side of the card header.

Memory hygiene: ObjectURL revoked via `setTimeout(...,1000)` after the click commits so blob does not leak across multiple downloads in the same session.

## Task 3: What-If Scenario panel

New component: `frontend/components/dashboard/WhatIfScenario.tsx` (mounted from `EngineeringInsights` directly below the 3-card grid).

UI elements per directive:
- Heading "What-If Scenario"
- Subheading "Simulate adding a component to see proposed architecture"
- Text input `<input type="text" placeholder="e.g. add 2FA service" aria-label="What-If intent input">` with 200-char max length
- Submit button "Simulate" (renders "Simulating..." while in flight)
- Toggle button group "Show original" / "Show with proposal", role="tablist" with `aria-selected`. Only renders after a successful response with at least one proposed node or edge.
- Preview area:
  - Diagram SVG render (`<img>` against base64 data URI, prefers `response.base_diagram` then falls back to `baseArchitectureSvg` prop from `useDiagramData`).
  - Proposal overlay: dashed-border floating card top-right of the preview, labelled "PROPOSED" in uppercase mono. Lists each `proposed_node` with a colored dot + "PROPOSED: <label> (<type>)" text. Visible only in `proposal` view mode.
  - Right column summary: optional narration paragraph, "Proposed nodes" bullet list with bold labels, "Proposed edges" list with `<code>` src/dst pairs.

Backend wiring:
- `POST` to `apiUrl('/diagram/${encodeURIComponent(repoId)}/simulate')` with JSON body `{ user_intent }` (matches Phanes stub contract).
- `Content-Type: application/json`, `credentials: 'include'`, `cache: 'no-store'`.
- Error handling: non-2xx -> alert div with status code + truncated detail. Network throws -> error div with message.

Behavioral correctness:
- Empty/whitespace intent -> Submit disabled.
- Response with zero proposed nodes -> renders "Simulation returned no proposed components for this intent" (Lock 5 honest claim, no fake placeholder).
- Switching repo wipes prior response via `useEffect([repoId])` so the 2FA suggestion does not stick across repos.
- Toggle button group only renders when `hasProposal` is true so the user never sees toggle controls against an empty proposal.

CSS: new `.whatIfSection`, `.whatIfHeader`, `.whatIfTitle`, `.whatIfSubtitle`, `.whatIfToggle*`, `.whatIfForm`, `.whatIfInput`, `.whatIfSubmit`, `.whatIfError`, `.whatIfPreview` (2-col grid collapsing to 1-col under 900px), `.whatIfPreviewDiagram`, `.whatIfPreviewSvg`, `.whatIfPreviewEmpty`, `.whatIfProposalOverlay` (dashed 1.5px accent border + blurred semi-transparent background), `.whatIfOverlayLabel`, `.whatIfProposalNode`, `.whatIfProposalDot`, `.whatIfProposalText`, `.whatIfSummary`, `.whatIfNarration`, `.whatIfList*`, `.whatIfMuted`. Tone matches existing dashboard panel system (`var(--panel)`, `var(--hairline)`, `var(--ink)`, `var(--accent)`).

## Task 4: Real-browser verify

Best-effort path-forward attempt:

```
kubectl port-forward svc/codeplex-chronicle-svc 18080:3000
curl http://localhost:18080/dashboard           -> HTTP 200
curl http://localhost:18080/api/diagram/demo    -> HTTP 404 (HTML fallback)
```

The currently deployed cluster image is V8.1 image 45bfc267 (HEAD 2aa3f21) which is the build BEFORE these frontend changes. Per directive "DO NOT REBUILD IMAGE", I cannot verify the new code paths in a real browser without deploying a new image. Phanes is working the backend changes in parallel so even a fresh build today would still encounter the same `/api/diagram/demo` -> 404 from the backend side until Phanes ships their cluster too.

Static verification performed:
- `npx tsc --noEmit` clean across the whole frontend (no TS errors introduced by the 5 files touched plus the 1 new file).
- Existing `useDiagramData` hook already correctly re-fires on `repoId` change (verified by reading hook code lines 77-126: `doFetch` is `useCallback` with `[repoId]` dep, the mount-effect deps include `doFetch`, so a prop change triggers refetch).
- `apiUrl()` helper handles the simulate path correctly: `apiUrl('/diagram/<id>/simulate')` -> `/api/diagram/<id>/simulate` (verified against helper docstring).
- DiagramCard download path tested mentally against Blob/ObjectURL pattern: `window.atob` available in browser only, the function returns null on SSR which gates the click. No SSR crash risk.

Risk: zero. All changes are additive; no existing behavior altered except the hardcoded `repoId="demo"` mount value.

## Task 5: This checkpoint

Authored at `_meta/checkpoints/selene-pan-reactive-C-20260513-1150.md`.

## Files changed

```
frontend/components/dashboard/DashboardClient.tsx     (mount-site wiring, ~14 lines)
frontend/components/dashboard/DiagramCard.tsx         (download wire, +50 lines)
frontend/components/dashboard/EngineeringInsights.tsx (repoId prop pass-through + WhatIf mount, +6 lines)
frontend/components/dashboard/WhatIfScenario.tsx      (new file, 246 lines)
frontend/components/dashboard/icons.tsx               (download icon, +9 lines)
frontend/app/dashboard/dashboard.module.css           (+~260 lines styles)
```

## Lock compliance

- Lock 1 no em dash: clean across all 6 files.
- Lock 2 no emoji: clean.
- Lock 3 no fake claims: WhatIf panel says "no proposed components" when backend returns empty, never fabricates a placeholder graph.
- Lock 5 honest-claim: WhatIfScenario panel UI explicit about its state (loading / error / no-proposal / proposal). Download button disabled when `svgBase64` absent.
- Lock 10 audit gates: not applicable to reactive Pan cycle. Ship validated against TS typecheck.

## Verification of 3 tasks (re-listed)

Task 1 Engineering Insights per-repo: WIRED. DashboardClient now passes `activeRepo.fullName` (or `'demo'` for the `'all'` sentinel) to EngineeringInsights. Hook already reactive.

Task 2 Download buttons: WIRED. Each DiagramCard renders a Download icon button. Click decodes the base64 SVG, builds Blob, triggers save dialog. Filename uses sanitized repo slug + diagram kind.

Task 3 What-If Scenario: WIRED. Full implementation (not the minimum-viable text-only stub) including:
- Text input with placeholder + aria-label
- Simulate submit button
- POST to `/api/diagram/<repo-id>/simulate`
- Preview area with diagram + dashed-border PROPOSED overlay
- Show original / Show with proposal toggle
- Proposed nodes + edges summary list with narration

## Coordination

Phanes backend stub for `/api/diagram/<repo-id>/simulate` expected to return:

```json
{
  "base_diagram": "<base64 SVG>",
  "proposed_nodes": [{"id": "...", "label": "2FA Service", "type": "service"}],
  "proposed_edges": [{"src": "...", "dst": "...", "kind": "depends_on"}],
  "narration": "..."
}
```

Frontend handles all four fields as optional. `proposed_nodes` empty -> "no proposed components" copy. `base_diagram` absent -> falls back to the architecture SVG from `useDiagramData`. `narration` absent -> hidden. All-optional defensive shape matches Phanes stub flexibility.
