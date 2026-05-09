# Plan: Curriculum index (#37)

## Summary
Replace the temp `<select>` picker in `side-panel.tsx` with a
two-state pane: index list (default) ↔ selected lesson view. Both
states render inside the existing `lessons` activity panel.

## Constitution Check
| Gate | Status |
|------|--------|
| Research-first | PASS — entry point for the curriculum |
| Notes | N/A |
| Destruction | PASS (read-only nav) |
| Backend | PASS |
| Pinning | PASS (no new deps) |
| Limitations | PASS |

## Source-code shape
```
app/src/components/shell/side-panel.tsx   # MODIFY — index/lesson states
app/src/lessons/curriculum-index.tsx       # NEW — list component
app/src/lessons/lesson-styles.css          # MODIFY — list row styles
```
