"""OpenSpec runtime subprocess wrapper (Demeter Wave 3).

Wraps `openspec` CLI for:
- `openspec list --specs --json`
- `openspec validate <change>`
- `openspec show <change> --diff`
- `openspec archive <change>`

Hackathon scope: Folder A (panitia) primary. Folder B (internal workflow) is
not invoked by Demeter; agents author Folder B manually.

Anti-pattern Lock 8: no paid services. OpenSpec CLI runs locally (subprocess),
no external API.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import shlex
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("demeter.openspec")


@dataclass
class OpenSpecResult:
    """Result of an OpenSpec subprocess invocation."""

    success: bool
    stdout: str
    stderr: str
    returncode: int


class OpenSpecRuntime:
    """Subprocess wrapper around the `openspec` CLI.

    Defaults to Folder A at `openspec/` (panitia-facing). Set `folder_path` to
    `.agent-openspec` for Folder B internal workflow.
    """

    def __init__(
        self,
        project_root: Path | None = None,
        folder_path: str = "openspec",
        bin_path: str = "openspec",
        timeout_seconds: float = 30.0,
    ) -> None:
        self._project_root = project_root or _resolve_project_root()
        self._folder_path = folder_path
        self._bin_path = bin_path
        self._timeout = timeout_seconds

    async def list_specs(self) -> OpenSpecResult:
        """Run `openspec list --specs --json` and return raw output."""
        return await self._run(["list", "--specs", "--json"])

    async def list_specs_parsed(self) -> list[dict]:
        """List specs, parse JSON to list[dict]."""
        result = await self.list_specs()
        if not result.success:
            return []
        try:
            data = json.loads(result.stdout)
            if isinstance(data, dict) and "specs" in data:
                return data["specs"]
            if isinstance(data, list):
                return data
            return []
        except json.JSONDecodeError as exc:
            logger.warning("openspec list parse failed: %s", exc)
            return []

    async def validate(self, change_id: str | None = None) -> OpenSpecResult:
        """Run `openspec validate [<change>]`."""
        args = ["validate"]
        if change_id:
            args.append(change_id)
        return await self._run(args)

    async def show(self, change_id: str, diff: bool = True) -> OpenSpecResult:
        """Run `openspec show <change> [--diff]`."""
        args = ["show", change_id]
        if diff:
            args.append("--diff")
        return await self._run(args)

    async def archive(self, change_id: str) -> OpenSpecResult:
        """Run `openspec archive <change>`."""
        return await self._run(["archive", change_id])

    async def _run(self, args: list[str]) -> OpenSpecResult:
        cmd = [self._bin_path, *args]
        cwd = self._project_root
        logger.info("openspec exec cwd=%s cmd=%s", cwd, " ".join(shlex.quote(c) for c in cmd))

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(cwd),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env={**os.environ},
            )
            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=self._timeout
                )
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                return OpenSpecResult(
                    success=False,
                    stdout="",
                    stderr=f"timeout after {self._timeout}s",
                    returncode=-1,
                )
            return OpenSpecResult(
                success=proc.returncode == 0,
                stdout=stdout.decode("utf-8", errors="replace"),
                stderr=stderr.decode("utf-8", errors="replace"),
                returncode=proc.returncode or 0,
            )
        except FileNotFoundError:
            return OpenSpecResult(
                success=False,
                stdout="",
                stderr=f"openspec binary not found at {self._bin_path}",
                returncode=-2,
            )


def _resolve_project_root() -> Path:
    """Project root = parent of backend/."""
    return Path(__file__).resolve().parent.parent.parent.parent


__all__ = ["OpenSpecRuntime", "OpenSpecResult"]
