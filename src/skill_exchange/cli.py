"""Run the installed assessment CLI and build the operator's catalog from its assessment output."""

import argparse
import json
import subprocess
from pathlib import Path

from .builder import build_exchange
from .skills import discover_skills


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    assess = commands.add_parser("assess-catalog")
    generate = commands.add_parser("generate")
    for command in (assess, generate):
        command.add_argument("--skills", type=Path, default=Path("skills"))
        command.add_argument("--evidence", type=Path, default=Path("evidence"))
        command.add_argument("--generated", type=Path, default=Path(".exchange/generated"))
    assess.add_argument("--scan-mode", choices=("static-only", "llm-assisted"), default="llm-assisted")
    assess.add_argument("--force", action="store_true", help="Reassess all skills, including current reports")
    args = parser.parse_args()
    if args.command != "generate":
        try:
            skills = discover_skills(args.skills)
        except ValueError as error:
            parser.error(str(error))
        for skill in skills:
            output = args.evidence / skill.metadata.skill_id
            command = ["skill-assessment", "assess", "--skill", str(skill.path),
                       "--output-dir", str(output), "--scan-mode", args.scan_mode]
            if not args.force:
                command.append("--if-changed")
            subprocess.run(command, check=True)
            with (output / "assessment.md").open("w", encoding="utf-8") as summary:
                subprocess.run(["skill-assessment", "summarize", "--assessment-dir", str(output)],
                               stdout=summary, check=True)
    if args.command == "generate":
        result = build_exchange(skills_root=args.skills, generated_dir=args.generated, assessments_dir=args.evidence)
        if not result["skills_written"]:
            raise ValueError(f"Catalog is empty or contains invalid skills: {result}")
        print(json.dumps(result))


if __name__ == "__main__":
    main()
