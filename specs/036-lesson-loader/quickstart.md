# Quickstart — Adding a Lesson

Once #38 is implemented, adding a lesson is folder-and-rebuild.

## 1. Create the folder

```sh
mkdir -p content/lessons/01-describe/files
```

The folder name **is** the slug. Use kebab-case ASCII; numbers are fine.
A leading underscore (e.g. `_sample`) marks the folder as
dev-only — it renders in `pnpm dev` but is excluded from `pnpm build`.

## 2. Write `meta.json`

```json
{
  "title": "Describe a CSV",
  "slug": "01-describe",
  "order": 1,
  "summary": "Auto-generate metadata from a single file with frictionless describe.",
  "estimatedMinutes": 15
}
```

`slug` MUST equal the folder name. `order` MUST be unique across lessons.

## 3. Write `lesson.md`

Standard CommonMark + GitHub-Flavored Markdown.

````markdown
# Describe a CSV

A single CSV is the simplest data resource we can describe.

## Try it

```bash
frictionless describe data.csv
```

## Notes & Observations

- _Filled in while authoring this lesson — not afterwards._
````

> The `bash`-tagged code block becomes a Copy + Run pair after #39
> ships. Until then the block renders as a plain (highlighted) code
> block.

## 4. Build

```sh
cd app
pnpm build
```

The new lesson appears in the curriculum index in the position dictated
by its `order`. If the build fails with a "lesson loader" message, fix
`meta.json` per the message and rebuild.

## Smoke test

```sh
pnpm dev
# open http://localhost:5173, click the Lessons activity icon,
# pick the new lesson, verify the body renders.
```

## Removal

Delete the folder; rebuild. The lesson disappears cleanly from the index.
