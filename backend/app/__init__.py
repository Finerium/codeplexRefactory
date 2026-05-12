"""Codeplex Chronicle backend (Hades Wave 3).

Backend foundation: FastAPI async + tree-sitter 11-language parser + GitHub OAuth
real flow + webhook receiver HMAC + WebSocket 3 channel.

Anti-pattern compliance per `.claude/skills/anti-pattern-locks/SKILL.md` 10 locks.
"""

__version__ = "0.1.0"
