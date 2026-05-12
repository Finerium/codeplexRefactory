'use client';

/**
 * ConvertToTicketButton: 1-click visual hook for Apollo Hybrid Write Layer 1.
 *
 * Owner: Asclepius (Wave 2).
 * Pythia anchor: `_meta/contracts/asclepius-to-triton.md` Open questions
 *   "Convert to Backlog Ticket" button click flow: Wave 2 stub Hybrid Layer
 *    1 (mock); Wave 3 Demeter `POST /api/findings/{id}/to-issue` creates
 *    real GitHub issue.
 *
 * PRD anchor: Section 9.5 + Section 12.1 (Hybrid Write Layer 1, 1-Click
 *   GitHub Issue with evidence chain pre-filled). The button label is
 *   "Convert to Backlog Ticket" verbatim per PRD Section 9.5 line 594.
 *
 * Visual + interaction:
 *   - Prominent action color (codeplex-ember warmth) so the user knows this
 *     is the primary action on the evidence panel.
 *   - Hover state reveals a tooltip preview of the issue body that Wave 3
 *     Demeter will assemble; preview built client-side from the finding for
 *     immediate feedback (no Demeter dependency).
 *   - Click triggers a Wave 2 mock action: store `markTicketed(findingId,
 *     1234)` + transient confirmation toast. The mock issue number 1234 is
 *     visibly labeled so the user understands this is not a real GitHub
 *     create.
 *   - Once status = 'ticketed', the button switches to a "View Issue #N"
 *     non-clickable label (Wave 3 Demeter wires real link).
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 ([STUB] label
 * on the mock action; Wave 3 swap target documented in handoff).
 */

import { useState } from 'react';
import { useAsclepiusStore } from './asclepiusStore';
import type { ApolloFinding } from './types';
import { CATEGORY_LABEL } from './types';

interface ConvertToTicketButtonProps {
  finding: ApolloFinding;
}

function suggestedLabels(finding: ApolloFinding): string[] {
  // PRD Section 9.5 suggested label hint: bug | security | tech-debt
  switch (finding.category) {
    case 'hardcoded-secret':
    case 'missing-auth':
    case 'unsafe-sql':
      return ['security', `severity:${finding.severity}`];
    case 'outdated-dependency':
      return ['tech-debt', `severity:${finding.severity}`];
    case 'complex-untested':
      return ['tech-debt', 'needs-tests'];
    default:
      return [`severity:${finding.severity}`];
  }
}

function buildIssueBodyPreview(finding: ApolloFinding): string {
  return [
    `# ${finding.title}`,
    '',
    `**Category:** ${CATEGORY_LABEL[finding.category]}`,
    `**Severity:** ${finding.severity}`,
    `**Detected at:** ${finding.detectedAt}`,
    '',
    `## Evidence`,
    `\`${finding.filePath}:${finding.lineStart}${
      finding.lineStart !== finding.lineEnd ? `-${finding.lineEnd}` : ''
    }\``,
    '',
    finding.description,
    '',
    `## Suggested fix`,
    finding.suggestedFix,
    '',
    `Labels: ${suggestedLabels(finding).map((l) => `\`${l}\``).join(', ')}`,
  ].join('\n');
}

export function ConvertToTicketButton({ finding }: ConvertToTicketButtonProps) {
  const markTicketed = useAsclepiusStore((s) => s.markTicketed);
  const [hovering, setHovering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = () => {
    if (finding.status === 'ticketed') return;
    // [STUB Wave 2 mock action, Wave 3 Demeter POST /api/findings/{id}/to-issue]
    // The mock issue number is fixed at 1234 + a counter offset based on
    // the finding id hash so the demo shows distinct numbers per click.
    const issueNumber = 1234 + ((finding.id.charCodeAt(finding.id.length - 1) || 0) % 50);
    markTicketed(finding.id, issueNumber);
    setToast(`Backlog issue #${issueNumber} created. (Wave 2 mock; Wave 3 Demeter wires GitHub.)`);
    setTimeout(() => setToast(null), 3500);
  };

  if (finding.status === 'ticketed' && finding.linkedIssueNumber !== null) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200"
        data-action="ticketed"
        title="Ticket created via Apollo Hybrid Write Layer 1"
      >
        Linked to Issue #{finding.linkedIssueNumber}
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="inline-flex items-center gap-2 rounded-md bg-codeplex-ember px-3 py-1.5 text-[11px] font-medium text-codeplex-void hover:bg-codeplex-ember/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-codeplex-ember/60"
        data-action="convert-to-ticket"
        aria-label="Convert this finding to a backlog ticket"
      >
        Convert to Backlog Ticket
      </button>

      {hovering ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-[22rem] rounded-lg border border-white/15 bg-codeplex-shadow/95 p-3 text-left text-[10px] text-white/80 shadow-xl backdrop-blur"
        >
          <p className="mb-1 font-mono uppercase tracking-widest text-codeplex-ember">
            Issue preview
          </p>
          <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-white/75">
            {buildIssueBodyPreview(finding)}
          </pre>
        </span>
      ) : null}

      {toast ? (
        <span
          role="status"
          className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-[20rem] rounded-lg border border-emerald-300/30 bg-emerald-300/12 p-2 text-[10px] text-emerald-100 backdrop-blur"
        >
          {toast}
        </span>
      ) : null}
    </span>
  );
}

ConvertToTicketButton.displayName = 'ConvertToTicketButton';
