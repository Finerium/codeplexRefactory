/**
 * [MOCK Wave 2, real Wave 3 Triton SSE stream]
 *
 * Authored by Persephone (Wave 2) per Decision D5 (`_meta/decision_log/persephone.md`).
 * 5 canned response generators capture per-resident voice anchor from PRD Section 10.
 *
 * Wave 3 swap: replace `streamChat()` body with real fetch to `/api/chat` SSE
 * endpoint per Pythia contract `persephone-to-triton.md` lines 76-105. Chat
 * panel UI surface unchanged.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 2, real Wave 3 Triton SSE stream] label at top).
 */

import type {
  ChatMessageMetadata,
  CurrentMode,
  ResidentId,
  SendChatRequest,
  StreamChatEvent,
} from './types';

/**
 * Sleep helper for streaming pacing.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Canned response template per resident per mode. The 5-resident voice anchor
 * is the load-bearing demo signal; each response reads distinctly so the
 * audit gate + judge can tell residents apart from the body alone.
 */
function buildCannedBody(
  resident: ResidentId,
  message: string,
  mode: CurrentMode,
  buildingId: string | null
): string {
  const buildingNote = buildingId
    ? ` (building \`${buildingId}\` selected)`
    : '';
  switch (resident) {
    case 'Athena': {
      // Architect, V4-Pro think high: thoughtful, multiple-file-aware,
      // bilingual Indonesian + English technical
      return [
        `**Athena considers your request.**${buildingNote}`,
        ``,
        `Setelah scan dependency graph + cross-reference proposal queue, gw lihat 3 angle relevant:`,
        ``,
        `1. **Direct impact**: \`${mode === 'refactor' ? 'auth/oauth.ts' : 'app/main.py'}\` perlu interface stabil sebelum refactor.`,
        `2. **Adjacent risk**: \`tests/integration/auth_flow.py\` consumes the same fixture; co-edit required.`,
        `3. **Spec contract**: OpenSpec change folder \`openspec/changes/${mode === 'refactor' ? 'auth-rotation' : 'observed-context'}/\` proposal.md needs ADDED requirement section.`,
        ``,
        `Saran proceed: review proposal di side panel sebelum \`Run Simulation\`. Production code untouched sampai lo Accept.`,
        ``,
        `_Pesan asli: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"_`,
      ].join('\n');
    }
    case 'Apollo': {
      // Doctor, V4-Flash non-think: clinical evidence, file + line cite
      return [
        `**Apollo diagnostic.**${buildingNote}`,
        ``,
        `Evidence chain:`,
        `- \`app/services/user_service.py:142\`, hardcoded \`SECRET_KEY\` literal flagged.`,
        `- \`pyproject.toml:31\`, dependency \`requests==2.28\` outdated, CVE-2023-32681 medium severity.`,
        `- \`tests/test_user_service.py\` missing; complex untested file detector tripped.`,
        ``,
        `No fabrication; all findings sourced from deterministic detector pass. Convert to Backlog Ticket?`,
        ``,
        `_Pesan asli: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"_`,
      ].join('\n');
    }
    case 'Argus': {
      // Watcher, V4-Flash think low: concise CVSS-framed bullet
      return [
        `**Argus watch report.**${buildingNote}`,
        ``,
        `- Vuln: CVE-2024-9876, CVSS 7.5 HIGH, \`requests<2.31\`.`,
        `- Exploit: HTTP request smuggling via crafted \`Transfer-Encoding\`.`,
        `- Mitigation: bump \`requests>=2.31\`. Reference: https://github.com/advisories/GHSA-q2gp.`,
        `- Auth route check: \`api/admin/*\` 3 routes missing \`@require_role('admin')\`. Severity HIGH.`,
        ``,
        `Escalate to Athena for Refactor proposal if structural.`,
        ``,
        `_Pesan asli: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"_`,
      ].join('\n');
    }
    case 'Clio': {
      // Historian, V4-Flash non-think: elegant narrative w/ timestamps
      return [
        `**Clio narrates.**${buildingNote}`,
        ``,
        `Issue #234 closed 8 bulan lalu, namun \`auth/oauth.ts\` masih di-edit 12 kali dalam 3 bulan terakhir. Spec-drift Pattern A.`,
        ``,
        `Reviewer terakhir: @hafiz, last commit 2 minggu lalu. The closed issue framed the contract; the open edits expanded the scope quietly.`,
        ``,
        `Setiap angka di atas berasal dari deterministic git metadata, bukan inferensi LLM.`,
        ``,
        `_Pesan asli: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"_`,
      ].join('\n');
    }
    case 'Hermes': {
      // Guide, V4-Flash non-think: warm bilingual welcome
      return [
        `**Hermes welcomes you.**${buildingNote}`,
        ``,
        `Selamat datang di kota lo. Codebase ini punya **7 district**, **240 buildings**, dan **5 landmark residents** termasuk gw.`,
        ``,
        `Tour ${mode === 'onboarding' ? 'Onboarding (4 variant)' : 'context-specific'} ready when you are. Pilih:`,
        `- \`auth_district_tour\` (60 detik, 8 stop)`,
        `- \`recent_changes_tour\` (45 detik, 6 stop)`,
        `- \`hot_files_tour\` (30 detik, 5 stop)`,
        `- \`personal_ownership_tour\` (40 detik, 7 stop)`,
        ``,
        `Bahasa: bilingual default, switch via header.`,
        ``,
        `_Pesan asli: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"_`,
      ].join('\n');
    }
  }
}

/**
 * Wave 2 mock streaming generator. Chunks the canned body word-by-word with
 * ~20-40ms inter-chunk delay to simulate SSE streaming.
 *
 * Per Pythia contract `persephone-to-triton.md` line 87-105 the real Wave 3
 * `streamChat` is an async generator yielding `{ chunk: string }` events
 * followed by `{ done: ChatMessageMetadata }`. Wave 2 mock yields the same
 * envelope so consumer code is unchanged on Wave 3 swap.
 */
export async function* streamChat(
  req: SendChatRequest
): AsyncGenerator<StreamChatEvent> {
  // Broadcast not implemented Wave 2; pick a single resident for stub.
  const resident: ResidentId =
    req.target === 'broadcast' ? 'Hermes' : (req.target as ResidentId);

  const body = buildCannedBody(
    resident,
    req.message,
    req.context.currentMode,
    req.context.selectedBuildingId
  );

  // Tokenize on whitespace then re-stream with spaces preserved.
  const tokens = body.split(/(\s+)/);
  const t0 = Date.now();
  let outputChars = 0;

  for (const token of tokens) {
    // Skip empty tokens from split regex.
    if (token.length === 0) continue;
    yield { chunk: token };
    outputChars += token.length;
    // Pacing: 18-32ms per token roughly mimics V4-Flash streaming cadence.
    await sleep(18 + Math.floor(Math.random() * 14));
  }

  const latencyMs = Date.now() - t0;
  const metadata: ChatMessageMetadata = {
    modelUsed:
      resident === 'Athena'
        ? 'V4-Pro-think-high'
        : resident === 'Argus'
          ? 'V4-Flash-think-low'
          : 'V4-Flash-non-think',
    inputTokens: Math.max(20, Math.floor(req.message.length / 4)),
    outputTokens: Math.max(40, Math.floor(outputChars / 4)),
    latencyMs,
    // Mock cache hit on short prompts to demo the H6 PromptOpening cache
    cacheHit: req.message.length < 40,
  };
  yield { done: metadata };
}

/**
 * Wave 3 swap pointer (consumers may import this name for documentation).
 *
 * Wave 3 replaces `streamChat` body with:
 *   const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify(req), headers: { 'Content-Type': 'application/json' } });
 *   const reader = response.body!.getReader();
 *   ...parse SSE chunks...
 *
 * Same async generator surface, real-network bytes.
 */
export const STREAM_CHAT_MODE = 'mock-wave-2' as const;
