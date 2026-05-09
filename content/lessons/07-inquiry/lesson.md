# Inquiry — validate many resources at once

A Frictionless **Inquiry** bundles several validation tasks
into one descriptor and runs them together. It's the right
shape for CI: one file says "here is everything to check"
and `frictionless validate` returns a single combined report.

> Conceptually thin once you've done lesson 3 (Validate). Keep
> this short.

## Set up

Click **Load lesson files**. Three files arrive:

- `books.csv`
- `authors.csv`
- `inquiry.json` — the inquiry that validates both.

```bash
cd 07-inquiry
cat inquiry.json
```

The inquiry contains two tasks. Each task names a `path` and
embeds a schema. Running the inquiry validates both files
in one shot.

## Run it

```bash
frictionless validate inquiry.json
```

The Dataset table shows two rows — `books` and `authors`,
each with its own status. Both VALID.

## Why use an Inquiry rather than a Data Package?

Both can validate multiple resources. The differences:

- A **Data Package** describes a *cohesive dataset* — name,
  license, foreign keys between resources, the works. The
  package itself is the deliverable.
- An **Inquiry** is a *checklist* — "validate these N things
  for me, possibly unrelated, possibly with very different
  schemas". The inquiry isn't typically published; it's the
  CI script.

If your CI needs to validate the same package after every
push, point `validate` at `datapackage.json`. If your CI
needs to validate a heterogeneous collection (a regulatory
submission, say, where the files come from different teams),
an inquiry is the right shape.

## Break a task and watch the report

Edit `books.csv` (Files panel) to introduce a duplicate id —
say change row 6's `id` to `1`. Re-run:

```bash
frictionless validate inquiry.json
```

Only `books` flips to INVALID; `authors` stays VALID. The
inquiry runs each task **independently**: a failure in one
doesn't abort the others. This is exactly what you want from
a CI step.

Restore `id` to `5` to recover.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- Independent task execution: a failure in one task doesn't
  blow up the others, which matches "give me a complete
  report" expectations from CI tooling. Pleasing.
- The same `frictionless validate` command takes a CSV, a
  data package, or an inquiry — the dispatch on `tasks` /
  `resources` / file extension is invisible to the user.
  Boring-good behaviour.
- Inquiry tasks accept all the resource-shaped fields
  (`path`, `schema`, `dialect`, `format`, `encoding`, etc.),
  so anything you can describe in a resource you can
  validate as a task.

### What surprised

- **Schema referenced by file path doesn't work in v5.19.**
  `{"path": "books.csv", "schema": "schema.json"}` raises
  `'str' object has no attribute 'to_descriptor_source'`.
  Embedding the schema inline (as this lesson does) works.
  The resource form (lesson 4) accepts file references
  fine. Inconsistent across resource and inquiry contexts —
  worth flagging.
- **`primaryKey` MUST be an array inside an embedded
  inquiry schema.** Top-level package schemas accept
  `"primaryKey": "id"` as a string; inquiry-embedded
  schemas reject it as `'id' is not of type 'array'`.
  The Frictionless spec actually defines both forms, but
  the inquiry path uses a stricter validator. Real
  authoring foot-stub.
- The `type: "table"` field that appears in resource
  descriptors is **not** valid on an inquiry task: you'll
  get `unsupported type for "inquiry-task": table`. Just
  omit `type` in inquiry tasks.

### What required workarounds

- The two inconsistencies above produced the workarounds:
  embed schemas inline, use array form for `primaryKey`. A
  learner copying a schema from lesson 2 verbatim into an
  inquiry will hit both. The lesson's example uses the
  forms that work in v5.19.

### Open questions

- Does `frictionless validate inquiry.json --parallel` run
  tasks concurrently? The Python API has a `parallel=True`
  option (per `Inquiry.validate`). Worth confirming the CLI
  surface and timing it on a larger inquiry.
- Are there inquiry-task fields beyond resource fields —
  e.g., a `checklist` for custom checks? Spotted in the
  Python `InquiryTask.__init__` signature; not used in
  this lesson but might warrant a v1.1 follow-up if real
  data needs custom checks.
