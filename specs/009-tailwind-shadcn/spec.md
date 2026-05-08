# Feature Specification: Tailwind CSS + shadcn/ui

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #7 — "Tailwind CSS + shadcn/ui (Radix primitives
owned in-repo) integration (decisions #7, #8)."

## User Scenarios & Testing

### User Story 1 — Utility classes work in components (P1)

A contributor writing a React component can apply Tailwind utility
classes (`flex`, `gap-2`, `text-sm`, …) and the resulting build emits
CSS that styles the page.

**Independent Test**: From `app/`, `pnpm run build` produces a `dist/`
whose CSS contains rules for the utilities used in `App.tsx`. `pnpm run
dev` shows a styled page (not the unstyled fallback).

### User Story 2 — Theme tokens are CSS variables (P1)

The app reads colour tokens (`--background`, `--foreground`, `--border`,
`--primary`, …) from CSS variables defined in a single global stylesheet
so a future light/dark switch (item #10) can flip them by toggling a
class on `<html>`.

**Independent Test**: Toggling `class="dark"` on `<html>` in the running
dev server changes the rendered background/foreground colours; no
component code changes required.

### User Story 3 — shadcn primitives owned in-repo (P2)

shadcn/ui components (e.g. `Button`) live under `app/src/components/ui/`
as plain `.tsx` files we can edit directly. No runtime dependency on a
shadcn package; the only external runtime deps are Radix primitives and
small helpers (`class-variance-authority`, `clsx`, `tailwind-merge`).

**Independent Test**: Importing `@/components/ui/button` and rendering
`<Button>Hi</Button>` produces a styled button. Editing the file
changes the appearance.

### Edge Cases

- Tailwind v4 uses CSS-first config (`@theme` in a stylesheet, plus the
  `@tailwindcss/vite` plugin). No `tailwind.config.js`. We pin v4.
- `cn()` utility (in `app/src/lib/utils.ts`) merges class names with
  `clsx` + `tailwind-merge`. shadcn-style.
- Path alias `@/*` → `app/src/*` for both Vite and TypeScript so shadcn
  imports look idiomatic.
- The Button component is the only primitive added in this item; further
  primitives land as features need them.
- ESLint must still pass on the new files (item #6).

## Requirements

- **FR-001**: Tailwind v4 installed via `tailwindcss` + `@tailwindcss/vite`,
  pinned exact.
- **FR-002**: `app/src/index.css` MUST exist, MUST `@import "tailwindcss"`,
  and MUST declare a `@theme` block with the shadcn-compatible token set
  plus a `.dark` override block.
- **FR-003**: `app/src/main.tsx` MUST import `./index.css`.
- **FR-004**: `vite.config.ts` MUST register `@tailwindcss/vite` and the
  `@/*` alias.
- **FR-005**: `tsconfig.json` MUST declare `paths: { "@/*": ["src/*"] }`
  and `baseUrl: "."`.
- **FR-006**: `app/src/lib/utils.ts` MUST export `cn(...inputs)` using
  `clsx` + `tailwind-merge`.
- **FR-007**: `app/src/components/ui/button.tsx` MUST exist as a
  shadcn-style Button (CVA variants + `cn()`); imports Radix `Slot` for
  `asChild`.
- **FR-008**: `app/src/App.tsx` MUST render a small visible test (e.g.
  centred `<Button>` on a themed background) so a smoke test confirms
  Tailwind classes resolve.
- **FR-009**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.
- **FR-010**: New runtime deps (`class-variance-authority`, `clsx`,
  `tailwind-merge`, `@radix-ui/react-slot`) and dev deps (`tailwindcss`,
  `@tailwindcss/vite`) MUST be exact-pinned (Constitution VI).

## Success Criteria

- **SC-001**: `pnpm run build` emits a CSS file under `dist/assets/` that
  contains the utilities used in `App.tsx`.
- **SC-002**: Build time stays under 5 s on a typical workstation.
- **SC-003**: Toggling `dark` class on `<html>` in dev visibly switches
  the theme without a reload-driven full restyle.

## Assumptions

- Tailwind v4 is GA and stable in 2026.
- shadcn-style "owned in-repo" components are TypeScript files we copy
  and edit, not a package dependency.
- Radix UI primitives are added one-by-one as features require them; #7
  only seeds Slot (used by Button `asChild`).
- Theme provider that toggles `dark` lands as item #10.
