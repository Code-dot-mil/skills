"""Build identity for upstream checkouts and installed Operator kits."""

import subprocess
from pathlib import Path


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(
        ["git", "-c", f"safe.directory={root.resolve()}", *args], cwd=root, text=True,
    ).strip()


def site_version(root: Path) -> str:
    """Installed kits retain their upstream version; checkouts derive it from tags."""
    version_file = root / "VERSION"
    if version_file.is_file():
        return version_file.read_text(encoding="utf-8").strip()
    description = git(root, "describe", "--tags", "--long", "--dirty", "--match", "v[0-9]*")
    dirty = description.endswith("-dirty")
    tag, distance, _ = description.removesuffix("-dirty").rsplit("-", 2)
    version = tag.removeprefix("v")
    if int(distance) or dirty:
        version += ("." if "+" in version else "+") + f"dev.{distance}"
    return version + (".dirty" if dirty else "")
