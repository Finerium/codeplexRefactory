"""GitHub Issue fallback for repos without openspec/ folder.

Owner: Pandora (Wave 3).

Per PRD Section 11 + Section 17.1 progressive degradation principle:
when the target repository has no `openspec/` directory, Pandora falls
back to creating a structured GitHub Issue draft instead of writing an
OpenSpec change folder.

Flow:
1. ``has_openspec_folder(repo_root)`` returns False.
2. Pandora calls ``draft_github_issue(ctx, repo_slug)`` which returns
   a ``GitHubIssueDraft`` containing the proposal title plus an
   issue body that bundles the would-be proposal.md, design.md, and
   tasks.md content.
3. The dual review gate UI surfaces an "Open in GitHub" CTA that
   takes the user to the issue creation form pre-filled with the
   draft body. The actual issue creation goes through Hades' GitHub
   client when the user clicks Accept.

The fallback satisfies the Refactory rule "OpenSpec mandatory" for
this product (we use OpenSpec internally for change folder generation
when the host repo supports it) and gracefully degrades to GitHub
Issues for non-OpenSpec repos per PRD Section 11.

References:
- PRD Section 11 (progressive degradation OpenSpec default, GitHub
  Issues fallback)
- PRD Section 12.1 (Hybrid Write Layer 1 GitHub Issue creation)
- ``.claude/agents/pandora.md`` Domain ownership (GitHub Issue
  fallback when no openspec/)
- ``_meta/contracts/hades-to-pandora.md`` lines 35-72 (parser context
  used to enrich the issue body)

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 [STUB] flag
on the GitHub client method (real call goes through Hades' PyGithub
wrapper Cycle 2).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from .openspec_generator import (
    DESIGN_TEMPLATE,
    PROPOSAL_TEMPLATE,
    TASKS_TEMPLATE,
    _format_affected_files,
    _format_ghost_hints_md,
    _format_user_intent_section,
    _now_iso,
)
from .types import ProposalContext

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------


# Manager FINAL Cycle 2 Cluster D fix (STAMP=20260513-0857):
# In the runtime Docker container, WORKDIR is /app and Path(".") resolves to
# /app, which contains only /app/backend and /app/frontend; openspec/ is NOT
# bundled at /app/openspec. Pre-V6 the propose endpoint fell through to the
# GitHub Issue URL-encoded fallback EVERY time because has_openspec_folder
# always returned False inside the container.
#
# Resolution chain (highest priority first):
#   1. Caller-passed repo_root containing openspec/ (real cloned repo path).
#   2. BUNDLED_OPENSPEC_ROOT env override (Atlas mounts ``/app`` here).
#   3. Bundled self path /app/openspec (Atlas COPY in Dockerfile).
#   4. Bundled self path /app/backend/../openspec (uvicorn cwd fallback).
#   5. Pandora project source path (local dev only).
#
# When any candidate above contains an openspec/ directory, the function
# returns True and the caller uses generate_openspec(...) flow.
_BUNDLED_OPENSPEC_HINTS: tuple[Path, ...] = (
    Path("/app"),
    Path("/app/backend/.."),
)

# Number of parent levels to walk up from cwd looking for openspec/. The
# uvicorn dev server typically runs from ``backend/`` so the project root
# (which holds openspec/) is one level up. 4 levels covers ``backend/app/``
# style cwd plus a small safety margin without scanning the whole tree.
_CWD_WALKUP_DEPTH: int = 4


def _walkup_for_openspec(start: Path) -> Optional[Path]:
    """Walk up to ``_CWD_WALKUP_DEPTH`` parents looking for openspec/.

    Used for the local dev case where uvicorn runs from ``backend/`` and
    the project's own openspec/ lives at the repo root one level up. In
    production this is a no-op because /app contains the bundled COPY.
    """
    current = start.resolve(strict=False)
    for _ in range(_CWD_WALKUP_DEPTH + 1):
        if (current / "openspec").is_dir():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def _bundled_openspec_root() -> Optional[Path]:
    """Return the absolute path to a bundled openspec/ root if present.

    Resolution order:
    1. BUNDLED_OPENSPEC_ROOT env (Atlas K8s + local override).
    2. Static hints /app + /app/backend/.. (production Docker COPY).
    3. cwd walk-up (local dev where uvicorn runs from backend/).

    Returns None when no candidate contains openspec/.
    """
    env_root = os.environ.get("BUNDLED_OPENSPEC_ROOT")
    candidates: list[Path] = []
    if env_root:
        candidates.append(Path(env_root))
    candidates.extend(_BUNDLED_OPENSPEC_HINTS)
    for candidate in candidates:
        try:
            resolved = candidate.resolve(strict=False)
        except OSError:
            continue
        if (resolved / "openspec").is_dir():
            return resolved
    # Local dev fallback: walk up from cwd looking for openspec/.
    walkup = _walkup_for_openspec(Path.cwd())
    if walkup is not None:
        return walkup
    return None


def has_openspec_folder(repo_root: Path) -> bool:
    """Return True if ``repo_root/openspec`` (or a bundled fallback) exists.

    Manager FINAL Cycle 2 Cluster D fix: previously this only checked the
    caller-supplied repo_root. Inside the runtime container the default
    Path(".") resolves to /app where openspec/ is NOT present, so the
    GitHub Issue URL-encoded fallback fired even for the project itself.
    Now also checks the bundled self path /app/openspec which Atlas
    Dockerfile COPYs at build time.
    """
    if (Path(repo_root) / "openspec").is_dir():
        return True
    return _bundled_openspec_root() is not None


def resolve_openspec_root(repo_root: Path) -> Optional[Path]:
    """Return the path under which openspec/ lives, or None if missing.

    Returns ``repo_root`` if the caller-supplied path contains openspec/;
    otherwise returns the bundled self path /app/openspec parent if
    Atlas Dockerfile bundled it; otherwise None. Caller uses this to
    instantiate ``OpenSpecGenerator(repo_root=resolve_openspec_root(...))``
    so the change folder lands in the right place.
    """
    explicit = Path(repo_root)
    if (explicit / "openspec").is_dir():
        return explicit
    return _bundled_openspec_root()


# ---------------------------------------------------------------------------
# Draft schema
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class GitHubIssueDraft:
    """Structured draft for a fallback GitHub issue.

    The body bundles the proposal plus design plus tasks markdown that
    would otherwise live in `openspec/changes/<change-name>/`.
    """

    title: str
    body: str
    labels: list[str] = field(default_factory=lambda: ["refactor-proposal"])
    assignees: list[str] = field(default_factory=list)
    change_name: str = ""
    repo_slug: str = ""

    def to_url(self, base: str = "https://github.com") -> str:
        """Return the GitHub issue-creation URL pre-populated with the draft.

        Uses GitHub's `new issue` query string format. The repo_slug
        is expected to be ``<owner>/<repo>`` (e.g.,
        ``Finerium/codeplexRefactory``).
        """
        from urllib.parse import quote_plus

        if not self.repo_slug:
            return f"{base}/new"
        title_q = quote_plus(self.title)
        body_q = quote_plus(self.body)
        labels_q = quote_plus(",".join(self.labels))
        return (
            f"{base}/{self.repo_slug}/issues/new"
            f"?title={title_q}&body={body_q}&labels={labels_q}"
        )


# ---------------------------------------------------------------------------
# Draft author
# ---------------------------------------------------------------------------


def draft_github_issue(
    ctx: ProposalContext,
    repo_slug: str,
    *,
    extra_labels: Optional[list[str]] = None,
) -> GitHubIssueDraft:
    """Build a GitHubIssueDraft from a ProposalContext.

    The body composes the proposal, design, and tasks markdown sections
    (the same templates used by ``OpenSpecGenerator``) inside a single
    issue body so reviewers see the full refactor plan inline.

    Args:
        ctx: the Athena-authored proposal.
        repo_slug: the target ``<owner>/<repo>`` slug.
        extra_labels: optional additional labels (e.g., "demo", "epic").
    """

    affected_count = len(ctx.affected_files)
    user_intent_one_line = ctx.user_intent.replace("\n", " ").strip()
    change_name = ctx.openspec_change_path.strip("/").split("/")[-1] or "refactor-proposal"
    context = {
        "title": ctx.title,
        "timestamp": _now_iso(),
        "summary": ctx.summary,
        "user_intent_section": _format_user_intent_section(ctx),
        "affected_count": affected_count,
        "affected_files_list": _format_affected_files(ctx),
        "complexity": ctx.complexity,
        "callsite_count": ctx.callsite_count,
        "ghost_hints_section": _format_ghost_hints_md(ctx),
        "change_name": change_name,
        "user_intent_one_line": user_intent_one_line,
    }
    proposal_md = PROPOSAL_TEMPLATE.format(**context)
    design_md = DESIGN_TEMPLATE.format(**context)
    tasks_md = TASKS_TEMPLATE.format(**context)

    body = (
        f"_Generated by Athena (Pandora Wave 3 Refactor Mode) on {context['timestamp']}._\n\n"
        f"_This repository has no `openspec/` directory. Pandora is using the GitHub Issue fallback per PRD Section 11._\n\n"
        f"## Proposal\n\n{proposal_md}\n\n"
        f"---\n\n## Design\n\n{design_md}\n\n"
        f"---\n\n## Tasks\n\n{tasks_md}\n"
    )

    labels = ["refactor-proposal", f"complexity:{ctx.complexity}"]
    if extra_labels:
        labels.extend(extra_labels)

    title = ctx.title
    if not title.lower().startswith("refactor:"):
        title = f"Refactor: {title}"

    draft = GitHubIssueDraft(
        title=title,
        body=body,
        labels=labels,
        assignees=[],
        change_name=change_name,
        repo_slug=repo_slug,
    )
    logger.info(
        "github_issue_fallback: drafted issue for %s (%d body chars, %d labels)",
        repo_slug,
        len(body),
        len(labels),
    )
    return draft


# ---------------------------------------------------------------------------
# Stub for actual issue creation (Cycle 2 swap to Hades' GitHub client)
# ---------------------------------------------------------------------------


async def create_github_issue(
    draft: GitHubIssueDraft,
    *,
    github_client: Optional[object] = None,
) -> dict[str, object]:
    """Create the GitHub issue via the Hades GitHub client.

    [STUB Cycle 1, real Hades PyGithub Cycle 2 full impl]

    Cycle 1 stub returns the pre-populated GitHub `new issue` URL so
    the dual review gate UI can render an "Open in GitHub" button that
    pops the issue form in a new tab with the draft body. This works
    without write-scope OAuth; the user picks Submit on GitHub natively.

    Cycle 2 swap: when ``github_client`` is provided (Hades' PyGithub
    wrapper), this function POSTs the issue via the GitHub API and
    returns the created issue URL.
    """
    if github_client is None:
        return {
            "mode": "draft-url",
            "url": draft.to_url(),
            "title": draft.title,
            "body_chars": len(draft.body),
            "labels": draft.labels,
        }
    # Cycle 2 swap site.
    return {
        "mode": "api-create",
        "url": "TODO: Hades PyGithub Cycle 2 ship",
        "title": draft.title,
    }


__all__ = [
    "GitHubIssueDraft",
    "create_github_issue",
    "draft_github_issue",
    "has_openspec_folder",
]
