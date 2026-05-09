# Tasks: Curriculum index (#37)

- [ ] T001 Create `app/src/lessons/curriculum-index.tsx` exporting a `<CurriculumIndex>` list component. Props: `entries: readonly LessonMeta[]`, `onSelect: (slug: string) => void`. Empty-state when entries is [].
- [ ] T002 Modify `app/src/components/shell/side-panel.tsx`: replace the temp `<select>` picker with a two-state `<LessonsPane>` — `selected === null` renders `<CurriculumIndex>`, otherwise renders `<LessonView>` with a "← Curriculum" back link.
- [ ] T003 Modify `app/src/lessons/lesson-view.tsx` to accept an optional `onBack?: () => void` prop; when provided, render a "← Curriculum" link above the header.
- [ ] T004 Extend `app/src/lessons/lesson-styles.css` with row styles for the index.
- [ ] T005 Update e2e: replace the `[data-temp-picker]` assertion with a curriculum-list assertion (find the lesson by title and click it).
- [ ] T006 Run typecheck/lint/format/build/e2e green.
- [ ] T007 Backlog status — #37 complete.
