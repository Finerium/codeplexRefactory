'use client';

/**
 * EvidencePanel: file path + line range + code snippet + suggested fix.
 *
 * Owner: Asclepius (Wave 2).
 * Contract anchor: `_meta/contracts/asclepius-to-triton.md` Validation steps
 *   "Click finding sets selectedFindingId; side panel mode 'health' renders
 *    evidence detail."
 *
 * Renders when `selectedFindingId` resolves a real ApolloFinding from the
 * store. If selectedFinding is null (no row clicked), renders a docked
 * neutral hint inviting the user to click a finding.
 *
 * Anti-AI-slop:
 *   - The header voice mirrors Apollo's doctor persona (warm clinical).
 *   - Evidence box uses a monospace font + line indicators so the snippet
 *     reads like a diagnostic report, not a generic alert dialog.
 *   - "Suggested fix" copy is preserved verbatim from the finding (Wave 3
 *     replaces with Apollo V4-Flash narration; Wave 2 uses the canned
 *     remediation copy embedded in the mock data).
 *   - "View in IDE" stub label per Asclepius prompt Section 4: future deep
 *     link to file:line in the user's editor. Wave 2 no-op + toast hint.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 ([STUB] label
 * on View-in-IDE deep link).
 */

import { useState } from 'react';
import {
  selectSelectedFinding,
  useAsclepiusStore,
} from './asclepiusStore';
import { ConvertToTicketButton } from './ConvertToTicketButton';
import { CATEGORY_LABEL, SEVERITY_PALETTE } from './types';

export function EvidencePanel() {
  const finding = useAsclepiusStore(selectSelectedFinding);
  const selectFinding = useAsclepiusStore((s) => s.selectFinding);
  const [ideToastVisible, setIdeToastVisible] = useState(false);

  if (!finding) {
    return (
      <div
        className="pointer-events-auto rounded-2xl border border-dashed border-white/15 bg-codeplex-shadow/50 p-4 text-center text-[11px] text-white/45 backdrop-blur-glass"
        data-asclepius-panel="evidence-empty"
      >
        Click a finding to see the evidence chain.
      </div>
    );
  }

  const color = SEVERITY_PALETTE[finding.severity];
  const lineLabel =
    finding.lineStart === finding.lineEnd
      ? `Line ${finding.lineStart}`
      : `Lines ${finding.lineStart} to ${finding.lineEnd}`;

  const handleViewInIde = () => {
    // [STUB Wave 2 deep link, future open IDE protocol]
    // eslint-disable-next-line no-console
    console.log(
      `[asclepius] view-in-ide stub for ${finding.filePath}:${finding.lineStart}`,
    );
    setIdeToastVisible(true);
    setTimeout(() => setIdeToastVisible(false), 2500);
  };

  return (
    <div
      className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass"
      data-asclepius-panel="evidence"
      data-finding-id={finding.id}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
            Evidence chain
          </p>
          <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
          <p className="font-mono text-[10px] text-white/55">
            {CATEGORY_LABEL[finding.category]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => selectFinding(null)}
          className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/55 hover:border-white/35 hover:text-white/80"
          aria-label="Close evidence"
        >
          close
        </button>
      </header>

      <section className="rounded-lg border border-white/10 bg-black/30 p-3">
        <header className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            File reference
          </p>
          <span
            className="rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider"
            style={{ color, borderColor: color }}
          >
            {finding.severity}
          </span>
        </header>
        <p className="font-mono text-[11px] text-white/90 break-all">
          {finding.filePath}
        </p>
        <p className="mt-1 font-mono text-[10px] text-white/55">{lineLabel}</p>
        <button
          type="button"
          onClick={handleViewInIde}
          className="mt-2 inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/70 hover:border-white/35 hover:text-white"
          data-action="view-in-ide"
        >
          View in IDE
          <span className="text-[9px] text-white/40">[Wave 2 stub]</span>
        </button>
      </section>

      <section className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
          Description
        </p>
        <p className="text-[11px] leading-relaxed text-white/85">
          {finding.description}
        </p>
      </section>

      <section className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
          Suggested fix
        </p>
        <p className="text-[11px] leading-relaxed text-white/85">
          {finding.suggestedFix}
        </p>
      </section>

      <footer className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] text-white/40">
          Detected {finding.detectedAt}
        </p>
        <ConvertToTicketButton finding={finding} />
      </footer>

      {ideToastVisible ? (
        <div
          role="status"
          className="absolute inset-x-0 -top-9 mx-auto w-fit rounded-full border border-white/15 bg-codeplex-shadow/95 px-3 py-1 text-[10px] text-white/80 backdrop-blur"
        >
          Deep link to IDE is a Wave 3 enhancement
        </div>
      ) : null}
    </div>
  );
}

EvidencePanel.displayName = 'EvidencePanel';
