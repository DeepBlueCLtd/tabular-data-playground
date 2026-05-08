# Data Model — Spike B

The spike has no persistent storage. In-memory entities:

## Token

Produced by the tokeniser.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'word' \| 'pipe' \| 'redirect'` | Token kind. |
| `value` | `string` | For `word`, the unquoted text; for `pipe` and `redirect`, the literal `\|` or `>`. |
| `pos` | `number` | Source position (start index into the original line). For error messages. |

## Pipeline (AST)

Produced by the parser.

```
Pipeline = {
  stages: Command[],         // length >= 1
  redirect?: { op: '>', target: string }  // attached to last stage only
}
Command = {
  argv: string[]             // argv[0] is the command name
}
```

## Stream chunk

A pipe stage's output is an `AsyncIterable<Uint8Array>`. The executor
materialises the iterable into a single `Uint8Array` (concat) bounded
by 1 MiB; that buffer becomes the next stage's stdin (also a single
`Uint8Array`).

## Virtual FS

```
VFS = {
  cwd: '/workspace',
  files: Map<string, Uint8Array>     // absolute-path keys
}
```

- No directory entities; "directories" are inferred as the set of
  unique non-empty path prefixes ending in `/`.
- `ls` lists files whose path starts with `cwd + '/'` and whose
  remainder contains no further `/` (one level only).

## Self-check Result

| Field | Type |
|-------|------|
| `name` | string (assertion key, e.g. `pipeline_redirect`) |
| `command` | string (the line driven through the shell, or `null` for FS-only assertions) |
| `passed` | boolean |
| `details` | string (why it failed, or a short summary on pass) |

The page renders the array of `SelfCheckResult` and computes outcome
= `results.every(r => r.passed) ? 'PASS' : 'FAIL'`.
