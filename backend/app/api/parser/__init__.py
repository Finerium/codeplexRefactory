"""Parser HTTP wrapper API (Hades Wave 3).

Pythia contract `_meta/contracts/hades-to-nemesis.md` Section 'Storage location':
in-process Wave 3 default (Nemesis imports `get_parser_service` directly).
HTTP wrapper kept for cross-process call OR external automation testing.

Endpoints:
- POST /api/parser/parse-repo
- POST /api/parser/parse-file
- POST /api/parser/query-tree
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.parsers import ParsedFile, ParsedRepo, get_parser_service

logger = logging.getLogger("hades.api.parser")

router = APIRouter(prefix="/parser", tags=["parser"])


class ParseRepoRequest(BaseModel):
    repo_root: str
    exclude_globs: list[str] | None = None


class ParseFileRequest(BaseModel):
    file_path: str


class QueryTreeRequest(BaseModel):
    file_path: str
    query_source: str


@router.post("/parse-repo", response_model=ParsedRepo)
async def parse_repo_endpoint(body: ParseRepoRequest) -> ParsedRepo:
    """Parse entire repo. In-process call preferred for Nemesis batch scan."""
    repo_root = Path(body.repo_root)
    if not repo_root.is_dir():
        raise HTTPException(status_code=400, detail=f"repo_root not a directory: {body.repo_root}")
    svc = get_parser_service()
    return await svc.parse_repo(repo_root, exclude_globs=body.exclude_globs)


@router.post("/parse-file", response_model=ParsedFile)
async def parse_file_endpoint(body: ParseFileRequest) -> ParsedFile:
    """Parse single file. Pandora drafts verify uses this."""
    fp = Path(body.file_path)
    if not fp.is_file():
        raise HTTPException(status_code=400, detail=f"file_path not a file: {body.file_path}")
    svc = get_parser_service()
    return await svc.parse_file(fp)


@router.post("/query-tree", response_model=list[dict])
async def query_tree_endpoint(body: QueryTreeRequest) -> list[dict]:
    """Run tree-sitter query DSL on file AST."""
    fp = Path(body.file_path)
    if not fp.is_file():
        raise HTTPException(status_code=400, detail=f"file_path not a file: {body.file_path}")
    svc = get_parser_service()
    try:
        return await svc.query_tree(fp, body.query_source)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
