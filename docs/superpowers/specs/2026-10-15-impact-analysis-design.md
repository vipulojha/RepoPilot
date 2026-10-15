# Impact Analysis Design

Impact analysis answers which repository files may be affected by changing one
or more files. The dependency table is authoritative: an edge `A → B` means A
depends on B, so traversal starts at changed B and follows incoming edges.

Only internal dependencies in one READY snapshot are traversed. External and
unresolved edges remain excluded and are not evidence of repository impact.

Depth 0 means the changed roots only; roots are returned separately and are not
duplicated in affected files. Depth 1 means direct reverse dependents. The
default maximum is 3 and the API bounds it at 10. Traversal is iterative,
visited by file ID, cycle-safe, and ordered by depth, path, then file ID.

Each affected file includes unique changed root IDs, minimum depth, a
deterministic dependency path of file IDs/paths, and the edge evidence from the
first-ranked path. Overlapping roots merge into one result. No self-impact is
returned unless a cycle reaches the root; roots remain excluded from affected.

`POST /api/v1/repositories/{repository_id}/impact` accepts `{changed_file_ids,
snapshot_id?, max_depth?}` and returns snapshot, roots, affected files,
counts, depth, path, and evidence. Omitted snapshot means latest READY;
explicit snapshots must belong to the repository and be READY. Invalid IDs,
ownership, state, or depth return consistent 404/422 errors.

The service uses indexed `dependencies.target_file_id`, batches reverse-edge
queries per frontier, and never scans the filesystem. It does not create graph
visualization data; its path/evidence DTO is the future graph seam.
