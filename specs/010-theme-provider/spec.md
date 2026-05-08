# Feature Specification: Theme Provider (Light / Dark)

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #10 — "Theme provider — light/dark toggle,
persisted in localStorage, broadcast to Tailwind, Monaco, and xterm
(decision #12)."

## User Scenarios & Testing

### User Story 1 — User toggles theme (P1)

A user clicks a Sun/Moon icon button in the IDE chrome and the entire
UI flips between light and dark. The choice survives a reload.

**Independent Test**: With the running dev server, click the toggle:
the page background, foreground, and Button colours invert. Reload —
the same theme is restored.

### User Story 2 — Initial theme respects OS preference (P2)

On first visit (no stored preference), the theme matches
`prefers-color-scheme`.

**Independent Test**: With localStorage cleared and OS in dark mode,
load the page → dark theme applied. Same flow with OS in light → light.

### User Story 3 — Future consumers can subscribe (P2)

Monaco (item #13) and xterm (item #21) will need to know the active
theme. The provider exposes a hook so those features only need to call
`useTheme()` to read or set the value.

**Independent Test**: A throwaway component calling `useTheme()` outside
the provider throws a clear error; inside the provider it returns
`{ theme: 'light' | 'dark', setTheme, toggleTheme }`.

### Edge Cases

- Storage key is namespaced (`fde-theme`) to avoid colliding with future
  localStorage uses.
- Stored value is validated; an unrecognised value falls back to OS
  preference.
- The toggle button is keyboard-accessible (`<button>` with visible
  focus ring inherited from the Button primitive).
- The provider sets the `dark` class on `<html>` (not `<body>`) so
  Tailwind's `class`-strategy dark mode works.
- No SSR concerns (Vite SPA only).

## Requirements

- **FR-001**: `app/src/theme/theme-provider.tsx` MUST export `ThemeProvider`
  wrapping its children with a React context.
- **FR-002**: `app/src/theme/use-theme.ts` MUST export `useTheme()`
  returning `{ theme, setTheme, toggleTheme }`. Calling it outside a
  provider MUST throw with a clear message.
- **FR-003**: On mount, the provider MUST read the stored theme from
  `localStorage` (key `fde-theme`); if absent or invalid, fall back to
  `window.matchMedia('(prefers-color-scheme: dark)').matches`.
- **FR-004**: `setTheme` MUST persist the new value to `localStorage`
  and toggle the `dark` class on `document.documentElement`.
- **FR-005**: A `ThemeToggle` component (`app/src/components/theme-toggle.tsx`)
  MUST render a Button (variant `ghost`, size `icon`) that calls
  `toggleTheme`. Aria-label reflects the next state ("Switch to dark
  mode" / "Switch to light mode").
- **FR-006**: `App.tsx` MUST be wrapped in `<ThemeProvider>` and render
  `<ThemeToggle />` in a visible position so the smoke check works.
- **FR-007**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.
- **FR-008**: No new runtime deps. Reuse the Button primitive from #7.

## Success Criteria

- **SC-001**: Toggle inverts every themed colour with a single click,
  no reload.
- **SC-002**: Reload restores the prior theme.
- **SC-003**: Bundle size growth is negligible (<2 KB gzipped).

## Assumptions

- Tailwind's `dark` class is applied to `<html>` (set up by #7).
- An icon library is not needed yet; an inline SVG (or text glyph) in
  `ThemeToggle` is acceptable for v1. A proper icon set can land later
  with the chrome.
- Monaco and xterm integration is out of scope for this item; they
  consume `useTheme()` when they land in #13 and #21.
