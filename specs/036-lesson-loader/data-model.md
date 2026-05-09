# Data Model — Lesson Loader (#38)

This feature is read-only and ships its data as bundled assets. There is
no persisted state and no IndexedDB / localStorage involvement.

## Entities

### `LessonMeta`

Source of truth: `content/lessons/<slug>/meta.json`.

| Field            | Type    | Required | Constraint |
|------------------|---------|----------|------------|
| `title`          | string  | yes      | non-empty, ≤ 80 chars |
| `slug`           | string  | yes      | matches folder name; `^[a-z0-9][a-z0-9-]*$` |
| `order`          | integer | yes      | `>= 0`, unique across the curriculum |
| `summary`        | string  | yes      | non-empty, ≤ 200 chars (UI may truncate) |
| `estimatedMinutes` | integer | yes    | `>= 1` |

Underscored slugs (`_sample`, etc.) are valid input but excluded from
production builds (see research D7).

Unknown fields are kept and logged as a warning, not an error
(spec FR-020). They MAY be consumed by later items (e.g. #41 might add
`hasFiles`).

### `Lesson`

In-memory composition of metadata + body string.

| Field    | Type     | Notes |
|----------|----------|-------|
| `slug`   | string   | from folder name |
| `meta`   | `LessonMeta` | validated |
| `body`   | string   | raw markdown, imported via `?raw` |

### `LessonIndex`

The collection consumed by the lesson panel.

| Field      | Type           | Notes |
|------------|----------------|-------|
| `entries`  | `LessonMeta[]` | sorted ascending by `order` |
| `bySlug`   | `Map<string, Lesson>` | full body included; lookup by slug |

The index is built once at module load and frozen.

## Validation rules (build-time)

Defined by spec FR-005 / FR-006. Each rule terminates the build:

1. Folder under `/content/lessons/` is missing `lesson.md`.
2. Folder under `/content/lessons/` is missing `meta.json`.
3. `meta.json` is not parseable JSON.
4. Any required field above is missing.
5. `slug` does not equal the folder name.
6. `order` is not an integer or is negative.
7. Two lessons share `slug` (would only happen via folder rename
   collision in source control).
8. Two lessons share `order`.

Underscored slugs are skipped from the duplicate-`order` check **only**
when building for production; in dev, they participate so authors notice
collisions early.

## State transitions

None. The index is immutable after build. The lesson panel maintains a
single `selectedSlug | null` UI state, which is not a model concern.
