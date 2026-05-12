"""Service layer (Hades Wave 3).

- event_bus: in-memory pubsub for WebSocket fanout
- demeter_service: Protocol-based stub (Demeter worker fills out real impl)
- translate_webhook: GitHub webhook to BuildingEvent translator (14-type union)
- auth_session: JWT cookie sign/verify helper
- crypto: AES-256-GCM token encryption helper (placeholder for Demeter)
"""
