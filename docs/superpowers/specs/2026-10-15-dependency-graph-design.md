# Dependency Graph Design

The graph is a bounded projection of existing internal `Dependency` rows. An
edge `A → B` means A depends on B and is rendered in that direction. No new
extraction or resolution logic is introduced.

The selected file is the root. Direction `outgoing` follows dependencies,
`incoming` follows dependents, and `both` follows both. Depth 0 returns the
root only; default depth is 2, maximum 6. Default limits are 100 nodes and 200
edges, bounded by API maximums. Traversal is iterative, visited by file ID,
cycle-safe, and ordered by depth/path/id. Duplicate source-target edges are
collapsed deterministically while retaining the first dependency evidence.

Only internal edges are graph edges. External and unresolved rows are omitted
and represented by counts only if later required. Nodes expose file identity,
path, language, classification, test flag, and degree counts. Edges expose
dependency ID, kind, imported name, source location, and evidence.

`GET /api/v1/repositories/{repository_id}/graph` accepts `root_file_id`,
`snapshot_id`, `direction`, `depth`, `max_nodes`, and `max_edges`. It returns
READY snapshot ID, root, nodes, edges, counts, and truncation metadata.

React Flow is presentation-only. The frontend maps DTOs to nodes/edges and uses
a deterministic grid layout; backend semantics remain testable without a
browser. Selected nodes open an inspector and can refocus the query. Future
symbol-level graph and impact highlighting use the same DTO seam.
