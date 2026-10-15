# Repository Overview Implementation Plan

1. Add a READY-only aggregate overview endpoint using existing snapshot data.
2. Add typed client support and replace dashboard mock metrics with selected
   repository data, preserving Signal Map layout.
3. Test snapshot/ownership/empty behavior, validate all screens, and commit
   `feat: add repository overview`.
