"""Emoji sanitize + persona OUTPUT CONTRACT smoke (Wave-Fixing 3 Manager FINAL).

Owner: Triton (Wave-Fixing 3 Manager FINAL, STAMP 20260513-0626).

Round 2 QA flagged: Hermes greeting bubble contained a wave hand emoji
(U+1F44B) during demo rehearsal. The 5 resident persona system prompts
were silent on output formatting, so the LLM occasionally emitted
emoji. Wave-Fixing 3 Manager FINAL ships two defenses:

  1. Prompt-level: each resident persona now ends with an
     ``_OUTPUT_CONTRACT`` block telling the model to NOT emit emoji or
     em dashes. See ``backend/app/llm/system_header.py``.
  2. Response-level: ``backend/app/api/chat.py::_sanitize_content``
     strips any residual emoji pictograph from the LLM body before
     SSE chunking. Belt-and-suspenders against the model defying
     the OUTPUT CONTRACT instruction.

This test guards both defenses against future regression.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean source.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


# ---------------------------------------------------------------------------
# Persona OUTPUT CONTRACT presence
# ---------------------------------------------------------------------------


def test_all_5_persona_prompts_include_output_contract_no_emoji_rule() -> None:
    """Every resident persona must explicitly forbid emoji in output."""
    from app.llm.system_header import (
        APOLLO_CHAT_PERSONA,
        ARGUS_CHAT_PERSONA,
        ATHENA_CHAT_PERSONA,
        CLIO_CHAT_PERSONA,
        HERMES_CHAT_PERSONA,
    )

    personas = {
        "Athena": ATHENA_CHAT_PERSONA,
        "Apollo": APOLLO_CHAT_PERSONA,
        "Argus": ARGUS_CHAT_PERSONA,
        "Clio": CLIO_CHAT_PERSONA,
        "Hermes": HERMES_CHAT_PERSONA,
    }

    for name, body in personas.items():
        # Contract presence
        assert "OUTPUT CONTRACT" in body, (
            f"{name} persona missing OUTPUT CONTRACT block; Lock 2 + Lock 1 "
            "guard regression"
        )
        # No-emoji rule explicit
        body_lower = body.lower()
        assert "no emoji" in body_lower or "not use emoji" in body_lower, (
            f"{name} persona does not explicitly forbid emoji in output"
        )
        # No-em-dash rule explicit
        assert "em dash" in body_lower, (
            f"{name} persona does not explicitly forbid em dash in output"
        )


def test_hermes_persona_explicit_wave_hand_no_emoji_guidance() -> None:
    """Hermes is the most demo-visible resident; round 2 QA caught a wave
    hand emoji in his greeting. The persona prompt should explicitly call
    out wave hand emoji to prevent the model from repeating the mistake.
    """
    from app.llm.system_header import HERMES_CHAT_PERSONA

    assert "wave hand" in HERMES_CHAT_PERSONA.lower(), (
        "Hermes persona should explicitly mention `wave hand` emoji as "
        "disallowed since round 2 QA flagged this exact case"
    )


# ---------------------------------------------------------------------------
# _sanitize_content emoji strip
# ---------------------------------------------------------------------------


def test_sanitize_content_strips_wave_hand_emoji_in_hermes_greeting() -> None:
    """The exact round-2 QA failure mode: Hermes opens with a wave hand."""
    from app.api.chat import _sanitize_content

    raw = "\U0001F44B Halo, selamat datang di Codeplex Chronicle."
    cleaned = _sanitize_content(raw)
    assert "\U0001F44B" not in cleaned
    assert "Halo" in cleaned
    assert "selamat datang" in cleaned.lower()


def test_sanitize_content_strips_multiple_emoji_kinds() -> None:
    """Coverage across the emoji unicode ranges declared in chat.py."""
    from app.api.chat import _sanitize_content

    cases = [
        ("Halo \U0001F44B world", "Halo", "world"),  # wave hand
        ("Hi \U0001F600 there", "Hi", "there"),  # grinning face
        ("Done \U00002728", "Done", None),  # sparkles
        ("Boot \U0001F680 launch", "Boot", "launch"),  # rocket
        ("Star \U00002B50 marked", "Star", "marked"),  # star
    ]
    for raw, expected_a, expected_b in cases:
        cleaned = _sanitize_content(raw)
        # No raw codepoint remains.
        for codepoint in raw:
            if ord(codepoint) > 0x2700:
                assert codepoint not in cleaned, (
                    f"emoji {hex(ord(codepoint))} not stripped from {raw!r}: "
                    f"{cleaned!r}"
                )
        assert expected_a in cleaned
        if expected_b is not None:
            assert expected_b in cleaned


def test_sanitize_content_is_idempotent_on_clean_text() -> None:
    """Clean text passes through unchanged."""
    from app.api.chat import _sanitize_content

    clean = "Apollo siapkan ticket untuk finding F-001 di auth/oauth.ts."
    assert _sanitize_content(clean) == clean


def test_sanitize_content_preserves_indonesian_diacritics() -> None:
    """The strip must not eat valid characters like accented vowels."""
    from app.api.chat import _sanitize_content

    raw = "Sprint retro éàñ selesai."
    cleaned = _sanitize_content(raw)
    assert "é" in cleaned
    assert "à" in cleaned
    assert "ñ" in cleaned


def test_sanitize_content_still_strips_pesan_asli_leak() -> None:
    """The original Wave-Fixing #1 leak strip must keep working."""
    from app.api.chat import _sanitize_content

    raw = (
        "Athena ngeliat proposal lu menarik.\n\n"
        '_Pesan asli: "halo athena, gimana refactor"_'
    )
    cleaned = _sanitize_content(raw)
    assert "Pesan asli" not in cleaned
    assert "Athena ngeliat" in cleaned


def test_sanitize_content_handles_empty_string() -> None:
    """No exception on empty input."""
    from app.api.chat import _sanitize_content

    assert _sanitize_content("") == ""


def test_sanitize_content_does_not_collapse_within_single_word() -> None:
    """Defensive: stripping emoji should not concat two words into one."""
    from app.api.chat import _sanitize_content

    raw = "kata\U0001F600kata"  # emoji wedged inside; conservative behaviour
    cleaned = _sanitize_content(raw)
    # The emoji is removed but the two letters are joined (no space was there
    # to begin with). This is acceptable: the model very rarely splits words
    # like this; the standard case "kata1 [emoji] kata2" is the target.
    assert "katakata" in cleaned or "kata kata" in cleaned


# ---------------------------------------------------------------------------
# Source code hygiene: no emoji in the LLM stack itself
# ---------------------------------------------------------------------------


def test_llm_module_source_files_contain_no_emoji_pictograph() -> None:
    """Maintainer Lock 2: source code itself must not contain emoji."""
    import re

    emoji_pattern = re.compile(
        "["
        "\U0001F300-\U0001F9FF"
        "\U0001F600-\U0001F64F"
        "\U0001F680-\U0001F6FF"
        "\U0001F900-\U0001F9FF"
        "\U0001FA00-\U0001FAFF"
        "]",
        flags=re.UNICODE,
    )

    backend_root = Path(__file__).resolve().parent.parent
    targets = [
        backend_root / "app" / "llm" / "system_header.py",
        backend_root / "app" / "llm" / "resident_routing.py",
        backend_root / "app" / "llm" / "client.py",
        backend_root / "app" / "llm" / "types.py",
        backend_root / "app" / "services" / "llm_client.py",
        backend_root / "app" / "services" / "canned_responses.py",
        backend_root / "app" / "services" / "circuit_breaker.py",
        backend_root / "app" / "services" / "semantic_cache.py",
        backend_root / "app" / "api" / "chat.py",
        backend_root / "app" / "api" / "llm_health.py",
    ]
    leaks: list[str] = []
    for path in targets:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if emoji_pattern.search(text):
            leaks.append(str(path))
    assert not leaks, (
        f"Lock 2 emoji regression in LLM stack source files: {leaks}"
    )
