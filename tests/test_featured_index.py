"""Tests for scripts/featured_index.py (the post-release featured-index tool)."""

from __future__ import annotations

import re
import sys
import tomllib
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.featured_index import update_featured_versions

# A minimal featured.toml mirroring the AoE trust-root shape, with a comment and
# a sibling plugin to prove they survive an edit untouched.
FEATURED = """\
# featured index
[plugins."agent-of-empires.other"]
source = "gh:agent-of-empires/other"
versions = { "0.1.0" = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }

[plugins."omp.agent-of-empires"]
source = "gh:agent-of-empires/plugin-omp"
# keep this comment
versions = { "0.3.0" = "sha256:efa2a0c3f956bf212fa14e2c0bf8742f51155ff470350ee31a70ecd61780bb41" }
"""

OMP = "omp.agent-of-empires"
NEW_HASH = "sha256:1111111111111111111111111111111111111111111111111111111111111111"


class FeaturedIndexTests(unittest.TestCase):
    def test_update_appends_new_version(self) -> None:
        new_text, changed = update_featured_versions(FEATURED, OMP, "0.4.0", NEW_HASH)
        self.assertTrue(changed)
        self.assertIn(f'"0.4.0" = "{NEW_HASH}"', new_text)
        self.assertIn("0.3.0", new_text)
        self.assertIn("agent-of-empires.other", new_text)
        self.assertIn("# keep this comment", new_text)
        # A missing comma between entries would produce invalid TOML.
        self.assertIsNone(re.search(r'"[ \t]+"', new_text))

    def test_update_output_round_trips(self) -> None:
        new_text, _ = update_featured_versions(FEATURED, OMP, "0.4.0", NEW_HASH)
        versions = tomllib.loads(new_text)["plugins"][OMP]["versions"]
        self.assertEqual(versions["0.4.0"], NEW_HASH)
        self.assertTrue(versions["0.3.0"].startswith("sha256:"))

    def test_update_noop_when_present_with_same_hash(self) -> None:
        same = "sha256:efa2a0c3f956bf212fa14e2c0bf8742f51155ff470350ee31a70ecd61780bb41"
        new_text, changed = update_featured_versions(FEATURED, OMP, "0.3.0", same)
        self.assertFalse(changed)
        self.assertEqual(new_text, FEATURED)

    def test_update_raises_when_present_with_different_hash(self) -> None:
        with self.assertRaisesRegex(ValueError, "already pinned"):
            update_featured_versions(FEATURED, OMP, "0.3.0", NEW_HASH)

    def test_update_raises_when_section_missing(self) -> None:
        with self.assertRaisesRegex(ValueError, "no .* section"):
            update_featured_versions(FEATURED, "agent-of-empires.absent", "1.0.0", NEW_HASH)

    def test_update_raises_on_malformed_hash(self) -> None:
        with self.assertRaisesRegex(ValueError, "malformed tree hash"):
            update_featured_versions(FEATURED, OMP, "0.4.0", "not-a-hash")


if __name__ == "__main__":
    unittest.main()
