# Implementation Plan: Tailwind CSS + shadcn/ui

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Wire Tailwind v4 via `@tailwindcss/vite`. Establish shadcn-style
"owned in-repo" component layout: `cn()` helper, `components/ui/`
directory, one Button primitive. Define CSS-variable theme tokens with a
`.dark` override block so item #10 only needs to toggle the class.
Pin every new dep exact. No theme provider yet.

## Constitution Check

1. Research-first — pass (Tailwind/shadcn are evaluation-supporting
   infrastructure for the IDE shell).
2. Notes-section — N/A (infra).
3. Destruction — pass (no destructive flow).
4. Backend — pass.
5. Pinning — pass; new deps pinned in Notes below.
6. Limitations — pass; no new sharp edge.

All gates pass. No Complexity Tracking entries.

## Technical Context

- Tailwind v4 with CSS-first config; `@import "tailwindcss"` in
  `index.css`; `@theme` block defines tokens.
- `@tailwindcss/vite` plugin for first-party Vite integration.
- shadcn-style: components are TypeScript files in `app/src/components/ui/`,
  edited freely. CVA + Radix Slot. No `npx shadcn add` in CI; we
  hand-author the small set we need as we need it.
- Path alias `@/*` → `src/*` via Vite `resolve.alias` and TS
  `compilerOptions.paths`.

## Notes — Pinned Tooling

| Package | Version | Kind |
|---------|---------|------|
| tailwindcss | 4.1.11 | dev |
| @tailwindcss/vite | 4.1.11 | dev |
| class-variance-authority | 0.7.1 | runtime |
| clsx | 2.1.1 | runtime |
| tailwind-merge | 2.6.0 | runtime |
| @radix-ui/react-slot | 1.1.1 | runtime |

All exact pins; lockfile (#5) records resolved transitive tree.

## Files touched

- `app/package.json` — add deps.
- `app/vite.config.ts` — register `@tailwindcss/vite` + `@` alias.
- `app/tsconfig.json` — `baseUrl` + `paths`.
- `app/src/index.css` — new; Tailwind import + `@theme` + `.dark`.
- `app/src/main.tsx` — import `./index.css`.
- `app/src/lib/utils.ts` — new; `cn()`.
- `app/src/components/ui/button.tsx` — new; Button component.
- `app/src/components/ui/button-variants.ts` — new; CVA variants split out
  so Button file is component-only (keeps `react-refresh` happy).
- `app/src/App.tsx` — render `<Button>` on themed background to verify.
- `app/eslint.config.js` — no change expected; verify lint is green.

## Phase 0 — Research

- **Tailwind v4 vs v3** — v4 has CSS-first config and a Vite plugin; no
  `tailwind.config.js` needed. Faster dev rebuilds. shadcn examples
  upstream now show v4 wiring.
- **Owning components in-repo** — copy primitives directly rather than
  depend on a shadcn npm package. Trade-off: we pay for upgrades, gain
  no transitive surprise.
- **CVA** — `class-variance-authority` is the de-facto variant helper
  used by shadcn; tiny dep, type-safe.
- **`cn()` helper** — standard shadcn util, merges with
  `tailwind-merge` so conflicting utility classes deduplicate to the
  later one.
- **Theme tokens** — define raw HSL channel triples in `:root` /
  `.dark` (e.g. `--background: 0 0% 100%`), then map them to colour
  utilities via `@theme inline { --color-background: hsl(var(--background)); … }`.
  The `.dark` block redefines the channels; toggling `.dark` on `<html>`
  switches every utility-driven colour. This is the shadcn-on-v4 idiom.
- **Tailwind v4.0.0 vs 4.1.x** — v4.0.0 (the initial GA) has a known
  vite-plugin crash on `@theme inline`. We pin 4.1.11 instead — same
  major, stable patch.
