# Data Model — Load lesson files (#41)

## Entities

### `LessonStarterFile`

| Field           | Type     | Notes |
|-----------------|----------|-------|
| `relativePath`  | string   | Path inside `content/lessons/<slug>/files/`, e.g. `"data.csv"` or `"raw/2025/sample.csv"`. POSIX separators. |
| `assetUrl`      | string   | The `?url`-glob URL Vite emits, used by `fetch()` at copy time. |

### `LessonFiles`

Per-lesson collection consumed by `getLessonFiles(slug)`.

| Field       | Type                          | Notes |
|-------------|-------------------------------|-------|
| `slug`      | string                        | Lesson slug. |
| `files`     | `readonly LessonStarterFile[]` | Ordered by `relativePath` for deterministic UX. |

### `LessonMeta` (extended)

`hasFiles: boolean` is appended (derived; not authored). Existing
fields unchanged.

## Validation rules

1. `relativePath` MUST NOT contain `..` segments — guarded by the
   path derivation regex.
2. The set of `relativePath` values MUST be unique within a lesson —
   guaranteed by the filesystem; defensive check in the loader.

## State transitions (UI)

```
       click             collide?
       ────► [confirming]  yes
            │
            ▼ no
       [copying] ──ok──► [done]
            │
            └─error──► [error] ──ok──► [idle]

confirming ──cancel──► [idle]
confirming ──overwrite──► [copying]
```

`[copying]` keeps the button disabled (FR-006). On `[done]` the
button returns to idle; the file tree reflects the new state via
`fs-changed`.
