# Tasks: File Tree (Backlog #15)

- [X] T001 Pin `react-arborist@3.4.0` in `app/package.json`,
  install, commit lockfile.
- [X] T002 Create `app/src/file-tree/walk.ts` —
  `walkWorkspace(vfs)` returns nested `TreeNode[]`.
- [X] T003 Create `app/src/file-tree/file-tree.tsx` — uses
  `useVfs`, `useFsChanged`, `useEditorTabs`. Tree from
  `react-arborist`. File click → `open(path)`. Empty / loading /
  error states.
- [X] T004 Update `side-panel.tsx` to render `<FileTree />`
  when `active === 'files'`.
- [X] T005 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.
- [X] T006 Strikethrough `#15` in `backlog.md`; bump Updated.
- [X] T007 Three commits: `feat(#15)`, `docs(#15)`, `docs: backlog status`.
