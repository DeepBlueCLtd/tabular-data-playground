# Backlog — Frictionless Data Explorer

Backlog distilled from `spec.md` (v0.5) and grouped by phase per the
constitution's Principle V. Each phase is an epic (E0–E3); phases end at a
demonstrable artefact so the project doesn't leave a half-built corpse if
momentum stalls.

Initial scoring is the author's first pass and is open to revision.

## Scoring legend

| Dimension | Description | 1 | 3 | 5 |
|-----------|-------------|---|---|---|
| **V** (Value) | Contribution to evaluating Frictionless | Nice-to-have | Useful enabler | Core to the evaluation |
| **M** (Media) | Story / demo potential | Internal plumbing | Mildly interesting | Visual, demo-able |
| **A** (Autonomy) | Can proceed without resolving open questions | Blocked on decisions | Some open points | Self-contained |

**Total** = V + M + A (max 15). Use `-` where scoring is deferred.

**Complexity**: Low (Haiku-tractable), Medium (Sonnet), High (Opus / careful design).

## Status legend

| Status | Meaning |
|--------|---------|
| **proposed** | Captured, awaiting author review / scoring confirmation |
| **specified** | `/speckit-specify` run; spec exists under `specs/` |
| **planned** | `/speckit-plan` run |
| **tasked** | `/speckit-tasks` run |
| **implementing** | Active work in progress |
| **complete** | Merged and verified against the spec / Definition of Done |
| **blocked** | Waiting on an upstream item or external decision |

Strikethrough rows indicate completed work.

## Epics

| ID | Title | Description | Status |
|----|-------|-------------|--------|
| ~~E0~~ | ~~Phase 0 — De-risking Spike~~ | ~~Prove the riskiest things work and gather measurements before committing to the full build (`spec.md` §11)~~ | ~~complete~~ |
| E1 | Phase 1 — IDE Shell | App shell, virtual FS, editor, terminal, Pyodide wiring; ends at "paste a CSV, run frictionless describe, see output" (`spec.md` §11) | proposed |
| ~~E2~~ | ~~Phase 2 — Lesson System + Curriculum~~ | ~~Landing, lesson loader, eight lessons with Notes & Observations, supporting docs (`spec.md` §11)~~ | ~~complete~~ |
| ~~E3~~ | ~~Phase 3 — Polish & Freeze~~ | ~~Walkthrough fixups, README, version pinning, v1.0 tag (`spec.md` §11)~~ | ~~complete~~ |

## Backlog items

| ID | Category | Description | V | M | A | Total | Complexity | Status | Epic | Created | Updated |
|----|----------|-------------|---|---|---|-------|------------|--------|------|---------|---------|
| ~~1~~ | ~~Research Spike~~ | ~~**Spike A — Pyodide + frictionless install proof.** Static page loads Pyodide, runs `micropip.install('frictionless')`, executes `frictionless --version` and `frictionless validate <small CSV>` end-to-end, captures stdout/stderr/exit-code. Pass: works in Chrome and Firefox. Failure → re-plan (frictionless-js fallback or different runtime). (`spec.md` §10 R1, §11)~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~High~~ | ~~complete~~ | ~~E0~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~2~~ | ~~Research Spike~~ | ~~**Spike B — Mini-shell pipes prototype.** Stripped-down xterm.js + custom shell supporting `echo`, `cat`, `>`, `\|`. Pass: `echo hello \| cat > out.txt` writes `hello\n` to the virtual FS. Failure → downgrade terminal scope (no pipes/redirection in v1). (`spec.md` §10 R2, §11)~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~High~~ | ~~complete~~ | ~~E0~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~3~~ | ~~Research Spike~~ | ~~**Measurement C — Pyodide latency budget.** Time cold-start (first `frictionless` after page load) and warm calls. Output: recommendation in `docs/architecture.md` on main-thread vs Web Worker placement. Threshold: warm-call median <250 ms and cold start <3 s → main-thread acceptable for v1. Decides #32 (cancellation) and architecture of #27. (`spec.md` §10 R3, §11)~~ | ~~5~~ | ~~1~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E0~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~4~~ | ~~Infrastructure~~ | ~~Vite + TypeScript + React 18 project scaffold under `app/` per `spec.md` §9 repo structure.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~5~~ | ~~Infrastructure~~ | ~~pnpm setup with committed lockfile; CI uses `--frozen-lockfile` (decision #17).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~6~~ | ~~Infrastructure~~ | ~~ESLint + Prettier standard config wired into CI.~~ | ~~1~~ | ~~1~~ | ~~5~~ | ~~7~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~7~~ | ~~Infrastructure~~ | ~~Tailwind CSS + shadcn/ui (Radix primitives owned in-repo) integration (decisions #7, #8).~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~8~~ | ~~Feature~~ | ~~App shell layout — collapsible left rail (Activity bar: Lesson panel, File tree), centre tabbed editor area, status bar, bottom terminal panel. No router; single SPA URL (decision #28). (`spec.md` §2, §3)~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~9~~ | ~~Feature~~ | ~~Drag-to-split horizontal editor panes via `react-mosaic` or `dockview` (decision #29).~~ | ~~3~~ | ~~3~~ | ~~3~~ | ~~9~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~10~~ | ~~Feature~~ | ~~Theme provider — light/dark toggle, persisted in localStorage, broadcast to Tailwind, Monaco, and xterm (decision #12).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~11~~ | ~~Infrastructure~~ | ~~Virtual FS facade — single source of truth for files, bridged to Pyodide IDBFS and Monaco; thin layer so the backing store can be swapped later (`spec.md` §3, §5).~~ | ~~5~~ | ~~1~~ | ~~5~~ | ~~11~~ | ~~High~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~12~~ | ~~Infrastructure~~ | ~~`fs-changed` event system — mini-shell and Pyodide bridge are the only writers; file tree and editor subscribe; no polling (decision #53, `spec.md` §6.5).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~13~~ | ~~Feature~~ | ~~Monaco editor integration, lazy-loaded; tabbed editing; debounced auto-save ~500 ms after last keystroke (decision #27).~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~14~~ | ~~Feature~~ | ~~JSON Schema validation in Monaco — case-insensitive filename match: `datapackage.json` → Data Package, `dialect.json` → Dialect, `schema.json`/`*.schema.json` → Table Schema. Pinned snapshot bundled, runtime fetch with short timeout, fall back to bundle (decisions #16, #40).~~ | ~~5~~ | ~~5~~ | ~~3~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~15~~ | ~~Feature~~ | ~~File tree (`react-arborist` or equivalent) — display & navigate the virtual workspace, subscribes to `fs-changed`.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~16~~ | ~~Feature~~ | ~~File tree right-click menu — New file, New folder, Rename, Delete (decision #26).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~17~~ | ~~Feature~~ | ~~Drag-and-drop importer — files **and folders** recursively via `DataTransferItemList`; 10 MB per-file hard cap with clear error; **modal-confirm overwrite** on filename collision; drop on folder lands in folder, drop in empty space lands at root (decisions #20, #42, #43, #44, #45). Implements Principle III.~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~18~~ | ~~Feature~~ | ~~Status bar — file path of focused tab, cursor position, encoding, active JSON Schema, save state (decisions #41, `spec.md` §2).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~19~~ | ~~Feature~~ | ~~Tab persistence — open tab paths persisted in localStorage, restored on reload; content loaded fresh from FS (decisions #38, #56, `spec.md` §6.5).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~20~~ | ~~Feature~~ | ~~Reset workspace — modal-confirmed; deletes everything in `/workspace` only; does NOT touch theme, landing-page flag, or tab list (decision #30, `spec.md` §5). Implements Principle III.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~21~~ | ~~Feature~~ | ~~xterm.js terminal UI — `xterm-addon-fit`, `xterm-addon-web-links`; up/down arrow command history within session, no persistence, no Ctrl+R (decision #25).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~22~~ | ~~Feature~~ | ~~Mini-shell tokeniser — splits a line respecting single/double quotes and escape characters (~50 LoC) (`spec.md` §6).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~23~~ | ~~Feature~~ | ~~Mini-shell parser — AST of pipelines and redirections. Reject for v1: subshells `$(...)`, command substitution, env-var expansion, globs, `&&`/`\|\|`/`;` chaining, backgrounding, signal handling, tab completion. Document rejections clearly (~100 LoC) (`spec.md` §6).~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~24~~ | ~~Feature~~ | ~~Mini-shell executor — resolves each pipeline stage to JS builtin or Pyodide call; streams stdout via async iterators / `ReadableStream`; serialised + buffered pipes (decision #4) (~200 LoC) (`spec.md` §6).~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~High~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~25~~ | ~~Feature~~ | ~~Mini-shell builtins — `ls`, `cat`, `cd`, `pwd`, `mkdir`, `rm`, `echo`.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~26~~ | ~~Feature~~ | ~~Pre-execution flush — editor cancels pending auto-saves and writes synchronously before mini-shell dispatches (decision #48, `spec.md` §6.5). Eliminates editor↔terminal race.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~27~~ | ~~Infrastructure~~ | ~~Pyodide loader — load from CDN, version pinned, hybrid load (after lesson panel paints); architecture (main thread vs Web Worker) determined by item #3. (decisions #5, #10)~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~High~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~28~~ | ~~Infrastructure~~ | ~~Pyodide command bridge — wrap Python entry-point invocation, feed stdin string, capture stdout/stderr/exit-code via `runPythonAsync` + stdin/stdout redirection patches; emits `fs-changed` on FS writes (`spec.md` §6).~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~High~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~29~~ | ~~Feature~~ | ~~Pyodide loading-state UI — terminal input disabled (greyed prompt), status line "Loading Python…" until ready; editor and file tree fully functional throughout (decision #54, `spec.md` §6.5).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~30~~ | ~~Feature~~ | ~~Pyodide crash recovery — manual "Reload runtime" button on fatal error; no automatic re-init in v1 (decision #46, `spec.md` §6.5).~~ | ~~1~~ | ~~1~~ | ~~5~~ | ~~7~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~31~~ | ~~Feature~~ | ~~Cancellation — Ctrl+C and Cancel button via `worker.terminate()` (Pyodide is on a Web Worker per Measurement C #3 verdict, recorded in `docs/architecture.md`). (decision #47, `spec.md` §6.5).~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~32~~ | ~~Feature~~ | ~~"Best on a wider screen" notice below ~900 px width; no responsive layout work (decision #6, `spec.md` §10 R8).~~ | ~~1~~ | ~~1~~ | ~~5~~ | ~~7~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~33~~ | ~~Infrastructure~~ | ~~GitHub Actions CI — `pnpm build` and `pnpm test` on PR.~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~34~~ | ~~Infrastructure~~ | ~~GitHub Pages deploy on push to `main`.~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Low~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~35~~ | ~~Infrastructure~~ | ~~Playwright Chromium-only smoke test against the built site (decision #13).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Medium~~ | ~~complete~~ | ~~E1~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~36~~ | ~~Feature~~ | ~~Landing page — first-visit "What is this? Who's it for?" gate with Start button into the IDE; `localStorage` flag suppresses on return; "What is this?" link in IDE chrome lets user revisit (decisions #18, #39, `spec.md` §2).~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~37~~ | ~~Feature~~ | ~~Curriculum index in lesson panel as default view (`spec.md` §2, §7).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~38~~ | ~~Feature~~ | ~~Lesson loader — read markdown lessons from `/content/lessons/`, render via `react-markdown` + `remark-gfm` + `rehype-highlight` (decision #9, `spec.md` §7). Lesson index built at compile time from `meta.json`.~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~39~~ | ~~Feature~~ | ~~Copy + Run buttons on bash code blocks — `<code>` renderer override on react-markdown injects an action bar; Run uses terminal's public API to write the command and trigger execution (decision #1, `spec.md` §7).~~ | ~~5~~ | ~~5~~ | ~~5~~ | ~~15~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~40~~ | ~~Feature~~ | ~~Run button states — disabled while Pyodide loading, disabled while previous command in flight (no command queueing in v1), idle/clickable otherwise; most-recently-clicked block visually marked. Copy button always enabled (`spec.md` §7).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~41~~ | ~~Feature~~ | ~~"Load lesson files" action — copies `/content/lessons/<slug>/files/` into `/workspace/<slug>/`; modal-confirm overwrite when destination has user-edited files (decisions #19→#49, #51, `spec.md` §5). Implements Principle III.~~ | ~~5~~ | ~~3~~ | ~~5~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~42~~ | ~~Content~~ | ~~**Lesson 1 — Describe a CSV.** Auto-generate metadata from a single file via `frictionless describe`. Includes Notes & Observations section per Principle II (`spec.md` §8).~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~43~~ | ~~Content~~ | ~~**Lesson 2 — Write a Schema by hand.** Hand-author a Table Schema; understand types & constraints; `frictionless validate --schema`. Notes & Observations section. (`spec.md` §8)~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~44~~ | ~~Content~~ | ~~**Lesson 3 — Validate & fix errors.** Read a validation report, iteratively fix bad data; error types. Notes & Observations section. (`spec.md` §8)~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~45~~ | ~~Content~~ | ~~**Lesson 4 — Build a Data Package.** Multiple resources, package-level metadata, `datapackage.json`; `frictionless describe` on a folder. Notes & Observations section. Order intentionally before Dialect (decision #3). (`spec.md` §8)~~ | ~~5~~ | ~~3~~ | ~~3~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~46~~ | ~~Content~~ | ~~**Lesson 5 — Dialect & encoding quirks.** Tabs, semicolons, BOMs, non-UTF-8 CSVs; Table Dialect spec. Front-load a real-world "sketchy CSV from a vendor" example rather than abstract dialect theory (`spec.md` §8 critical analysis). Notes & Observations section.~~ | ~~3~~ | ~~3~~ | ~~3~~ | ~~9~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~47~~ | ~~Content~~ | ~~**Lesson 6 — Transform.** A small ETL: read, reshape, write via `frictionless transform`. Pin Frictionless version explicitly; surface version in lesson; revisit on each upgrade (`spec.md` §8 critical analysis, §10 R6). Notes & Observations section.~~ | ~~5~~ | ~~3~~ | ~~1~~ | ~~9~~ | ~~High~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~48~~ | ~~Content~~ | ~~**Lesson 7 — Inquiry.** Validate many resources in one go; `frictionless validate <inquiry.json>`. Keep it short — conceptually thin once Validate is understood (`spec.md` §8). Notes & Observations section.~~ | ~~3~~ | ~~1~~ | ~~3~~ | ~~7~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~49~~ | ~~Content~~ | ~~**Lesson 8 — Publish & consume.** Read a remote `datapackage.json`. Primary example uses self-hosted package in this repo's `gh-pages` branch (under our control); secondary "now try this real one" callout points at a public package like one from datahub.io (`spec.md` §8 critical analysis). Notes & Observations section.~~ | ~~5~~ | ~~5~~ | ~~3~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~50~~ | ~~Documentation~~ | ~~`docs/lesson-authoring.md` — how to write a new lesson (folder layout, `meta.json`, code-block conventions, Notes & Observations template). (`spec.md` §9)~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~51~~ | ~~Documentation~~ | ~~`docs/limitations.md` — enumerate Pyodide quirks, no SharedArrayBuffer, serialised pipes, no `&&`/`\|\|`/`;` chaining, `ModuleNotFoundError` for unavailable packages, no in-IDE notes, no mobile, no in-band cancellation if main-thread (decisions #14, #15, #21, #52, #55, `spec.md` §6.5). Implements Principle VII.~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~52~~ | ~~Documentation~~ | ~~`docs/architecture.md` — diagrams, deeper dives, and the Phase 0 measurement C findings (depends on #3). (`spec.md` §9)~~ | ~~3~~ | ~~3~~ | ~~3~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E2~~ | ~~2026-05-08~~ | 2026-05-08 |
| ~~53~~ | ~~Polish~~ | ~~Solo-author walkthrough of the entire curriculum end-to-end; fix whatever cracks appear (`spec.md` §11 Phase 3).~~ | ~~5~~ | ~~1~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E3~~ | ~~2026-05-08~~ | 2026-05-09 |
| ~~54~~ | ~~Documentation~~ | ~~README — project framing, setup, screenshot, **short summary of evaluation findings** drawn from the Notes & Observations sections (`spec.md` §11 Phase 3, §13).~~ | ~~5~~ | ~~5~~ | ~~3~~ | ~~13~~ | ~~Medium~~ | ~~complete~~ | ~~E3~~ | ~~2026-05-08~~ | 2026-05-09 |
| ~~55~~ | ~~Release~~ | ~~Pin Frictionless version and JSON Schema versions; record in README (decision #11, Principle VI, `spec.md` §11 Phase 3, §13).~~ | ~~3~~ | ~~1~~ | ~~5~~ | ~~9~~ | ~~Low~~ | ~~complete~~ | ~~E3~~ | ~~2026-05-08~~ | 2026-05-09 |
| ~~56~~ | ~~Release~~ | ~~Verify Definition of Done (`spec.md` §13): site reachable & loads <8 s broadband cold cache; all 8 lessons run end-to-end; Notes sections populated; terminal feature set complete; workspace persistence + Reset working; CI green; README + version pinning done.~~ | ~~5~~ | ~~1~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~E3~~ | ~~2026-05-08~~ | 2026-05-09 |
| ~~57~~ | ~~Release~~ | ~~Tag v1.0; freeze the artefact as a dated reference (Principle VI, decision #35).~~ | ~~5~~ | ~~5~~ | ~~5~~ | ~~15~~ | ~~Low~~ | ~~complete~~ | ~~E3~~ | ~~2026-05-08~~ | 2026-05-11 |
| ~~48~~ | ~~Feature~~ | ~~Terminal tab autocomplete — first-token completion across mini-shell builtins + Pyodide-backed commands; later-token completion against the VFS; longest-common-prefix expansion + candidate list on double-Tab; no-op while terminal busy. Reverses the v1 rejection in `spec.md` §10 and lands a new `complete.ts` module (`specs/048-tab-autocomplete/`).~~ | ~~3~~ | ~~3~~ | ~~5~~ | ~~11~~ | ~~Medium~~ | ~~complete~~ | ~~post-v1.0~~ | ~~2026-05-11~~ | 2026-05-11 |
