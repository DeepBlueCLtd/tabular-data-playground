# Implementation Plan: Editor Split Panes

**Branch**: `claude/epic-e1-1gMf9` (epic mode)

## Constitution Check

1. Research-first — pass.
2. Notes-section — N/A.
3. Destruction — N/A.
4. Backend — pass.
5. Pinning — pass; no new deps (deviation noted in Complexity
   Tracking below).
6. Limitations — pass; sharp edge documented in
   `docs/limitations.md`.

## Complexity Tracking

- **Deviation**: Constitution names `react-mosaic` /
  `dockview`. v1 uses `react-resizable-panels` (already a dep)
  to ship a 2-pane horizontal split via toggle + drag-resize
  rather than full drag-to-split-from-empty.
- **Justification**: bundle savings (~50 KB) and reduced API
  surface for a feature whose lessons-evaluation value is
  bounded. Constitution's substitution clause ("substitutions
  within these slots are permitted and not amendments")
  arguably applies; this entry exists to surface the choice
  explicitly.

## Files touched

- `app/src/editor/editor-area.tsx` — wrap Monaco in a
  `<PanelGroup>` when split.
- `docs/limitations.md` — record the simplification.
