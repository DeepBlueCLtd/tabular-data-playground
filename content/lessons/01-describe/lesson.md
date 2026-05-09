# Describe a CSV

`frictionless describe` reads a tabular data source and infers
metadata about it — column names, types, and (with `--stats`) row
counts and content hashes. It's the entry point to the Frictionless
toolchain: every later step (validate, schema authoring, package
building) starts from a description.

This lesson runs `describe` on a small CSV and reads what it gives back.

## Set up

Click **Load lesson files** in the lesson header. That copies
`books.csv` into `/workspace/01-describe/`. Then move into the
folder so the commands below work with relative paths:

```bash
cd 01-describe
```

Have a look at what's there:

```bash
ls
cat books.csv
```

The CSV has six columns: `id`, `title`, `author`, `published_year`,
`pages`, `in_print`.

## Describe it

```bash
frictionless describe books.csv
```

Two tables come back:

- **Dataset**: the resource's identity — name (derived from the
  filename), type (`table`), and path.
- **Tables**: each column with the type Frictionless inferred for
  it.

Notice the inferred types: `id` and `pages` are `integer`,
`title` and `author` are `string`, `in_print` is `boolean`.
`published_year` is `integer` too — Frictionless does not infer
the more specific `year` type by default.

## See the full metadata

The default output is a Rich-formatted summary. To see what
Frictionless will actually serialise into a `datapackage.json` or a
schema later, ask for JSON:

```bash
frictionless describe books.csv --json
```

That gives you the complete resource description — `name`, `path`,
`scheme: file`, `format: csv`, `mediatype: text/csv`,
`encoding: utf-8`, and an embedded `schema` with the field list.
This is the canonical form: machine-readable, version-controllable,
the thing every other Frictionless tool consumes.

## Schema only

If you just want the schema (the field-types block), narrow the
output:

```bash
frictionless describe books.csv --type schema --json
```

Save it for later use:

```bash
frictionless describe books.csv --type schema --json > schema.json
cat schema.json
```

(You'll hand-edit a schema like this in lesson 2.)

## Stats — counts, bytes, hashes

Add `--stats` to compute extra fields:

```bash
frictionless describe books.csv --stats
```

The Dataset table now shows `bytes`, `fields`, `rows`, and a
SHA-256 `hash` of the file. Use these to verify a file hasn't
changed since you described it — a small but real reproducibility
mechanism.

## Variations to try

- Pipe the JSON into `cat` (just to read it without scrolling):

  ```bash
  frictionless describe books.csv --json | cat
  ```

- Combine schema + stats:

  ```bash
  frictionless describe books.csv --stats --json
  ```

- Describe a folder rather than a single file (Frictionless infers
  a Data Package — covered in lesson 4):

  ```bash
  cd ..
  frictionless describe 01-describe
  ```

## Notes & Observations

> Filled in while authoring this lesson against `frictionless 5.19.0`.

### What worked

- Type inference is quick and accurate for the well-formed columns
  here: `boolean` was caught from `true`/`false` strings;
  `integer` from `id`/`pages`; UTF-8 strings (Stanisław, Arkady &)
  passed through cleanly.
- The default Rich output is friendly for browsing, and the
  `--json` switch gives the canonical form without needing to
  re-run a different command. The mental model "human form is the
  default; JSON is one flag away" was easy to internalise.
- Redirection (`> schema.json`) works in the mini-shell exactly as
  it does in a real shell — the lesson code blocks ran end-to-end
  without surprises.

### What surprised

- `published_year` was inferred as `integer`, not `year`, even
  though Frictionless ships a `year` type. The default inference
  heuristics don't reach for the date/time family unless the
  values are unambiguously dates. **Action**: lesson 2 (hand-
  written schemas) will revisit this and replace the inferred
  `integer` with `year`.
- The `--type schema` flag is necessary to get *just* the schema
  block; without it, `--json` returns the whole resource
  description. The Frictionless docs use `describe --type` as the
  knob across all sub-types (resource, schema, dialect, package),
  which is consistent but easy to miss on first read.
- `--stats` without `--json` shows totals at the dataset level
  (bytes, rows, hash) but not per-field statistics. The
  per-field stats only appear in the JSON form. Worth flagging.

### What required workarounds

- Nothing in this lesson. The flow is the cleanest in the whole
  curriculum precisely because `describe` is the simplest entry
  point.

### Open questions

- Is there a programmatic way to pin the type-inference behaviour
  so a re-run on a slightly different file produces the same
  schema? Relevant for CI scenarios. Likely answered in the
  Frictionless API docs but not surfaced in the CLI help.
- The CSV file's header row is detected automatically. What does
  `describe` do on a headerless file? (Probably needs `--dialect`
  with `headerRows: []`; covered in lesson 5.)
