# Cross-feature Navigation Design

Phase 4D uses the App-level repository and selected-file context as the single
navigation seam. Entity actions set selected file ID before changing views;
all destination views query the same selected repository. Existing APIs remain
the source of truth; navigation adds no intelligence logic.
