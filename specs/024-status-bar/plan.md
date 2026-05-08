# Implementation Plan: Status Bar

**Branch**: `claude/epic-e1-1gMf9` (epic mode)

## Summary

Add a `EditorFocusContext` for ephemeral editor view state
(cursor position, active editor id). Wire Monaco `onMount`
listeners to push cursor updates. Add `schemaForPath`. Replace
the placeholder with a real status bar that reads from
`useEditorTabs()` + `useEditorFocus()`.

## Files touched

- `app/src/editor/editor-focus-context.ts` — new.
- `app/src/editor/editor-focus-provider.tsx` — new.
- `app/src/editor/use-editor-focus.ts` — new.
- `app/src/editor/schema-for-path.ts` — new helper.
- `app/src/editor/editor-area.tsx` — wire cursor reporter.
- `app/src/editor/auto-save.ts` — expose `isSaving(id)` /
  `onSavingChange(listener)` so save state can render.
- `app/src/editor/editor-tabs-provider.tsx` — surface saving
  state in the tabs context.
- `app/src/components/shell/status-bar.tsx` — new.
- `app/src/components/shell/app-shell.tsx` — swap import.
- `app/src/App.tsx` — wrap in `<EditorFocusProvider>`.
- delete `status-bar-placeholder.tsx`.

## Constitution Check

All gates pass.
