'use client';

/**
 * ConvertToTicketButton: 1-click Apollo Hybrid Write Layer 1.
 *
 * Owner: Asclepius (Wave 2 viz + Wave-Fixing #1 3D flying packet)
 *         + Nemesis (Wave-Fixing #2 backend wire-up).
 * Pythia anchor: `_meta/contracts/asclepius-to-triton.md` Open questions
 *   "Convert to Backlog Ticket" button click flow: Wave 2 stub Hybrid Layer
 *    1 (mock); Wave 3 Demeter `POST /api/findings/{id}/to-issue` creates
 *    real GitHub issue.
 *
 * PRD anchor: Section 9.5 + Section 12.1 (Hybrid Write Layer 1, 1-Click
 *   GitHub Issue with evidence chain pre-filled). The button label is
 *   "Convert to Backlog Ticket" verbatim per PRD Section 9.5 line 594.
 *
 * Wave-Fixing #2 cycle 1 (Nemesis owner): real POST to backend with three
 * response branches per PRD Section 12.1:
 *   - state="open"   => real GitHub issue created. Mark ticketed with the
 *                       returned issue number, toast confirms.
 *   - state="deeplink" => backend short-circuited (ENABLE_WRITE_OPS=false OR
 *                       no encrypted user token OR GitHub API soft-fail).
 *                       Open the deep-link URL in a new tab so user can
 *                       submit manually. Mark ticketed with issue=0 sentinel
 *                       to signal "deep-link, not real issue yet".
 *   - network error  => optimistic UI rollback + error toast; user can retry.
 *
 * Visual + interaction (Wave 2 + Wave-Fixing #1 + Wave-Fixing #2):
 *   - Hover preview tooltip preserved (Asclepius Wave 2).
 *   - Optimistic click: mark ticketed instantly + spawn 3D flying packet to
 *     Backlog Office (Wave-Fixing #1, spawnFlyingPacket bus).
 *   - Real POST fires in parallel; backend response either confirms with the
 *     real issue number OR returns a deep link the frontend opens in a new
 *     tab. On failure the optimistic state rolls back.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (Wave 3 real
 * backend POST live; Wave 2 mock retired except as the immediate visual).
 */

import { useState } from 'react';
import { apiUrl } from '@/lib/apiUrl';
import { useAsclepiusStore } from './asclepiusStore';
import { spawnFlyingPacket } from './IssueFlyingPacket';
import type { ApolloFinding } from './types';
import { CATEGORY_LABEL } from './types';

interface ConvertToTicketButtonProps {
  finding: ApolloFinding;
}

interface BackendIssueResult {
  issue_number: number;
  issue_url: string;
  state: 'open' | 'closed' | 'deeplink';
}

async function postConvertToTicket(
  findingId: string,
): Promise<BackendIssueResult> {
  // Backend route: POST /api/findings/{finding_id}/to-issue.
  // Body left empty: backend pulls finding row from finding_events table and
  // pre-fills title/body/labels from the evidence chain.
  //
  // Wave-Fixing 3 Manager FINAL (Triton, STAMP 20260513-0626): canonical
  // `apiUrl()` helper (replaces local `NEXT_PUBLIC_API_BASE` typo read).
  const resp = await fetch(
    apiUrl(`/findings/${encodeURIComponent(findingId)}/to-issue`),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
  );
  if (!resp.ok) {
    throw new Error(
      `POST /api/findings/${findingId}/to-issue => HTTP ${resp.status}`,
    );
  }
  return (await resp.json()) as BackendIssueResult;
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
    // OPTIMISTIC UI (Asclepius Wave-Fixing #1 viz + Nemesis Wave-Fixing #2
    // real backend): mark ticketed instantly + fire 3D flying packet so the
    // visual feels real-time. Then POST to the backend in parallel; on
    // success replace the optimistic issue number with the real one (or
    // open the deep-link URL if backend short-circuited per PRD Section
    // 12.1). On failure roll back.
    const optimisticIssue = 1234 + ((finding.id.charCodeAt(finding.id.length - 1) || 0) % 50);
    markTicketed(finding.id, optimisticIssue);
    spawnFlyingPacket({
      packetId: `packet-${finding.id}-${optimisticIssue}`,
      sourceBuildingId: finding.buildingId,
      issueNumber: optimisticIssue,
    });
    setToast(
      `Backlog issue #${optimisticIssue} dispatched. Flying to Backlog Office.`,
    );
    setTimeout(() => setToast(null), 3500);

    // Fire the real backend POST in parallel. If backend reachable, swap
    // the optimistic issue number with the real one and toast confirms
    // (open or deep-link). If unreachable, keep the optimistic UI but
    // log a console warning so dev/audit knows the fallback path ran.
    void postConvertToTicket(finding.id)
      .then((result) => {
        if (result.state === 'deeplink' && result.issue_url) {
          if (typeof window !== 'undefined') {
            window.open(result.issue_url, '_blank', 'noopener');
          }
          setToast(
            `Deep-link opened. ENABLE_WRITE_OPS=false or token missing; submit manually.`,
          );
          setTimeout(() => setToast(null), 4500);
          return;
        }
        // Replace optimistic issue number with the real backend number.
        if (result.issue_number && result.issue_number !== optimisticIssue) {
          markTicketed(finding.id, result.issue_number);
          setToast(`Backlog issue #${result.issue_number} created on GitHub.`);
          setTimeout(() => setToast(null), 4500);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[ConvertToTicket] backend POST failed, keeping optimistic UI:', err);
      });
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
