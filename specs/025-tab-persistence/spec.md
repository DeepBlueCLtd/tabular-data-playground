# Feature Specification: Tab Persistence (#19)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #19 — open tab paths persisted in
localStorage, restored on reload; content loaded fresh from FS
(decisions #38, #56, `spec.md` §6.5).

## User Scenarios

- Open `/workspace/foo.csv` and `/workspace/datapackage.json` in
  tabs, focus the second. Reload. Both tabs reappear; the
  second is focused; content matches the on-disk file (i.e.
  fresh read).
- Tabs whose backing file no longer exists are restored as
  `missing` (strikethrough) — they don't error out.

## Requirements

- **FR-001**: `editor-tabs-provider.tsx` MUST persist
  `{ paths: string[]; activeIndex: number | null }` under
  `localStorage` key `fde-editor-tabs`.
- **FR-002**: On vfs becoming non-null, restore the tabs by
  calling `open(path)` for each path in saved order; then set
  `activeTabId` to match `activeIndex`.
- **FR-003**: Persistence write happens on every `tabs` /
  `activeTabId` change (after restoration completes — guard via
  a "restored" ref).
- **FR-004**: Failures (corrupt JSON, vfs missing) are silently
  ignored.
- **FR-005**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.
