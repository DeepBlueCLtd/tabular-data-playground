# Tasks: Landing page (#36)

- [ ] T001 Create `app/src/landing/use-landing-state.ts` exposing `useLandingState()` returning `{ seen: boolean, markSeen: () => void, reshow: () => void }`. Reads/writes `localStorage['landing-seen']` defensively (try/catch for private-mode).
- [ ] T002 Create `app/src/landing/landing-page.tsx` exporting `<LandingPage onStart>` — heading, paragraph(s), Start button. No telemetry, no analytics.
- [ ] T003 Create `app/src/landing/landing-styles.css` (centered card, theme-aware) and import from `main.tsx`.
- [ ] T004 Modify `app/src/App.tsx`: top-level state machine — show `<LandingPage>` when not yet seen OR when explicitly reshown; otherwise `<AppShell>`.
- [ ] T005 Modify `app/src/components/shell/app-shell.tsx` header: add "What is this?" button that calls a `onReshowLanding` prop (passed from App). Place near ThemeToggle.
- [ ] T006 e2e: smoke "first visit shows landing"; clicking Start reveals the IDE; reload shows IDE directly.
- [ ] T007 Run typecheck/lint/format/build/e2e green.
- [ ] T008 Backlog status — #36 complete.
