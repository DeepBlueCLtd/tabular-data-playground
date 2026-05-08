# Tasks: Tab Persistence (#19)

- [X] T001 In `editor-tabs-provider.tsx`, on `vfs` becoming
  non-null and not yet restored, read localStorage and call
  `open(path)` for each saved path; set active index.
- [X] T002 Persist on every `tabs` / `activeTabId` change once
  restored.
- [X] T003 Build / lint / format pass.
- [X] T004 Strikethrough `#19`.
- [X] T005 Three commits.
