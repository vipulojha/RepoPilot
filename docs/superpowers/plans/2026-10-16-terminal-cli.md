# Milestone 5F — Terminal CLI Plan

1. Add `backend/app/cli.py` with argparse command tree, JSON/text renderers,
   exit-code handling, path/database selection, and console-script metadata.
2. Add a small CLI application-context helper that registers a path, creates
   the existing SQLite schema, and invokes existing scanner/intelligence/Git
   services without duplicate algorithms.
3. Implement and test `status`, `scan`, `files`, `search`, `symbols`,
   `dependencies`, `impact`, `graph`, `hotspots`, `tests`, `changes`,
   `history`, and `git status`; add bounded flags and READY guidance.
4. Add real subprocess CLI tests in `backend/tests/test_cli.py` for help/version,
   JSON validity, exit codes, temporary repositories, scan/READY behavior,
   invalid/non-Git paths, special names, history/status/changes, and stderr.
5. Update README and Docker usage, run backend/frontend tests and Docker CLI
   smoke tests, then commit `feat: add RepoPilot terminal CLI`.
