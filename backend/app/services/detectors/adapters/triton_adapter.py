"""Triton LLM client adapter for Argus security CVSS scoring.

Cycle 1: serves canned CVSS for 5 finding categories so dispatcher smoke can ship
before Triton wired into a test fixture. Cycle 3+: delegates to real LLMGateway
with Argus persona prompt + V4-Flash thinking low routing.

Per _meta/contracts/triton-to-nemesis.md.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.services.detectors.types import CVSSScore, FindingCategory

log = logging.getLogger("nemesis.triton_adapter")


_CANNED_CVSS_BY_CATEGORY: dict[FindingCategory, CVSSScore] = {
    "hardcoded-secret": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        base_score=9.8,
        exploit_pattern="CWE-798: Use of Hard-coded Credentials",
        mitigation=(
            "Rotate the credential immediately. Move to environment variable or "
            "secrets manager (HashiCorp Vault, AWS Secrets Manager). Add gitleaks "
            "pre-commit hook to block future leaks."
        ),
        references=["https://cwe.mitre.org/data/definitions/798.html"],
    ),
    "missing-auth": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        base_score=9.1,
        exploit_pattern="CWE-306: Missing Authentication for Critical Function",
        mitigation=(
            "Add authentication middleware on the route. For Express use "
            "passport.authenticate(), for FastAPI use Depends(get_current_user)."
        ),
        references=["https://cwe.mitre.org/data/definitions/306.html"],
    ),
    "unsafe-sql": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        base_score=9.8,
        exploit_pattern=(
            "CWE-89: Improper Neutralization of Special Elements used in an SQL Command"
        ),
        mitigation=(
            "Use parameterized queries or prepared statements. Never concatenate "
            "user input into SQL strings."
        ),
        references=["https://cwe.mitre.org/data/definitions/89.html"],
    ),
    "outdated-dependency": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        base_score=4.7,
        exploit_pattern="CWE-1104: Use of Unmaintained Third Party Components",
        mitigation=(
            "Upgrade to the patched version per OSV advisory. Pin the new version "
            "in the manifest and run dependency tests."
        ),
        references=["https://cwe.mitre.org/data/definitions/1104.html"],
    ),
    "complex-untested": CVSSScore(
        vector="CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N",
        base_score=3.4,
        exploit_pattern="CWE-1120: Excessive Code Complexity",
        mitigation=(
            "Refactor the function into smaller, single-responsibility units. Add "
            "unit test coverage on the new units before merging."
        ),
        references=["https://cwe.mitre.org/data/definitions/1120.html"],
    ),
}


_ARGUS_PERSONA_PROMPT = (
    "You are Argus, the watchful guardian resident of Codeplex Chronicle. "
    "Your role: assess security findings, assign CVSS 3.1 base score vectors, "
    "identify exploit patterns from public CVE databases, recommend mitigation "
    "steps with citation references.\n\n"
    "Output format: JSON object with keys cvss_vector (CVSS 3.1 vector string), "
    "cvss_base_score (float 0..10), exploit_pattern (CWE id + short description), "
    "mitigation (1-3 sentence remediation), references (list of CVE ids or vendor "
    "advisory URLs).\n\n"
    "Tone: clinical, brief, decisive. Cite sources. Never speculate beyond public records."
)


class TritonAdapter:
    """Adapter to Triton LLMGateway for Argus persona V4-Flash think low.

    Cycle 1 returns canned CVSS for known categories so dispatcher smoke can ship.
    Cycle 3+ wires real `llm.call()` with Argus persona prompt.
    """

    def __init__(self, real_llm: Any | None = None) -> None:
        self._real = real_llm
        self._is_stub = real_llm is None

    @property
    def is_stub(self) -> bool:
        return self._is_stub

    async def argus_cvss_score(
        self,
        category: FindingCategory,
        title: str,
        description: str,
    ) -> CVSSScore:
        """Score a security finding via Argus persona.

        Returns canned per-category result in stub mode. In real mode, calls
        Triton LLMGateway with V4-Flash thinking low + JSON-parse with regex
        fallback per `triton-to-nemesis.md` edge case handling.
        """
        if self._is_stub or self._real is None:
            canned = _CANNED_CVSS_BY_CATEGORY.get(category)
            if canned is not None:
                return canned
            return CVSSScore(
                vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L",
                base_score=5.0,
                exploit_pattern="CWE-Other: see references",
                mitigation="Manual security review required.",
                references=[],
            )

        try:
            messages = [
                {"role": "system", "content": _ARGUS_PERSONA_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Category: {category}\nTitle: {title}\n"
                        f"Description: {description}\n\n"
                        f"Return JSON only, no commentary."
                    ),
                },
            ]
            response = await self._real.call(
                messages=messages,
                resident="argus",
                max_tokens=400,
                temperature=0.2,
            )
            content = getattr(response, "content", str(response))
            return _parse_cvss_response(content, category)
        except Exception as exc:  # pragma: no cover - defensive
            log.warning("Argus CVSS LLM call failed; falling back to canned: %s", exc)
            canned = _CANNED_CVSS_BY_CATEGORY.get(category)
            if canned is not None:
                return canned
            raise


def _parse_cvss_response(content: str, category: FindingCategory) -> CVSSScore:
    """JSON parse with regex fallback. Per triton-to-nemesis.md edge cases."""
    try:
        data = json.loads(content)
        return CVSSScore(
            vector=str(data.get("cvss_vector", "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L")),
            base_score=max(0.0, min(10.0, float(data.get("cvss_base_score", 5.0)))),
            exploit_pattern=str(data.get("exploit_pattern", "CWE-Other")),
            mitigation=str(data.get("mitigation", "")),
            references=[str(r) for r in data.get("references", [])],
        )
    except (json.JSONDecodeError, ValueError, TypeError, KeyError):
        vec_match = re.search(r"CVSS:3\.1/[A-Z:/_]+", content)
        score_match = re.search(
            r"base[_\s]score[\s:\"]+([0-9]+\.?[0-9]*)", content, re.IGNORECASE
        )
        canned = _CANNED_CVSS_BY_CATEGORY.get(category)
        fallback_vector = (
            canned.vector if canned else "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L"
        )
        fallback_score = canned.base_score if canned else 5.0
        return CVSSScore(
            vector=vec_match.group(0) if vec_match else fallback_vector,
            base_score=(
                max(0.0, min(10.0, float(score_match.group(1))))
                if score_match
                else fallback_score
            ),
            exploit_pattern=canned.exploit_pattern if canned else "CWE-Other (parse fallback)",
            mitigation=content[:400] if content else (canned.mitigation if canned else ""),
            references=canned.references if canned else [],
        )


_singleton: TritonAdapter | None = None


def get_triton_adapter(force_real: bool = False) -> TritonAdapter:
    """Singleton accessor.

    Tries to import real LLMGateway via `app.services.llm_client.get_llm_client`.
    Falls back to stub mode if unavailable or in test env without API key.
    """
    global _singleton
    if _singleton is not None:
        return _singleton

    real = None
    try:
        from app.services.llm_client import get_llm_client

        real = get_llm_client()
    except (ImportError, AttributeError, KeyError, ValueError):
        if force_real:
            raise
        real = None

    _singleton = TritonAdapter(real_llm=real)
    return _singleton


def reset_triton_adapter() -> None:
    """Test helper: reset singleton so next call rebinds."""
    global _singleton
    _singleton = None
