"""Manifest file parser for 7 ecosystem dependency manifests.

Per drift algo decision doc Cycle 2 spec: parse package.json (npm), requirements.txt
(PyPI), go.mod (Go), Cargo.toml (crates.io), pom.xml (Maven), Gemfile (rubygems),
composer.json (Packagist). Returns list of (ecosystem, name, version, line_no)
tuples.

Tolerant parsing: best-effort, skip entries without pinned version.
"""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:  # pragma: no cover
    import tomli as tomllib  # type: ignore[no-redef]


@dataclass(frozen=True)
class ManifestDep:
    ecosystem: str
    name: str
    version: str
    file_path: str
    line_start: int


MANIFEST_FILENAMES = (
    "package.json",
    "requirements.txt",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "Gemfile",
    "composer.json",
)


def _strip_version(raw: str) -> str:
    """Normalize a version spec to a canonical version string for OSV query.

    OSV accepts plain version like '1.4.0'. Strip prefix `^`, `~`, `>=`, `=`,
    quotes, and trailing constraint operators. If multi-version (range), pick
    the first concrete-looking token.
    """
    raw = raw.strip().strip('"').strip("'").strip(",")
    raw = re.sub(r"^[\^~=<>!]+\s*", "", raw)
    # Pick the first concrete version token (numeric.numeric.*)
    match = re.search(r"\d+(?:\.\d+)+", raw)
    if match:
        return match.group(0)
    return raw


def parse_package_json(file_path: Path) -> list[ManifestDep]:
    try:
        text = file_path.read_text(encoding="utf-8")
        data = json.loads(text)
    except (OSError, json.JSONDecodeError):
        return []
    deps_sections = ("dependencies", "devDependencies", "peerDependencies")
    out: list[ManifestDep] = []
    lines = text.splitlines()
    for section in deps_sections:
        deps = data.get(section, {}) or {}
        if not isinstance(deps, dict):
            continue
        for name, version in deps.items():
            if not isinstance(version, str):
                continue
            ver = _strip_version(version)
            if not ver:
                continue
            line_no = _find_first_line_containing(lines, f'"{name}"')
            out.append(
                ManifestDep(
                    ecosystem="npm",
                    name=str(name),
                    version=ver,
                    file_path=str(file_path),
                    line_start=line_no,
                )
            )
    return out


def parse_requirements_txt(file_path: Path) -> list[ManifestDep]:
    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out: list[ManifestDep] = []
    pattern = re.compile(r"^\s*([A-Za-z0-9._\-]+)\s*([<>=!~]+)\s*([0-9][0-9A-Za-z._\-+]*)")
    for idx, line in enumerate(lines, start=1):
        if not line.strip() or line.strip().startswith("#") or line.strip().startswith("-"):
            continue
        match = pattern.match(line)
        if not match:
            continue
        name, _op, version = match.groups()
        ver = _strip_version(version)
        if not ver:
            continue
        out.append(
            ManifestDep(
                ecosystem="PyPI",
                name=name,
                version=ver,
                file_path=str(file_path),
                line_start=idx,
            )
        )
    return out


def parse_go_mod(file_path: Path) -> list[ManifestDep]:
    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out: list[ManifestDep] = []
    in_require_block = False
    single_require = re.compile(r"^\s*require\s+([^\s]+)\s+([^\s]+)")
    block_entry = re.compile(r"^\s*([^\s]+)\s+([^\s]+)")
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("//"):
            continue
        if stripped.startswith("require ("):
            in_require_block = True
            continue
        if in_require_block and stripped == ")":
            in_require_block = False
            continue
        if in_require_block:
            match = block_entry.match(line)
            if match:
                name, version = match.groups()
                ver = _strip_version(version)
                if ver:
                    out.append(
                        ManifestDep(
                            ecosystem="Go",
                            name=name,
                            version=ver,
                            file_path=str(file_path),
                            line_start=idx,
                        )
                    )
            continue
        match = single_require.match(line)
        if match:
            name, version = match.groups()
            ver = _strip_version(version)
            if ver:
                out.append(
                    ManifestDep(
                        ecosystem="Go",
                        name=name,
                        version=ver,
                        file_path=str(file_path),
                        line_start=idx,
                    )
                )
    return out


def parse_cargo_toml(file_path: Path) -> list[ManifestDep]:
    try:
        raw = file_path.read_bytes()
        data = tomllib.loads(raw.decode("utf-8"))
    except (OSError, tomllib.TOMLDecodeError, UnicodeDecodeError):
        return []
    out: list[ManifestDep] = []
    try:
        text_lines = file_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        text_lines = []
    sections = ("dependencies", "dev-dependencies", "build-dependencies")
    for section in sections:
        deps = data.get(section, {}) or {}
        if not isinstance(deps, dict):
            continue
        for name, spec in deps.items():
            version_str = ""
            if isinstance(spec, str):
                version_str = spec
            elif isinstance(spec, dict):
                version_str = str(spec.get("version", ""))
            ver = _strip_version(version_str)
            if not ver:
                continue
            line_no = _find_first_line_containing(text_lines, f"{name} ")
            out.append(
                ManifestDep(
                    ecosystem="crates.io",
                    name=str(name),
                    version=ver,
                    file_path=str(file_path),
                    line_start=line_no,
                )
            )
    return out


def parse_pom_xml(file_path: Path) -> list[ManifestDep]:
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except (OSError, ET.ParseError):
        return []
    out: list[ManifestDep] = []
    # Handle default namespace
    ns_match = re.match(r"\{(.+)\}", root.tag or "")
    ns = {"m": ns_match.group(1)} if ns_match else {}
    deps_xpath = ".//m:dependency" if ns else ".//dependency"
    for dep in root.findall(deps_xpath, ns):
        group = dep.find("m:groupId" if ns else "groupId", ns)
        artifact = dep.find("m:artifactId" if ns else "artifactId", ns)
        version = dep.find("m:version" if ns else "version", ns)
        if group is None or artifact is None or version is None:
            continue
        if not group.text or not artifact.text or not version.text:
            continue
        full_name = f"{group.text.strip()}:{artifact.text.strip()}"
        ver = _strip_version(version.text)
        if not ver:
            continue
        out.append(
            ManifestDep(
                ecosystem="Maven",
                name=full_name,
                version=ver,
                file_path=str(file_path),
                line_start=1,
            )
        )
    return out


def parse_gemfile(file_path: Path) -> list[ManifestDep]:
    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    out: list[ManifestDep] = []
    pattern = re.compile(
        r"""^\s*gem\s+['"]([^'"]+)['"]\s*,?\s*['"]?([~^<>=!\s]*[0-9][0-9A-Za-z._\-+~^<>=!]*)?['"]?"""
    )
    for idx, line in enumerate(lines, start=1):
        if line.strip().startswith("#"):
            continue
        match = pattern.match(line)
        if not match:
            continue
        name, version = match.groups()
        if not version:
            continue
        ver = _strip_version(version)
        if not ver:
            continue
        out.append(
            ManifestDep(
                ecosystem="RubyGems",
                name=name,
                version=ver,
                file_path=str(file_path),
                line_start=idx,
            )
        )
    return out


def parse_composer_json(file_path: Path) -> list[ManifestDep]:
    try:
        text = file_path.read_text(encoding="utf-8")
        data = json.loads(text)
    except (OSError, json.JSONDecodeError):
        return []
    out: list[ManifestDep] = []
    lines = text.splitlines()
    for section in ("require", "require-dev"):
        deps = data.get(section, {}) or {}
        if not isinstance(deps, dict):
            continue
        for name, version in deps.items():
            if not isinstance(version, str):
                continue
            ver = _strip_version(version)
            if not ver:
                continue
            line_no = _find_first_line_containing(lines, f'"{name}"')
            out.append(
                ManifestDep(
                    ecosystem="Packagist",
                    name=str(name),
                    version=ver,
                    file_path=str(file_path),
                    line_start=line_no,
                )
            )
    return out


def _find_first_line_containing(lines: list[str], token: str) -> int:
    for idx, line in enumerate(lines, start=1):
        if token in line:
            return idx
    return 1


_PARSERS = {
    "package.json": parse_package_json,
    "requirements.txt": parse_requirements_txt,
    "go.mod": parse_go_mod,
    "Cargo.toml": parse_cargo_toml,
    "pom.xml": parse_pom_xml,
    "Gemfile": parse_gemfile,
    "composer.json": parse_composer_json,
}


def find_manifest_files(repo_root: Path) -> list[Path]:
    """Walk repo_root for known manifest filenames (top 3 levels only)."""
    found: list[Path] = []
    if not repo_root.exists():
        return found
    if not repo_root.is_dir():
        if repo_root.name in MANIFEST_FILENAMES:
            return [repo_root]
        return found
    skip_dirs = {"node_modules", ".git", ".venv", "__pycache__", "target", "dist", "build", "vendor"}
    for path in repo_root.rglob("*"):
        # Skip if any part of the relative path is in the skip set.
        try:
            rel_parts = path.relative_to(repo_root).parts
        except ValueError:
            continue
        if any(part in skip_dirs for part in rel_parts):
            continue
        if len(rel_parts) > 4:  # cap depth
            continue
        if path.is_file() and path.name in MANIFEST_FILENAMES:
            found.append(path)
    return found


def parse_all_manifests(repo_root: Path) -> list[ManifestDep]:
    """Walk repo and parse every manifest found."""
    deps: list[ManifestDep] = []
    for manifest_path in find_manifest_files(repo_root):
        parser = _PARSERS.get(manifest_path.name)
        if parser is None:
            continue
        try:
            deps.extend(parser(manifest_path))
        except Exception:  # pragma: no cover - defensive
            continue
    return deps
