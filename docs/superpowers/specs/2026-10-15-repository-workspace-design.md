# Repository Workspace Design

Phase 4A makes repository identity explicit and shared. The app loads the
registered repository list once in `App`, stores the selected ID in URL-ready
state (with localStorage persistence), and passes that context to route views.
Views never choose the first repository. Every API query uses the selected
repository and its latest READY snapshot.

The workspace supports registration through the existing metadata API, safe
deletion of the database registration only, selection, scan/rescan, and status
display. It never deletes source files. Scan data remains READY-only and a new
scan cannot replace the current READY snapshot until completion.
