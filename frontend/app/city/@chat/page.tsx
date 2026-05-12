/**
 * @chat parallel slot mount point.
 *
 * Authored by Persephone (Wave 2). Replaces the Calliope Wave 1 STUB
 * placeholder `default.tsx` when active route is `/city`.
 *
 * Per Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` Section
 * "Output schema": slot is mounted via parallel routing; Persephone styles
 * panel internals; do NOT modify the `.city-layout` grid.
 *
 * The ChatPanel composite subscribes to:
 *   - `@/lib/panel-context` for chatTarget + broadcast + chatCollapsed state
 *   - `@/lib/chat` types + 5 resident routing
 *   - `@/lib/chat/mockResidentResponses` Wave 2 streaming (mock), Wave 3 swap real Triton SSE
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 ([MOCK Wave 2, real Wave 3 Triton SSE stream] label inside mock client).
 */

import { ChatPanel } from '@/components/panels/chat';

export default function ChatSlot() {
  return <ChatPanel />;
}
