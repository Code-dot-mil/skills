from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

import yaml
from skill_assessment.hashing import skill_digest


@dataclass(frozen=True)
class SkillMetadata:
    skill_id: str
    name: str
    description: str
    raw: dict[str, Any]


@dataclass(frozen=True)
class SkillPackage:
    metadata: SkillMetadata
    path: Path
    skill_file: Path
    content_hash: str


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---\n"):
        raise ValueError("SKILL.md must start with YAML frontmatter")

    end_marker = "\n---\n"
    end = text.find(end_marker, 4)
    if end == -1:
        raise ValueError("SKILL.md frontmatter closing marker not found")

    raw_frontmatter = text[4:end]
    body = text[end + len(end_marker) :]
    parsed = yaml.safe_load(raw_frontmatter) or {}
    if not isinstance(parsed, dict):
        raise ValueError("SKILL.md frontmatter must parse to a mapping")
    return parsed, body


MAX_SKILL_FILES = 500
MAX_SKILL_FILE_BYTES = 5 * 1024 * 1024


def discover_skills(skills_root: Path) -> list[SkillPackage]:
    packages: list[SkillPackage] = []
    for skill_file in sorted(skills_root.glob("*/SKILL.md")):
        skill_dir = skill_file.parent
        if any(path.is_symlink() for path in (skills_root, skill_dir.parent, skill_dir, skill_file)):
            raise ValueError("Skill roots and files must not be symlinks")
        skill_id = skill_dir.name
        frontmatter, _body = parse_frontmatter(skill_file.read_text())
        if frontmatter.get("name") != skill_id:
            raise ValueError(f"name must match skill folder id: {skill_id}")
        description = frontmatter.get("description")
        if not isinstance(description, str) or not description.strip():
            raise ValueError(f"description is required: {skill_id}")
        metadata = SkillMetadata(skill_id, skill_id, description, frontmatter)
        packages.append(
            SkillPackage(
                metadata=metadata,
                path=skill_dir,
                skill_file=skill_file,
                content_hash=hash_skill_package(skill_dir),
            )
        )
    if not packages:
        raise ValueError("No skills found: expected <skills>/<skill>/SKILL.md")
    return packages


def hash_skill_package(skill_dir: Path) -> str:
    package_files(skill_dir)
    return skill_digest(skill_dir)


def package_files(skill_dir: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(skill_dir.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"skill package must not contain symlink: {path.relative_to(skill_dir).as_posix()}")
        if not path.is_file():
            continue
        if path.stat().st_size > MAX_SKILL_FILE_BYTES:
            raise ValueError(f"skill package file is too large: {path.relative_to(skill_dir).as_posix()}")
        files.append(path)
        if len(files) > MAX_SKILL_FILES:
            raise ValueError(f"skill package contains more than {MAX_SKILL_FILES} files")
    return files


def write_skill_zip(skill: SkillPackage, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / f"{skill.metadata.skill_id}.zip"
    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED) as archive:
        for path in package_files(skill.path):
            rel = Path(skill.metadata.skill_id) / path.relative_to(skill.path)
            archive.write(path, rel.as_posix())
    return zip_path
