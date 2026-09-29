# SPDX-License-Identifier: Apache-2.0
"""The post-install check: exit 0 on a bound workspace, 1 with one line per problem."""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
CHECK = os.path.join(SKILL, "bin", "check.py")
FIXTURE = os.path.join(HERE, "fixture")


def run(cwd, *args):
    env = dict(os.environ, SKILL_DIR=SKILL)
    return subprocess.run([sys.executable, CHECK, *args], cwd=cwd, env=env,
                          capture_output=True, text=True)


class CheckTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.ws = os.path.join(self.tmp, "ws")
        shutil.copytree(FIXTURE, self.ws)
        self.bindings = os.path.join(self.ws, ".agents", "skill-bindings.toml")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def edit(self, old, new):
        with open(self.bindings, encoding="utf-8") as fh:
            text = fh.read()
        self.assertIn(old, text)
        with open(self.bindings, "w", encoding="utf-8") as fh:
            fh.write(text.replace(old, new))

    def test_the_fixture_passes(self):
        r = run(self.ws)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("quarter-planning: ok", r.stdout)

    def test_no_binding_file_is_a_problem(self):
        os.remove(self.bindings)
        r = run(self.ws)
        self.assertEqual(r.returncode, 1)
        self.assertIn("no .agents/skill-bindings.toml", r.stdout)

    def test_an_undeclared_required_path_is_named(self):
        self.edit('register     = "../registers/deliverable-types.csv"\n', "")
        r = run(self.ws)
        self.assertEqual(r.returncode, 1)
        self.assertIn("does not declare register", r.stdout)

    def test_a_missing_path_is_named(self):
        os.remove(os.path.join(self.ws, "registers", "deliverable-types.csv"))
        r = run(self.ws)
        self.assertEqual(r.returncode, 1)
        self.assertIn('register = "../registers/deliverable-types.csv"', r.stdout)

    def test_a_quarter_path_is_checked_up_to_the_placeholder(self):
        shutil.rmtree(os.path.join(self.ws, "planning", "2027-q1"))
        self.assertEqual(run(self.ws).returncode, 0)
        shutil.rmtree(os.path.join(self.ws, "planning"))
        r = run(self.ws)
        self.assertEqual(r.returncode, 1)
        self.assertIn("the folder in front of {quarter}", r.stdout)

    def test_a_label_field_the_pattern_does_not_capture(self):
        self.edit('quarterLabel = "{y}-Q{q}"', 'quarterLabel = "{fy}-Q{q}"')
        r = run(self.ws)
        self.assertEqual(r.returncode, 1)
        self.assertIn("uses fy", r.stdout)

    def test_an_argument_is_a_usage_error(self):
        self.assertEqual(run(self.ws, "--nope").returncode, 2)


if __name__ == "__main__":
    unittest.main()
