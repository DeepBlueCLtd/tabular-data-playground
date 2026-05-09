# Validate & fix errors

`frictionless validate` is the workhorse. Lesson 2 showed the
green path. This lesson shows the red path: a CSV that looks
right but doesn't satisfy its schema, and how to read the report
to fix it.

## Set up

Click **Load lesson files**. Two files appear:

- `books-messy.csv` — looks like a books table but contains six
  problems.
- `schema.json` — the strict schema from lesson 2.

```bash
cd 03-validate
cat books-messy.csv
```

Read the rows. Some issues might jump out (a duplicated id, an
empty title); others are subtle (`yes` vs `true`, `0` for pages,
`nineteen eighty four` for the year).

## Schema-less validate is weaker than it looks

Run validate with **no** schema first:

```bash
frictionless validate books-messy.csv
```

The status comes back **VALID**. Surprised? Without a schema,
`validate` only checks structural integrity: every row has the
expected number of columns, the file parses as CSV, the encoding
holds. It cannot detect that "yes" isn't a real boolean or that
two rows share an `id` — those are *semantic* questions and need
a schema to answer.

**Takeaway**: in production, always pair `validate` with an
explicit schema. The default mode is a parser check, not a
correctness check.

## Validate against the schema

```bash
frictionless validate books-messy.csv --schema schema.json
```

The status flips to **INVALID** and the report lists six rows.
Walk through them.

### Error type 1 — `type-error`

Two of these:

- Row 3, field `in_print`: cell `"yes"` — type is
  `boolean/default`. Frictionless's default boolean type accepts
  `true`/`false` (case-insensitive). `yes` and `no` are not in
  that set.
- Row 6, field `published_year`: cell `"nineteen eighty four"` —
  type is `year/default`. The text isn't parseable as a four-
  digit year.

**Fix**: change `yes` → `true` and `nineteen eighty four` → `1984`.

(Aside: if your real-world data legitimately uses `yes`/`no`,
override the type with a custom `trueValues`/`falseValues`
list — covered briefly in lesson 5.)

### Error type 2 — `constraint-error`

Two of these:

- Row 4, field `title`: cell `""` violates `constraint
  "required" is "True"`. The title is missing.
- Row 5, field `pages`: cell `"0"` violates `constraint
  "minimum" is "1"`. A book with zero pages is a typo.

**Fix**: fill in the missing title (looks like *Roadside
Picnic*) and correct `0` to a real page count (try `145`).

### Error types 3 + 4 — `unique-error` and `primary-key`

The last two errors both point at row 7:

- `unique-error` on field `id` — the value `2` already appeared
  in row 3.
- `primary-key` on the row — the primary key collides with row 3.

These are **two reports of the same underlying problem** (a
duplicate id), reported under both the field-level `unique`
constraint and the schema-level `primaryKey`. Fix the duplicate
once and both errors disappear.

**Fix**: change the duplicated `2` to `6` so *Dispossessed*
gets a unique id.

## Iterate to green

Open `books-messy.csv` in the editor (Files panel → click).
Make all five fixes:

| Row | Change |
|-----|--------|
| 3   | `yes` → `true` |
| 4   | (insert title) `Roadside Picnic` |
| 5   | `0` → `145` |
| 6   | `nineteen eighty four` → `1984` |
| 7   | `id=2` → `id=6` |

Save, then re-run:

```bash
frictionless validate books-messy.csv --schema schema.json
```

Status: **VALID**.

## Optional: emit JSON for tooling

The Rich-formatted report is for humans. For CI pipelines, ask
for JSON:

```bash
frictionless validate books-messy.csv --schema schema.json --json
```

Each error becomes an object with `type`, `cell`, `rowNumber`,
`fieldName`, `message`. Pipe it into any reporter you already
have.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- The error report is **specific**: every row has the offending
  cell, the field name, the constraint that fired, and a
  human-readable message. Rare to need to guess what
  Frictionless meant.
- The five fixes-then-validate loop is fast and rewarding —
  watch the table shrink one row at a time. This is the most
  pedagogically satisfying part of the curriculum so far.
- Error grouping is by *row*, then *field*. So if a single row
  has multiple problems, you see them clustered, which matches
  how a human would fix them.

### What surprised

- **Validate without a schema returns VALID even on garbage
  semantic data.** Came as a shock during authoring; this is
  the most important footgun in the whole tool. Made it a
  full section of the lesson rather than a footnote.
- The duplicate-id row produces *two* errors (unique-error +
  primary-key). One fix clears both — but a learner who reads
  the report literally might think there are seven distinct
  problems.
- The `boolean/default` type tag in the error message hints at
  there being non-default boolean variants (with custom truthy
  strings). Useful sign-posting; the docs back it up.

### What required workarounds

- For pedagogical purposes, the validation report's "row at
  position N" is one larger than the data row index a learner
  would count by eye. The lesson explicitly maps "row 3 in the
  report" to "the third data row" so this doesn't trip people up.

### Open questions

- The JSON report's `rowNumber` field — is that 1-based with
  header, or 0-based without? Spot-check before lesson 7
  (Inquiry) which builds on this.
- Are there error categories beyond `type-error`,
  `constraint-error`, `unique-error`, `primary-key` that this
  lesson should tease? (Source-error for a malformed CSV
  itself; format-error for unparseable file types. Probably
  worth mentioning.)
