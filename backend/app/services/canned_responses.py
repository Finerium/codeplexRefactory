"""Canned response store (Triton Wave 3 defensive layer).

Owner: Triton (Wave 3).

Top-10 demo question pre-cache per PRD Section 18.5. In-memory dict for sub
100ms latency target. Match strategy: case-insensitive substring keyword
lookup. Wave 3 cycle 4 may upgrade to semantic match through ``SemanticCache``
if false-negatives observed during demo rehearsal.

Each canned entry returns an ``LLMResponse``-shaped object with
``canned_hit=True``, ``cost_estimate_usd=0.0``, ``latency_ms=0`` so the
fallback chain telemetry differentiates canned from primary calls.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): every canned content string labelled with the source
  resident voice in the comment header.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Sequence

from app.llm.types import LLMMessage, LLMResponse


# ---------------------------------------------------------------------------
# Canned entry data class
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class CannedEntry:
    """One canned demo question entry.

    ``keywords`` are tried in order, case-insensitive substring match against
    the user's last message. The first hit returns ``content``.
    """

    keywords: Sequence[str]
    content: str
    key: str


# Top-10 per PRD Section 18.5. Order in this list is significant: the linear
# scan returns the first entry whose keywords match. More-specific entries
# (for example "run simulation for 2fa") must precede less-specific entries
# (for example "add 2fa") so a multi-keyword query routes to the intended
# canned response.
CANNED_ENTRIES: list[CannedEntry] = [
    # 1. Hermes generic 30-second tour.
    CannedEntry(
        keywords=(
            "30-second tour",
            "30 second tour",
            "30sec tour",
            "give me a tour",
            "generic tour",
            "tour for me",
        ),
        content=(
            "Selamat datang di codebase ini. Mari keliling singkat: main "
            "entry ada di main.py (backend utama), scanner.py menangani "
            "parsing tree-sitter, tour.tsx melayani UI onboarding. Klik "
            "bangunan landmark untuk detail lebih dalam."
        ),
        key="hermes-tour-generic",
    ),
    # 2. Activity Mode hotspot summary.
    CannedEntry(
        keywords=(
            "last 24h activity",
            "show 24h",
            "recent activity",
            "show 24 hour",
            "activity 24",
        ),
        content=(
            "Ringkasan aktivitas 24 jam: 12 commit terdistribusi di 5 distrik "
            "(auth, scanner, ui, backend, docs). Hotspot di scanner district "
            "8 commit dalam 6 jam. Klik distrik untuk drilldown timeline."
        ),
        key="activity-summary-24h",
    ),
    # 3. Apollo critical finding summary.
    CannedEntry(
        keywords=(
            "what's wrong",
            "whats wrong",
            "what is wrong",
            "current findings",
            "show findings",
        ),
        content=(
            "Apollo mendeteksi 5 finding aktif: 2 critical (hardcoded secret "
            "+ missing auth) di auth district, 1 high (unsafe SQL) di "
            "scanner, 2 medium (outdated dep + complex untested) di backend. "
            "Klik bangunan merah untuk evidence chain."
        ),
        key="apollo-findings-summary",
    ),
    # 4. Pandora simulation overview. Sits before the Athena 2FA proposal so
    # the query "run simulation for 2fa proposal" routes to the simulation
    # entry rather than the 2FA proposal entry.
    CannedEntry(
        keywords=(
            "run simulation",
            "simulation 2fa",
            "simulate 2fa",
            "run a simulation",
            "trigger simulation",
        ),
        content=(
            "Pandora jalankan simulasi 3 turn: Turn 1 generate failing test, "
            "Turn 2 implement code, Turn 3 serialize unified diff. drafts/ "
            "isolation aktif: tidak ada perubahan ke production code. Dual "
            "review gate Accept akan unduh diff; Discard akan clean drafts/."
        ),
        key="pandora-simulation-overview",
    ),
    # 5. Athena 2FA proposal (matched after the simulation entry so multi-
    # keyword queries route correctly).
    CannedEntry(
        keywords=(
            "propose 2fa",
            "add 2fa",
            "2fa proposal",
            "two factor authentication",
            "two-factor auth",
            "add two factor",
        ),
        content=(
            "Athena proposal: tambah 2FA via 3 file. auth/oauth.ts "
            "(OAuth flow), auth/totp.ts (TOTP generator + verifier baru), "
            "auth/middleware.ts (enforce 2FA pada protected route). Ghost "
            "building akan muncul di auth district. Trigger simulation "
            "untuk drafts/ output."
        ),
        key="athena-2fa-proposal",
    ),
    # 6. Hermes sprint-scoped tour.
    CannedEntry(
        keywords=(
            "sprint goal tour",
            "tour for sprint",
            "sprint scoped tour",
            "sprint 14 tour",
        ),
        content=(
            "Hermes sprint tour Sprint 14 Security: kunjungi main.py, "
            "scanner.py, auth.py, diagnostic.py, probes.py. Sprint goal: "
            "secure OAuth flow + tambah TOTP. 5 waypoint, 27 detik total."
        ),
        key="hermes-sprint-tour",
    ),
    # 7. Apollo ticket draft.
    CannedEntry(
        keywords=(
            "convert finding to ticket",
            "convert this finding",
            "backlog ticket",
            "to-issue",
            "create ticket",
        ),
        content=(
            "Apollo siapkan ticket: judul auto-generated dari finding title, "
            "body include evidence chain + suggested fix + finding identifier. "
            "Klik Create untuk push ke GitHub issues melalui Demeter endpoint."
        ),
        key="apollo-ticket-draft",
    ),
    # 8. Clio Pattern A drift narration.
    CannedEntry(
        keywords=(
            "why is auth/oauth.ts cracked",
            "spec drift auth",
            "pattern a",
            "stale closed issue",
        ),
        content=(
            "Clio narrate Pattern A: file auth/oauth.ts retak karena issue "
            "#142 ditutup tanpa merge, sementara spec masih reference fitur "
            "tersebut. Spec drift 3 minggu lag. Reopen issue atau update "
            "spec untuk resolve."
        ),
        key="clio-pattern-a-drift",
    ),
    # 9. Selene velocity sprint 14.
    CannedEntry(
        keywords=(
            "velocity for sprint",
            "show velocity",
            "velocity sprint",
            "sprint velocity",
            "velocity dashboard",
        ),
        content=(
            "Selene dashboard velocity sprint 14: 42 story point completed, "
            "average cycle time 1.8 hari, 5 PR merged, 1 reopened. Burndown "
            "chart on track untuk Security goal 5/5 done."
        ),
        key="selene-velocity-sprint-14",
    ),
    # 10. Activity heatmap payment.
    CannedEntry(
        keywords=(
            "contributor heatmap",
            "payment district heatmap",
            "ownership heatmap payment",
            "ownership payment",
        ),
        content=(
            "Activity ownership heatmap payment district: @hafiz (40 persen), "
            "@ghaisan (35 persen), @reza (25 persen). 9 commit dalam 30 hari "
            "terakhir. Cross-team review density tinggi."
        ),
        key="activity-heatmap-payment",
    ),
]


# ---------------------------------------------------------------------------
# Store
# ---------------------------------------------------------------------------


class CannedResponseStore:
    """In-memory canned response store.

    Lookup latency target: less than 100ms (PRD Section 18.5).
    """

    def __init__(self, entries: list[CannedEntry] | None = None) -> None:
        self._entries: list[CannedEntry] = entries if entries is not None else CANNED_ENTRIES

    def __len__(self) -> int:
        return len(self._entries)

    def entries(self) -> list[CannedEntry]:
        return list(self._entries)

    # ----- lookup helpers --------------------------------------------------

    def lookup_by_query(self, query: str) -> CannedEntry | None:
        normalized = query.lower().strip()
        if not normalized:
            return None
        for entry in self._entries:
            for kw in entry.keywords:
                if kw.lower() in normalized:
                    return entry
        return None

    def lookup_by_messages(self, messages: list[LLMMessage]) -> CannedEntry | None:
        """Look up using the last user-role message body."""
        for msg in reversed(messages):
            if msg.role == "user":
                return self.lookup_by_query(msg.content)
        return None

    # ----- return-as-LLMResponse helper -----------------------------------

    @staticmethod
    def to_llm_response(
        entry: CannedEntry,
        *,
        elapsed_ms: int | None = None,
    ) -> LLMResponse:
        return LLMResponse(
            content=entry.content,
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit=False,
            canned_hit=True,
            input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=elapsed_ms if elapsed_ms is not None else 0,
            call_id=f"canned-{entry.key}",
            fallback_chain=["canned_hit"],
        )


# ----- singleton accessor -------------------------------------------------


_singleton: CannedResponseStore | None = None


def get_canned_response_store() -> CannedResponseStore:
    global _singleton
    if _singleton is None:
        _singleton = CannedResponseStore()
    return _singleton


def reset_canned_response_store() -> None:
    """Test helper."""
    global _singleton
    _singleton = None


__all__ = [
    "CANNED_ENTRIES",
    "CannedEntry",
    "CannedResponseStore",
    "get_canned_response_store",
    "reset_canned_response_store",
]
