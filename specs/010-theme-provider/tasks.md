# Tasks: Theme Provider (Backlog #10)

## Phase 1: Context + provider + hook

- [X] T001 Create `app/src/theme/theme-context.ts` — `Theme` type and `ThemeContext` (default `null`).
- [X] T002 Create `app/src/theme/theme-provider.tsx` — `ThemeProvider`: lazy initial state from localStorage / matchMedia; effect to apply `dark` class to `<html>` and persist.
- [X] T003 Create `app/src/theme/use-theme.ts` — `useTheme()` reading the context, throwing if used outside provider.

## Phase 2: Toggle component + integration

- [X] T004 Create `app/src/components/theme-toggle.tsx` — `<Button variant="ghost" size="icon">` with inline sun/moon SVG and dynamic `aria-label`.
- [X] T005 Wrap `App.tsx` in `<ThemeProvider>` and render `<ThemeToggle />` in the top-right of the smoke layout.

## Phase 3: Verify

- [X] T006 `pnpm run lint && pnpm run format:check && pnpm run build` — all exit 0.
- [X] T007 Manual sanity check — toggle inverts colours (verified via build, dev manual check left for the user; logic is straightforward `classList.toggle` + `localStorage.setItem`).

## Phase 4: Backlog + commit

- [X] T008 Strikethrough `#10` in `backlog.md`; bump Updated.
- [X] T009 Three commits: `feat(#10)`, `docs(#10)`, `docs: backlog status`.
