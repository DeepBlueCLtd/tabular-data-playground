# Write a Schema by hand

Lesson 1 had Frictionless infer a schema from a CSV. That's
useful as a starting point, but a schema you hand-author is
**stronger contract**: you can demand a column be present, a
value be unique, a number have a minimum, a date follow a
calendar.

This lesson takes the inferred schema, tightens it, and uses
the result to validate the same CSV under stricter rules.

## Set up

Click **Load lesson files**. Two files arrive:

- `books.csv` — the same data as lesson 1.
- `schema-starter.json` — the inferred schema, your starting
  point.

```bash
cd 02-schema
ls
cat schema-starter.json
```

The starter is just types — `integer`, `string`, `boolean`. No
constraints, no primary key. Useful but loose.

## Open `schema-starter.json` in the editor

Use the file tree (Files panel) to open `schema-starter.json`.
Monaco recognises filenames matching `schema.json` /
`*.schema.json` and offers JSON Schema validation as you type
(see the IDE's status bar — "Schema: Table Schema").

> Tip: you can rename the file to `schema.json` first if you'd
> like the editor's hint to surface immediately.

## Tighten the types

Frictionless's
[Table Schema](https://specs.frictionlessdata.io/table-schema/)
lets a field carry:

- a more specific **type** than the inferred default,
- **constraints** (`required`, `unique`, `minimum`, `pattern`, etc.),
- a **format**, **rdfType**, **description**, and others.

Three changes worth making to the starter:

1. **`published_year` → `year`.** The default inference picked
   `integer`. The dedicated `year` type checks the value
   against a calendar — `9999` would still pass `integer` but
   fails `year`'s upper bound.
2. **`id` → unique + required.** Books have ids; ids do not
   repeat. Encode that.
3. **`pages` → minimum: 1.** A book with zero pages is a
   data-entry mistake.

Edit the file to look like this and save:

```json
{
  "fields": [
    { "name": "id", "type": "integer", "constraints": { "required": true, "unique": true } },
    { "name": "title", "type": "string", "constraints": { "required": true } },
    { "name": "author", "type": "string", "constraints": { "required": true } },
    { "name": "published_year", "type": "year" },
    { "name": "pages", "type": "integer", "constraints": { "minimum": 1 } },
    { "name": "in_print", "type": "boolean", "constraints": { "required": true } }
  ],
  "primaryKey": "id"
}
```

A `primaryKey` at the schema level is shorthand for "this field
is required + unique"; we've kept the field-level constraints
explicit for readability — the two are not redundant in
Frictionless's model (more on this below).

## Validate against the schema

```bash
frictionless validate books.csv --schema schema-starter.json
```

A green table:

```
status: VALID
```

The CSV satisfies every rule. Lesson 3 walks through what to do
when it doesn't.

## A first taste of error reporting

To see what the report looks like for a non-conforming file,
edit `books.csv` (use the editor) and break a row — for
example, set row 3's `pages` to `0`. Re-run validate:

```bash
frictionless validate books.csv --schema schema-starter.json
```

Now a `constraint-error` row appears, naming the offending row,
field, and the constraint that fired. Lesson 3 takes this
further.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- The fluent edit-then-validate loop is genuinely satisfying:
  you change one field in `schema-starter.json`, re-run
  `validate`, and the report immediately reflects the new rule.
  The feedback is fast enough to encourage experimentation.
- Constraints are well named — `required`, `unique`,
  `minimum` — and the report repeats the constraint name in
  the error message ("constraint 'required' is 'True'"), so
  the link from rule to report is unambiguous.
- The `year` type does what you'd expect: rejects
  out-of-range integers, accepts four-digit years.

### What surprised

- **`primaryKey` and field-level `unique` are not the same.**
  A `primaryKey` enforces row identity (and emits a
  `primary-key` error code on violation); field-level
  `constraints.unique` enforces uniqueness within that column
  (and emits `unique-error`). On a duplicate id you get
  **both** errors in the report, not one. Useful to know
  before assuming the report has noise.
- **Row numbering counts from the header row.** A constraint
  error on the third row of data is reported at "row at
  position 4". Worth flagging the first time a learner
  reads a report.
- The Monaco JSON Schema hint is keyed on the filename. Renaming
  `schema-starter.json` → `schema.json` flips the inline hint
  on; keeping the original name leaves you without it. (Decision
  #16 documents this convention.)

### What required workarounds

- None. Schema-authoring is one of the cleanest surfaces in
  Frictionless: the spec is small, the JSON is hand-readable,
  and the validate loop is fast.

### Open questions

- Frictionless supports a `format` field on string types
  (`email`, `uri`, `uuid`). Do those formats have validation
  semantics, or are they advisory metadata? (Try in lesson 3.)
- The `enum` constraint exists in the spec. How does the
  report look when an `in_print` value is added that isn't
  literally `true` / `false`? Worth a follow-up.
