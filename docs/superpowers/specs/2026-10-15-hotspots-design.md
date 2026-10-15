# Repository Hotspots Design

Hotspots are files with high structural reach or size within one READY
snapshot. They are inspection priorities, not defect or historical-risk claims.
No Git churn, commit count, developer activity, bug count, or fabricated metric
is used.

## Score

Eligible files are TEXT files that are not skipped/binary and have metadata.
Tests remain eligible and retain `is_test=true`; generated/build/vendor files
are already excluded by the scanner. Signals use only existing data:

- lines: file `line_count`
- symbols: count of snapshot symbols per file
- fan-in: unique internal source files targeting this file
- fan-out: unique internal targets sourced by this file
- impact reach: unique internal files reachable through reverse dependencies,
  bounded to depth 3, excluding the file itself

Each signal is min-max normalized across eligible files. If all files tie, the
component is 0.5 for every file, avoiding arbitrary zero scores. The score is:

`100 * (0.20*lines + 0.20*symbols + 0.25*fan_in + 0.15*fan_out + 0.20*impact_reach)`.

It is clamped to 0–100 and rounded to two decimals. Ranking is descending
score, then descending fan-in, then descending impact reach, then relative path,
then file ID. Reasons expose raw metrics and nonzero contributing signals.

## API and behavior

`GET /api/v1/repositories/{repository_id}/hotspots` accepts `snapshot_id`,
`limit`, `cursor`, `language`, and `include_tests` (default true). It returns
snapshot ID, rank, score, file metadata, metrics, and reasons. Omitted snapshot
means latest READY; explicit snapshots must belong to the repository and be
READY. Empty repositories return an empty list. Missing metrics become zero;
binary/skipped files are excluded.

The service loads snapshot files, symbols, and internal dependencies in bounded
queries, builds adjacency maps once, and performs bounded reverse traversal in
memory. Historical Git integration is a future seam, not part of this score.
