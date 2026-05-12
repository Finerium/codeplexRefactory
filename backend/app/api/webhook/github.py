"""GitHub webhook receiver (Hades Wave 3).

POST /api/webhook/github

Steps:
1. HMAC SHA-256 verify on `X-Hub-Signature-256` using GITHUB_WEBHOOK_SECRET.
2. Dedup by `X-GitHub-Delivery` header (in-memory LRU 1024 entries).
3. Translate webhook event payload to BuildingEvent list (14-type union).
4. Publish each event to event_bus topic 'building_events' (Hera consumes via
   WebSocket fanout).
5. Persist each event to Demeter `pr_events` (stub cycle 1, real cycle 2).
6. Return 200 with delivery_id + event_count.

Cycle 1 status: REAL HMAC verify + dispatch + event_bus publish + Demeter
                stub persist. (No half-stub; HMAC is critical security floor
                per PRD Section 19.)
"""
from __future__ import annotations

import hashlib
import hmac
import logging
from collections import OrderedDict

from fastapi import APIRouter, Header, HTTPException, Request

from app.config import get_settings
from app.services.demeter_service import PREventPersist, get_demeter_service
from app.services.event_bus import get_event_bus
from app.services.translate_webhook import translate_webhook_to_building_events

logger = logging.getLogger("hades.api.webhook.github")

router = APIRouter(prefix="/webhook", tags=["webhook"])


# LRU dedup of recent X-GitHub-Delivery ids (in-memory, single pod replica).
_DELIVERY_CACHE_MAX = 1024
_delivery_cache: OrderedDict[str, bool] = OrderedDict()


def _verify_hmac(secret: bytes, body: bytes, signature_header: str) -> bool:
    """Constant-time HMAC SHA-256 compare against X-Hub-Signature-256."""
    if not signature_header or "=" not in signature_header:
        return False
    algo, _, provided = signature_header.partition("=")
    if algo.lower() != "sha256":
        return False
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
    try:
        return hmac.compare_digest(expected, provided.lower())
    except Exception:
        return False


def _seen_delivery(delivery_id: str) -> bool:
    """Track X-GitHub-Delivery in LRU; return True if duplicate."""
    if not delivery_id:
        # Without delivery id we cannot dedup; treat as fresh (caller logs).
        return False
    if delivery_id in _delivery_cache:
        # Refresh recency.
        _delivery_cache.move_to_end(delivery_id)
        return True
    _delivery_cache[delivery_id] = True
    if len(_delivery_cache) > _DELIVERY_CACHE_MAX:
        _delivery_cache.popitem(last=False)
    return False


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256"),
    x_github_event: str | None = Header(default=None, alias="X-GitHub-Event"),
    x_github_delivery: str | None = Header(default=None, alias="X-GitHub-Delivery"),
) -> dict:
    """Receive + verify + dispatch GitHub webhook.

    Returns:
        200 {"received": True, "delivery_id": <str>, "events": <int>, "duplicate": <bool>}
        401 if HMAC mismatch
        400 if missing required headers / malformed body
    """
    settings = get_settings()

    # Required headers.
    if not x_hub_signature_256:
        raise HTTPException(status_code=401, detail="missing X-Hub-Signature-256 header")
    if not x_github_event:
        raise HTTPException(status_code=400, detail="missing X-GitHub-Event header")

    body = await request.body()

    # HMAC verify (mandatory per PRD Section 19 + Aletheia critical audit gate).
    secret = settings.GITHUB_WEBHOOK_SECRET.encode("utf-8")
    if not _verify_hmac(secret, body, x_hub_signature_256):
        logger.warning(
            "webhook HMAC mismatch event=%s delivery=%s",
            x_github_event,
            x_github_delivery,
        )
        raise HTTPException(status_code=401, detail="invalid HMAC signature")

    # Dedup.
    delivery_id = x_github_delivery or ""
    duplicate = _seen_delivery(delivery_id)
    if duplicate:
        logger.info(
            "webhook duplicate delivery, skipping fanout event=%s delivery=%s",
            x_github_event,
            delivery_id,
        )
        return {
            "received": True,
            "delivery_id": delivery_id,
            "events": 0,
            "duplicate": True,
        }

    # Parse JSON body.
    try:
        payload = await request.json()
    except Exception as exc:
        logger.warning("webhook json parse failed: %s", exc)
        raise HTTPException(status_code=400, detail="malformed JSON body") from exc

    # Translate to BuildingEvent fanout list.
    events = translate_webhook_to_building_events(x_github_event, payload)

    # Publish + persist (in parallel, since both are async-safe).
    event_bus = get_event_bus()
    demeter = get_demeter_service()

    repo_full = (payload.get("repository") or {}).get("full_name", "")

    publish_count = 0
    for ev in events:
        # Publish to event bus.
        try:
            await event_bus.publish("building_events", ev)
            publish_count += 1
        except Exception as exc:
            logger.warning("event_bus publish failed: %s", exc)

        # Persist to Demeter (stub cycle 1).
        try:
            persist_payload = PREventPersist(
                event_type=ev["type"],
                delivery_id=delivery_id,
                building_id=ev.get("buildingId") or None,
                repo_full_name=repo_full,
                resource_number=int(ev.get("resourceNumber") or 0),
                resource_title=(ev.get("payload") or {}).get("prTitle")
                or (ev.get("payload") or {}).get("issueTitle")
                or "",
                author_login=(ev.get("payload") or {}).get("authorLogin", ""),
                files_changed=(ev.get("payload") or {}).get("filesChanged", []) or [],
                lines_added=None,
                lines_deleted=None,
                story_points=(ev.get("payload") or {}).get("storyPoints"),
                assignee_login=(ev.get("payload") or {}).get("assignee"),
                payload=ev.get("payload", {}),
                received_at=ev["timestamp"],
            )
            await demeter.persist_pr_event(persist_payload)
        except Exception as exc:
            logger.warning(
                "demeter persist failed (non-fatal in cycle 1 stub): %s", exc
            )

    logger.info(
        "webhook ok event=%s delivery=%s events=%d (published %d)",
        x_github_event,
        delivery_id,
        len(events),
        publish_count,
    )
    return {
        "received": True,
        "delivery_id": delivery_id,
        "events": len(events),
        "duplicate": False,
    }
