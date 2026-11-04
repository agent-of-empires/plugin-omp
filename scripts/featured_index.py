"""Pin a released version in AoE's featured index.

CI-only tooling for the post-release `featured-pr` job. The tree hash itself is
computed by the canonical `aoe plugin hash` binary, so this never tracks the
host's hashing algorithm. This module only edits the trust-root TOML.

`plugins/featured.toml` is a security trust root: the host treats a plugin as
featured only when the fetched source tree hash matches a pinned value. Every
byte outside the target plugin's `versions` inline table is preserved, and the
whole document is parsed again before anything is written.

One subcommand:
    update <toml> <plugin_id> <version> <hash>
"""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path

HASH_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
SECTION_RE = re.compile(r'^\[plugins\."(?P<id>[^"]+)"\]\s*(?:#.*)?$')


def update_featured_versions(
    toml_text: str,
    plugin_id: str,
    version: str,
    tree_hash_value: str,
) -> tuple[str, bool]:
    """Pin `version -> tree_hash_value` for `plugin_id`.

    Returns `(new_text, changed)`. `changed` is False when the pin is already
    present with the identical hash. Raises ValueError on a missing section or
    versions table, a malformed hash, a versions table that is not a
    single-line inline table, or a version already pinned to a different hash.
    """
    if not HASH_RE.fullmatch(tree_hash_value):
        raise ValueError(f"malformed tree hash: {tree_hash_value!r}")

    doc = tomllib.loads(toml_text)
    plugins = doc.get("plugins")
    if not isinstance(plugins, dict) or plugin_id not in plugins:
        raise ValueError(f'no [plugins."{plugin_id}"] section in featured index')
    versions = plugins[plugin_id].get("versions")
    if not isinstance(versions, dict):
        raise ValueError(f'[plugins."{plugin_id}"] has no versions table')

    existing = versions.get(version)
    if existing is not None:
        if existing != tree_hash_value:
            raise ValueError(
                f"{plugin_id} {version} already pinned to {existing}, "
                f"refusing to overwrite with {tree_hash_value}"
            )
        return toml_text, False

    lines = toml_text.splitlines(keepends=True)
    start = None
    for index, line in enumerate(lines):
        match = SECTION_RE.match(line.rstrip("\r\n"))
        if match and match.group("id") == plugin_id:
            start = index
            break
    if start is None:
        raise ValueError(f'no [plugins."{plugin_id}"] section in featured index')

    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].lstrip().startswith("["):
            end = index
            break

    target = None
    for index in range(start + 1, end):
        stripped = lines[index].lstrip()
        if stripped.startswith("versions") and "=" in stripped:
            target = index
            break
    if target is None:
        raise ValueError(f'[plugins."{plugin_id}"] has no versions table')

    line = lines[target]
    equals = line.index("=")
    prefix = line[: equals + 1]
    table_text = line[equals + 1 :].strip()
    if not table_text.startswith("{") or not table_text.endswith("}"):
        raise ValueError("versions must be a single-line inline table")

    parsed = tomllib.loads("versions = " + table_text)
    if parsed["versions"] != versions:
        raise ValueError("versions line does not match the parsed document")

    entries = [f'"{key}" = "{value}"' for key, value in versions.items()]
    entries.append(f'"{version}" = "{tree_hash_value}"')
    newline = "\r\n" if line.endswith("\r\n") else "\n"
    lines[target] = f"{prefix} {{ " + ", ".join(entries) + " }" + newline

    new_text = "".join(lines)
    expected = dict(versions)
    expected[version] = tree_hash_value
    checked = tomllib.loads(new_text)
    if checked["plugins"][plugin_id]["versions"] != expected:
        raise ValueError("updated document did not round-trip")
    return new_text, True


def main(argv: list[str]) -> int:
    if len(argv) != 5 or argv[0] != "update":
        print(
            "usage: featured_index.py update <toml> <plugin_id> <version> <hash>",
            file=sys.stderr,
        )
        return 2

    path = Path(argv[1])
    try:
        new_text, changed = update_featured_versions(
            path.read_text(encoding="utf-8"), argv[2], argv[3], argv[4]
        )
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    if changed:
        path.write_text(new_text, encoding="utf-8")
        print("changed")
    else:
        print("unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
