# Dialect & encoding quirks

Real CSVs aren't always comma-separated UTF-8. They arrive
semicolon-delimited from European spreadsheets, tab-separated
from old data warehouses, byte-order-marked from Excel,
ISO-8859-1 from a 2003 ERP. Frictionless's **Table Dialect**
spec is how you describe these variants so the rest of the
toolchain can read them.

This lesson opens a sketchy CSV from a hypothetical vendor and
uses dialect + schema overrides to make it readable.

## Set up

Click **Load lesson files**. Three files arrive:

- `vendor.csv` — semicolon-delimited; prices in European decimal-
  comma form (`9,50` for €9.50).
- `vendor-bom.csv` — comma-delimited but with a UTF-8 BOM at the
  start. (Excel does this when "Save as CSV UTF-8".)
- `vendor.tsv` — tab-delimited.

```bash
cd 05-dialect
ls
cat vendor.csv
```

Notice: the column separator is `;`, not `,`. Notice the
prices: `9,50`, not `9.50`. Both are perfectly normal in
European spreadsheet exports.

## Auto-inference: what could go wrong?

```bash
frictionless describe vendor.csv
```

Three columns came through correctly — Frictionless detected
the semicolon delimiter automatically. But look at the inferred
type for `price_eur`:

| id      | product | price_eur |
|---------|---------|-----------|
| integer | string  | **geopoint** |

Pause on that. The price column was inferred as a **geographic
point** because `9,50` looks like a coordinate pair (latitude,
longitude). This is the kind of footgun Lesson 5 of the
spec calls "fiddly": a perfectly reasonable file, a
perfectly reasonable inference rule, and a wrong answer.

## Override the type with an explicit schema

The fix is a schema. Open `vendor-schema.json`:

```bash
cat vendor-schema.json
```

```json
{
  "fields": [
    { "name": "id", "type": "integer" },
    { "name": "product", "type": "string" },
    { "name": "price_eur", "type": "number", "decimalChar": "," }
  ]
}
```

Two important pieces:

- `"type": "number"` overrides the geopoint mis-inference.
- `"decimalChar": ","` tells Frictionless to read the European
  comma as a decimal separator (the default is `.`).

Validate against it:

```bash
frictionless validate vendor.csv --schema vendor-schema.json
```

Status: **VALID**. The price column now parses as actual
numbers — try `frictionless extract vendor.csv --schema
vendor-schema.json` to see the values come out as `9.5`,
`7.25`, etc.

## BOM files — handled transparently

Some Excel exports prepend a UTF-8 byte-order-mark (`EF BB BF`)
to the file. Older parsers see a phantom column-zero name like
`"﻿id"` and break.

```bash
frictionless describe vendor-bom.csv --json | head -20
```

Look at the `encoding` field: `"utf-8-sig"`. Frictionless
detected the BOM, stripped it, and recorded the
"BOM-stripped UTF-8" encoding. Nothing else needed. This is
the kind of quietly-correct behaviour that pays back many
times over the course of a project.

## TSV — also handled

```bash
frictionless describe vendor.tsv
```

Frictionless reads the `.tsv` extension, sets the dialect to
tab-delimited, and infers types. No flags. This is one of the
boring-good outcomes — the tool does the obvious thing.

## When auto-inference doesn't have enough signal

If your file doesn't have a friendly extension or a clean
delimiter, you can pass a dialect explicitly. Create a tiny
`dialect.json`:

```bash
echo '{ "delimiter": ";" }' > dialect.json
frictionless describe vendor.csv --dialect dialect.json
```

The dialect file is the canonical place for this kind of
override. Drop it into a `datapackage.json` resource entry as
`"dialect": { ... }` and it travels with the data.

## Author's takeaway: front-load the real-world example

The Frictionless docs introduce dialect via abstract spec
language. In practice, the way you encounter dialect is by
**a vendor sending you a CSV that doesn't open right**. This
lesson deliberately leads with that frame. If you only
remember one thing: "if a column type looks weird (geopoint!?
duration!?), the dialect or the decimal-char is probably
upstream of the problem."

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- BOM handling is **invisible and correct**. The encoding
  reports as `utf-8-sig`; the columns parse normally; no
  warnings. This is the gold standard for a CSV reader and
  Frictionless meets it.
- Semicolon delimiter detection works without a hint. Tab
  delimiter via filename extension also works. The two most
  common European/legacy variants are auto-handled.
- The `decimalChar` field-level override is exactly the right
  knob for European prices. Documented; obvious once seen.

### What surprised

- **`9,50` infers as `geopoint`.** This was the lesson's gift —
  a mistake that's not obviously a mistake until you read the
  inferred type and stop. It also shows that type inference
  has *priors* about what a number looks like, and those
  priors are culturally specific.
- The `--dialect dialect.json` flag accepts a JSON file but
  the *first* `describe` (without `--dialect`) already auto-
  detected the semicolon. So the explicit `--dialect` flag
  feels redundant on this file — and is, for delimiters
  Frictionless can sniff. It earns its keep on files where
  sniffing fails (custom quote characters, custom escape
  characters, multi-line headers).
- `frictionless extract` is the command that actually emits
  parsed values, distinct from `describe` (metadata) and
  `validate` (status). Worth threading through the lesson
  even though we use it only briefly.

### What required workarounds

- The author considered making the lesson use a non-UTF-8
  encoded file (latin-1 / cp1252). Pyodide's `micropip`
  install of `frictionless` does include the standard codecs,
  so this would work in the deployed app — but the dialect
  story is already concrete enough with the three files
  shipped. Adding a CP-1252 file would lengthen the lesson
  without adding pedagogical clarity. Recorded for a possible
  v1.1 expansion.

### Open questions

- Are there variants Frictionless will *refuse* to auto-detect?
  The spec hints at this with `multiline` and quoted-string
  edge cases. A "bring your own broken CSV" follow-up exercise
  could surface them.
- The `header_rows` option can multi-row headers (e.g. group
  + sub-group columns). Useful in real data but easy to drown
  the lesson in. Punted to v1.1.
