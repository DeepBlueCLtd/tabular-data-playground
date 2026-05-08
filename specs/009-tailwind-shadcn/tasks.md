# Tasks: Tailwind CSS + shadcn/ui (Backlog #7)

## Phase 1: Deps + config

- [X] T001 Add devDependencies (`tailwindcss`, `@tailwindcss/vite`) and runtime deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`) to `app/package.json` at exact pinned versions.
- [X] T002 Update `app/vite.config.ts`: import and register `@tailwindcss/vite`; add `resolve.alias` `@` → `/src`.
- [X] T003 Update `app/tsconfig.json`: `compilerOptions.baseUrl: "."`, `paths: { "@/*": ["src/*"] }`.

## Phase 2: Theme + utility wiring

- [X] T004 Create `app/src/index.css` — `@import "tailwindcss"`, `:root` + `.dark` HSL channel tokens, `@theme inline` mapping to `--color-*` utilities.
- [X] T005 Create `app/src/lib/utils.ts` exporting `cn(...inputs: ClassValue[])` via `clsx` + `tailwind-merge`.
- [X] T006 Import `./index.css` from `app/src/main.tsx`.

## Phase 3: shadcn Button primitive

- [X] T007 Create `app/src/components/ui/button-variants.ts` (CVA variants: default/secondary/destructive/outline/ghost/link; sizes: sm/default/lg/icon). Split out so Button file stays component-only.
- [X] T008 Create `app/src/components/ui/button.tsx` (forwarded ref, `asChild` via Radix Slot, imports `buttonVariants`).
- [X] T009 Update `app/src/App.tsx` to render three `<Button>` variants on the themed background.

## Phase 4: Install + verify

- [X] T010 `pnpm install` to refresh lockfile.
- [X] T011 `pnpm run lint && pnpm run format:check && pnpm run build` — all exit 0.
- [X] T012 Spot-check `dist/assets/*.css` contains `bg-primary`, `text-primary-foreground`, hover utilities.

## Phase 5: Backlog + commit

- [X] T013 Strikethrough `#7` in `backlog.md`; bump Updated.
- [X] T014 Three commits: `feat(#7)`, `docs(#7)`, `docs: backlog status`.
