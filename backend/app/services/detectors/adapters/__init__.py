"""Adapter layer bridging Nemesis detectors to Hades, Triton, Demeter, event_bus.

Each adapter exposes a thin Protocol-friendly surface; cycle 1 ships callable
stubs when upstream not yet ready; cycle 2+ delegates to real implementations.
Upstream Wave 3 cycle 1 stubs already in tree:
- Hades parsers: backend/app/parsers (REAL parser ready)
- Triton LLM gateway: backend/app/services/llm_client (REAL gateway ready)
- Demeter Protocol: backend/app/services/demeter_service (Protocol + StubDemeterService)
- Event bus: backend/app/services/event_bus (REAL EventBus ready)
"""

from app.services.detectors.adapters.hades_adapter import (
    ParserAdapter,
    get_parser_adapter,
    reset_parser_adapter,
)
from app.services.detectors.adapters.triton_adapter import (
    TritonAdapter,
    get_triton_adapter,
    reset_triton_adapter,
)
from app.services.detectors.adapters.demeter_adapter import (
    DemeterAdapter,
    get_demeter_adapter,
    reset_demeter_adapter,
)
from app.services.detectors.adapters.ws_publisher_adapter import (
    WSPublisherAdapter,
    get_ws_adapter,
    reset_ws_adapter,
)

__all__ = [
    "ParserAdapter",
    "get_parser_adapter",
    "reset_parser_adapter",
    "TritonAdapter",
    "get_triton_adapter",
    "reset_triton_adapter",
    "DemeterAdapter",
    "get_demeter_adapter",
    "reset_demeter_adapter",
    "WSPublisherAdapter",
    "get_ws_adapter",
    "reset_ws_adapter",
]
