"""DeepSeek V4 cost estimator per PRD Section 18.1 pricing.

Owner: Triton (Wave 3).

Pricing snapshot (PRD Section 18.1, captured 2026-05-12):
- V4-Flash: $0.14 input / $0.28 output per 1M tokens.
- V4-Pro:   $1.74 input / $3.48 output per 1M tokens (75 percent off until
  2026-05-31 15:59 UTC).

The estimator is intentionally conservative: it charges the cache hit token
slice at the full input rate because DeepSeek API has not published explicit
cache hit pricing as of Phase B research. Over-estimating cost is safe for
the $5 Hafiz throwaway budget tracker; under-estimating risks burning through
the budget mid-demo.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): conservative cache hit pricing documented.
- Lock 8 (paid services): real-time cost tracking enforces the $5 cap.
"""

from __future__ import annotations

from app.llm.types import ModelType

PRICING_PER_1M: dict[ModelType, dict[str, float]] = {
    "V4-Flash": {"input": 0.14, "output": 0.28},
    "V4-Pro": {"input": 1.74, "output": 3.48},
}


def estimate_cost_usd(
    input_tokens: int,
    output_tokens: int,
    model: ModelType,
) -> float:
    """Compute USD cost for an LLM call given token counts plus model type.

    Args:
        input_tokens: total prompt tokens (cache hit slice charged at full rate
            per Lock 5 conservative posture).
        output_tokens: completion tokens billed at output rate.
        model: ``V4-Flash`` or ``V4-Pro`` per PRD Section 18.1 pricing rows.

    Returns:
        Cost in USD, rounded to 6 decimal places.
    """
    pricing = PRICING_PER_1M[model]
    input_usd = (max(input_tokens, 0) / 1_000_000) * pricing["input"]
    output_usd = (max(output_tokens, 0) / 1_000_000) * pricing["output"]
    return round(input_usd + output_usd, 6)


__all__ = ["PRICING_PER_1M", "estimate_cost_usd"]
