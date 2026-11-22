"""Build a static catalog from skills and their existing paired assessments."""

import json
import shutil
from datetime import UTC, datetime
from pathlib import Path

from skill_assessment.reports import is_current_assessment

from .build_info import git, site_version
from .skills import discover_skills, write_skill_zip


def read_current_assessment(assessments_dir, skill):
    directory = assessments_dir / skill.metadata.skill_id
    paths = [directory / name for name in ("skillspector.json", "adjudication.json")]
    if assessments_dir.is_symlink() or directory.is_symlink() or any(path.is_symlink() for path in paths):
        raise ValueError(f"Assessment must contain regular files: {skill.metadata.skill_id}")
    if not is_current_assessment(directory, skill.content_hash, static_only=False):
        raise ValueError(f"Assessment must be successful and match current skill content: {skill.metadata.skill_id}")
    adjudication = json.loads(paths[1].read_text(encoding="utf-8"))
    report = json.loads(paths[0].read_text(encoding="utf-8"))
    return directory, report, adjudication


def build_exchange(*, skills_root: Path, generated_dir: Path, assessments_dir: Path):
    output = generated_dir.resolve()
    for input_root in (skills_root.resolve(), assessments_dir.resolve()):
        if output.is_relative_to(input_root) or input_root.is_relative_to(output):
            raise ValueError("Generated output and input skills or evidence must not overlap")
    skills = discover_skills(skills_root)
    # Validate all inputs before replacing any generated output.
    current = [(skill, *read_current_assessment(assessments_dir, skill), catalog_metadata(skill)) for skill in skills]
    build_root = Path.cwd()
    index = {"version": site_version(build_root), "revision": git(build_root, "rev-parse", "--short=8", "HEAD")}
    generated_dir.mkdir(parents=True, exist_ok=True)
    for name in ("zips", "skills", "assessments", "tables", "scanner-runs"):
        directory = generated_dir / name
        if directory.is_symlink():
            raise ValueError(f"Generated directory must not be a symlink: {directory}")
    for name in ("zips", "skills", "assessments", "tables", "scanner-runs"):
        directory = generated_dir / name
        if directory.exists():
            shutil.rmtree(directory)
    records = []
    for skill, directory, report, adjudication, metadata in current:
        identifier = skill.metadata.skill_id
        destination = generated_dir / "assessments" / identifier
        destination.mkdir(parents=True)
        downloads = {}
        for name in ("skillspector.json", "adjudication.json"):
            shutil.copyfile(directory / name, destination / name)
            downloads[name.removesuffix(".json")] = f"downloads/assessments/{identifier}/{name}"
        archive = write_skill_zip(skill, generated_dir / "zips")
        records.append({
            "skill_id": skill.metadata.skill_id,
            "name": skill.metadata.name,
            "description": skill.metadata.description,
            "content_hash": skill.content_hash,
            "skill_md_content": skill.skill_file.read_text(encoding="utf-8"),
            "skill_files": [{"path": path.relative_to(skill.path).as_posix(), "size_bytes": path.stat().st_size}
                            for path in sorted(skill.path.rglob("*")) if path.is_file()],
            "download_path": f"downloads/{archive.name}",
            **display_assessment(skill, report, adjudication, downloads),
            **metadata,
            "last_scanned": report.get("skill", {}).get("scanned_at"),
            "assessment_downloads": downloads,
        })
    index["skills"] = records
    (generated_dir / "index.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    return {"skills_written": len(records)}


def display_assessment(skill, report, adjudication, downloads):
    # Eligibility and ordered finding association were checked by the assessment kit.
    recommendation = "Unknown"
    if adjudication.get("status") == "completed":
        if adjudication.get("safe_to_use") is True:
            recommendation = "SAFE"
        elif adjudication.get("safe_to_use") is False:
            recommendation = "CAUTION"
    metadata = report.get("metadata", {})
    risk = report.get("risk_assessment", {})
    provenance = metadata.get("llm_provenance", {})
    run_id = skill.metadata.skill_id
    run = {
        "id": run_id, "skill_id": skill.metadata.skill_id,
        "scanner_name": "skillspector", "scanner_version": metadata.get("skillspector_version"),
        "content_hash": skill.content_hash, "last_scanned": report.get("skill", {}).get("scanned_at"),
        "scan_mode": "static-only" if metadata.get("llm_requested") is False else "llm-assisted",
        "llm_provider": provenance.get("provider", {}).get("effective_adapter"),
        "llm_model": ", ".join(sorted({row["model"] for row in provenance.get("analyzers", [])
                                       if row.get("model")})) or None,
        "native_score": risk.get("score"), "native_severity": risk.get("severity"),
        "display_risk": risk.get("severity"), "confidence_flags": [],
    }
    findings = []
    for index, (issue, finding) in enumerate(zip(report["issues"], adjudication["findings"], strict=True), 1):
        location = issue.get("location") or {}
        rule_id = issue.get("id", issue.get("rule_id"))
        issue_id = str(rule_id) if rule_id is not None else f"issue-{index}"
        findings.append({
            "id": f"{run_id}:{issue_id}:{index}", "scanner_run_id": run_id, "native_issue_id": issue_id,
            "severity": issue.get("severity"), "category": issue.get("category"), "pattern": issue.get("pattern"),
            "path": location.get("file"), "start_line": location.get("start_line"),
            "explanation": issue.get("explanation"), "remediation": issue.get("remediation"),
            "code_snippet": issue.get("code_snippet"),
            "false_positive": finding["determination"] == "false_positive",
        })
    return {
        "recommendation": recommendation, "confidence_flags": [], "risk": risk.get("severity"),
        "scan_mode": run["scan_mode"],
        "scanner_provenance": {"name": run["scanner_name"], "version": run["scanner_version"],
                               "scan_mode": run["scan_mode"]},
        "adjudication": {key: adjudication.get(key) for key in (
            "status", "summary", "coverage_sufficient", "coverage_reason", "scope")},
        "dispositions": {value: sum(finding["determination"] == value for finding in adjudication.get("findings", []))
                         for value in ("true_positive", "false_positive", "uncertain")},
        "scanner_runs": [run], "scanner_findings": findings,
        "scanner_artifacts": [{"scanner_run_id": run_id, "artifact_kind": "native_report",
                               "download_path": downloads["skillspector"]}],
    }


def catalog_metadata(skill):
    metadata = skill.metadata.raw.get("metadata") or {}
    dates = {}
    for key in ("created", "updated"):
        value = metadata.get(f"ai4sdlc.{key}")
        if value is None:
            dates[key] = None
            continue
        try:
            parsed = datetime.fromisoformat(value)
            if parsed.utcoffset() is None:
                raise ValueError("timezone is required")
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"{skill.metadata.skill_id}: ai4sdlc.{key} must be a quoted ISO timestamp with timezone"
            ) from error
        dates[key] = parsed.astimezone(UTC)
    if dates["created"] is not None and dates["updated"] is not None and dates["updated"] < dates["created"]:
        raise ValueError(f"{skill.metadata.skill_id}: updated must not precede created")
    raw_tags = metadata.get("ai4sdlc.tags") or ""
    if isinstance(raw_tags, str):
        tags = [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
    elif isinstance(raw_tags, list):
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]
    else:
        tags = []
    return {
        "category": metadata.get("ai4sdlc.category"), "tags": tags,
        "owner": metadata.get("ai4sdlc.owner"),
        "first_observed": dates["created"].isoformat() if dates["created"] else None,
        "last_updated": dates["updated"].isoformat() if dates["updated"] else None,
    }
