# Implementation Plan: Theme Provider

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Tiny React context that owns `theme: 'light' | 'dark'`, persists to
`localStorage` under `fde-theme`, and toggles the `dark` class on
`<html>`. Ships with a `ThemeToggle` icon button. No new deps. Sets up
the seam for Monaco (#13) and xterm (#21) to subscribe later.

## Constitution Check

1. Research-first — pass (a usable IDE shell needs sane defaults).
2. Notes-section — N/A.
3. Destruction — pass.
4. Backend — pass.
5. Pinning — pass; no new deps.
6. Limitations — pass; no new sharp edge.

All gates pass. No Complexity Tracking entries.

## Technical Context

- Pure React 18; context + `useSyncExternalStore` is overkill — a
  `useState` + effect that writes localStorage is enough. The
  context exposes `theme`, `setTheme`, `toggleTheme`.
- `dark` class on `<html>` so Tailwind v4's class strategy applies.
- Initial read happens in a lazy `useState` initialiser so the first
  paint matches the stored / OS preference (no flash of wrong theme).
- Icon: inline SVG, no icon library yet. Two simple sun/moon glyphs
  swapped by current theme.

## Files touched

- `app/src/theme/theme-context.ts` — new; React context + type.
- `app/src/theme/theme-provider.tsx` — new; provider component.
- `app/src/theme/use-theme.ts` — new; consumer hook.
- `app/src/components/theme-toggle.tsx` — new; ghost-icon Button.
- `app/src/App.tsx` — wrap in `ThemeProvider`, render `ThemeToggle`.
- `app/src/main.tsx` — no change.

## Phase 0 — Research

- **localStorage key namespacing** — prefix all keys with `fde-` so the
  origin-shared storage doesn't collide with future features.
- **Class strategy vs media strategy** — class strategy lets the user
  override the OS preference. Required by the spec.
- **Why split context / provider / hook** — context export is
  type-only; the provider holds state; the hook validates membership.
  Keeping them in three files avoids react-refresh's "only export
  components" warning (same fix applied in #7).
