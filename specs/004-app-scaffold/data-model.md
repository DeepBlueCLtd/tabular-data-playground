# Data Model — App Scaffold

This item has **no data model**. The scaffold is purely build-tool and
React-host configuration; it does not persist anything, does not define
any entities, and does not interact with IDBFS, IndexedDB, or
localStorage.

Persisted state for the IDE shell arrives in later E1 items:

- Virtual workspace files — item #11 (Virtual FS facade) backed by IDBFS
  via Pyodide.
- Tab list (open file paths only, content loaded fresh from FS) — item
  #19 (Tab persistence) using `localStorage`.
- Theme preference — item #10 (Theme provider) using `localStorage`.
- Landing-page first-visit flag — item #36 in E2 using `localStorage`.

This file exists as a deliberate empty record so `/speckit-analyze` does
not flag a missing artefact for this item.
