# Authoring a Lesson

This document is for the curriculum author. It describes how the
lesson loader, renderer, and supporting actions work, and the
conventions you must follow so a new lesson appears correctly in
the deployed site.

> **Audience**: the person writing a lesson. If you are a learner
> opening a lesson, you don't need to read this.

## TL;DR — Adding a lesson

```sh
mkdir -p content/lessons/01-describe/files
$EDITOR content/lessons/01-describe/meta.json
$EDITOR content/lessons/01-describe/lesson.md
# (optional) drop starter files into content/lessons/01-describe/files/
cd app && pnpm build
```

That's it. The lesson appears in the curriculum index in its
`order` slot. No code changes required.

---

## Folder layout

```
content/lessons/
└── <slug>/
    ├── lesson.md         # required — the body
    ├── meta.json         # required — display metadata
    └── files/            # optional — starter files copied to /workspace/<slug>/
        └── ...
```

`<slug>` **is** the canonical id and **must** equal the folder name.
Use kebab-case ASCII (e.g. `04-package`, `06-transform`). The slug
appears in the URL-shaped path under `/workspace/<slug>/` once the
learner clicks **Load lesson files**.

### Dev-only lessons

Folders whose name starts with `_` (e.g. `_sample`, `_aa-second`)
are **dev-only**: they are visible during `pnpm dev` and during
e2e (the Playwright build sets `VITE_INCLUDE_DEV_LESSONS=1`) but
**excluded from production builds**. Use this for fixtures or
in-progress lessons you don't want shipped.

---

## `meta.json`

```json
{
  "title": "Describe a CSV",
  "slug": "01-describe",
  "order": 1,
  "summary": "Auto-generate metadata from a single file with frictionless describe.",
  "estimatedMinutes": 15
}
```

### Required fields

| Field              | Type    | Constraint |
|--------------------|---------|------------|
| `title`            | string  | non-empty, ≤ 80 chars |
| `slug`             | string  | matches folder name, `^[a-z0-9_][a-z0-9-]*$` |
| `order`            | integer | `>= 0`, unique across the curriculum |
| `summary`          | string  | non-empty, ≤ 200 chars |
| `estimatedMinutes` | integer | `>= 1` |

### Build-fail rules (the eight)

`pnpm build` fails — non-zero exit, message names the offending
file — when any of these is violated:

1. `lesson.md` missing.
2. `meta.json` missing.
3. `meta.json` is not parseable JSON.
4. A required field above is missing.
5. `slug` does not equal the folder name.
6. `order` is not an integer or is negative.
7. Two lessons share the same `slug`.
8. Two lessons share the same `order`.

Unknown additional fields in `meta.json` are tolerated — the build
logs a `console.warn` but does not fail. Use this for transient
experimentation; remove the unknown field before merge.

The canonical schema is at
[`specs/036-lesson-loader/contracts/meta-schema.json`](../specs/036-lesson-loader/contracts/meta-schema.json).
Drop the schema URL into your editor for inline validation.

---

## `lesson.md` — markdown conventions

Plain CommonMark + GitHub-Flavored Markdown. The renderer is
`react-markdown` 10.x with `remark-gfm` and `rehype-highlight`.

### Supported features

- Headings, paragraphs, lists, blockquotes — standard CommonMark.
- **GFM**: tables, task lists, strikethrough, autolinked URLs,
  fenced code blocks.
- **Inline links**:
  - external (`http://...` / `https://...`) → opens in a new tab
    with `rel="noopener noreferrer"`,
  - relative / in-page anchors → pass through unchanged.
- **Inline code** (`` `frictionless validate` ``) — rendered
  monospace.

### Not supported

- **Raw HTML** is stripped (CommonMark default; deliberate). If
  you need formatting markdown can't express, raise it as a spec
  question first.
- **Relative-path images** in v1 (e.g. `![alt](./diagram.png)`)
  are out of scope. Use `data:` URIs or absolute Pages-base paths.
  See [docs/limitations.md](./limitations.md).

### Code blocks

| Language tag | Behaviour |
|--------------|-----------|
| `bash`       | Highlighted, **plus Copy + Run buttons** above the block. |
| `json`       | Highlighted (allow-list). |
| `python`     | Highlighted (allow-list). |
| `yaml`       | Highlighted (allow-list). |
| `csv`, `text`, anything else | Rendered as plain monospace. No highlighter; no Copy/Run. |
| no tag       | Same as plain monospace. |

The allow-list is small on purpose: full `highlight.js` registers
~200 languages and bloats the bundle. Adding a language is a
deliberate spec change — see
[`specs/036-lesson-loader/research.md`](../specs/036-lesson-loader/research.md)
§D3.

### Copy + Run

Every fenced ` ```bash ` block automatically gets a Copy and a Run
button:

- **Copy** writes the exact block source to the clipboard, no
  prompt prefix, no fence markers.
- **Run** types the command into the terminal as if the learner
  had typed it, and submits.

Authoring conventions:

- **One command per block.** The mini-shell does not support line
  continuation (`\`); a newline ends the command.
- **No leading `$ `.** Don't start commands with a shell prompt
  marker; the terminal adds its own. (`Copy` would copy the `$ `
  too — confusing.)
- **No interactive prompts.** The mini-shell has no stdin TTY.
  Tools like `read`, `python -i`, `frictionless --interactive`
  won't work.
- **Pipes and redirection are supported** (`|`, `>`, `>>`, `<`).
- **`&&`, `||`, `;`, `&`, subshells `$(...)`, env-var expansion,
  and globs are NOT.** See
  [docs/limitations.md](./limitations.md).

Run-button states (#40):

- Disabled while Pyodide is loading or while any other command
  (typed or Run) is in flight.
- Most-recently-clicked block has a left-edge accent — use this
  to remember "where you were" in the lesson.

### Starter files

If a lesson has a `files/` subfolder, the lesson view shows a
**Load lesson files** button in its header. Clicking copies
everything under `files/` into `/workspace/<slug>/`, mirroring
the relative paths.

If the destination already has files, a modal asks to confirm
overwrite (Principle III). Files in `/workspace/<slug>/` that
*don't* match a starter path (e.g. learner's `notes.txt`) are
preserved.

Author conventions for `files/`:

- Keep them small. There is no per-file size cap (unlike
  drag-and-drop import, which caps at 10 MB), but every byte
  ships in the bundle.
- Subfolders are fine — `files/raw/2025/sample.csv` lands at
  `/workspace/<slug>/raw/2025/sample.csv`.
- Don't include build output, `__pycache__`, `.DS_Store`, etc.

---

## Notes & Observations — the durable output (Principle II)

Every lesson **must** end with a Notes & Observations section. This
is the author-side artefact; it's what the project ships in v1.1
and what makes the build-it-to-learn-it discipline meaningful.

Fill it in **as you build the lesson**, not after.

### Template

````markdown
## Notes & Observations

> Filled in while authoring this lesson, not afterwards.

### What worked

- ...

### What surprised

- ...

### What required workarounds

- ...

### Open questions

- ...
````

A lesson whose Notes section ends up empty or unenlightening is
a **signal to rework that lesson** before tagging v1.0. Don't
ship one with `// TODO`.

---

## Local development loop

```sh
cd app
pnpm dev          # http://localhost:5173
```

In dev mode:

- All lessons are visible (`_*` included).
- HMR picks up edits to existing `lesson.md` / `meta.json`
  files immediately.
- Adding a **new** lesson folder usually triggers a re-glob, but
  occasionally a manual reload is needed. If the new lesson
  doesn't appear, save the dev process and re-run `pnpm dev`.
  (Captured as a constraint in
  [docs/limitations.md](./limitations.md).)

### Verifying production behaviour locally

```sh
pnpm build
pnpm preview
```

Production build excludes `_*` lessons and runs every validation
rule. If you've broken any of the eight rules, the build fails.

### Running the e2e suite

```sh
pnpm test:e2e     # full Playwright suite (Chromium)
```

Tests that require Pyodide to fully load (Run-button flows,
Load-lesson-files flows) skip gracefully when the environment can't
reach the Pyodide CDN from a Worker context. The deployed Pages
site is the authoritative gate (per [`spec.md`](../spec.md) §11).

---

## Boundaries & cross-references

- **What this doc does NOT cover**: the IDE shell, the mini-shell
  syntax, the Pyodide bridge, the editor, schema validation. See
  [`spec.md`](../spec.md) and [`docs/architecture.md`](./architecture.md).
- **Sharp edges and constraints**:
  [`docs/limitations.md`](./limitations.md).
- **Per-feature design notes**: `specs/<NNN-slug>/spec.md` and
  `plan.md`.

If something here disagrees with `spec.md`, `spec.md` wins —
flag the conflict and we update this doc.
