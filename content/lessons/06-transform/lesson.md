# Transform

> **Pinned to `frictionless 5.19.0`.** This lesson is the most
> version-fragile in the curriculum: Frictionless's transform
> surface has changed materially across major versions, and
> the v5 **CLI does not expose `transform`**. We use the Python
> API directly, which is the most stable form.

This lesson runs a small ETL pipeline: read the books CSV, drop
the `in_print` column, keep only modern books (1970+), and add
a derived `century` column. Output goes to a new CSV.

## Set up

Click **Load lesson files**. Three files arrive:

- `books.csv` — the input.
- `pipeline.json` — the transform pipeline as Frictionless data.
- `run-pipeline.py` — a tiny Python script that runs it.

```bash
cd 06-transform
ls
cat pipeline.json
```

The pipeline is three steps:

1. `field-remove` — drop the `in_print` column.
2. `row-filter` — keep only rows where `published_year >= 1970`.
3. `field-add` — append a `century` column with the value `20`.

## Run it

```bash
python run-pipeline.py
ls
cat books-modern.csv
```

You should see three rows (lesson 2's *Roadside Picnic*,
*Annihilation*, *Stars in My Pocket Like Grains of Sand*),
each with a new `century` column at the end. The `in_print`
column is gone.

## Inspect the script

```bash
cat run-pipeline.py
```

```python
from frictionless import Pipeline, transform

pipeline = Pipeline.from_descriptor("pipeline.json")
result = transform("books.csv", pipeline=pipeline)
result.write("books-modern.csv")
```

Three lines of substantive code:

1. Load the pipeline from JSON.
2. Apply it to the source.
3. Write the result.

The pipeline-as-JSON form is what makes this approach
**portable**: the same descriptor would run under any
Frictionless v5 host with the same step names.

## Why the formula uses `int(published_year)`?

Open `pipeline.json` and look at the row-filter step:

```json
{ "type": "row-filter", "formula": "int(published_year) >= 1970" }
```

In v5.19's row-filter, the formula evaluates against **raw
string** values — not yet coerced to the schema's types. A
naïve `published_year >= 1970` raises `TypeError: '>=' not
supported between instances of 'str' and 'int'`. Hence the
explicit `int(...)` cast.

If your input has already been described with a schema and
you'd rather keep the formula type-safe at the python level,
you can build the pipeline programmatically with `steps.row_filter`
and pass `function=lambda row: int(row["published_year"]) >= 1970`
— but the JSON form is more portable, and a one-character cast
in the formula is a small price to pay.

## Steps available in v5.19

A few you'll reach for:

- `field-add`, `field-remove`, `field-update`, `field-move`,
  `field-filter`
- `row-filter`, `row-search`, `row-sort`, `row-slice`
- `cell-replace`, `cell-format`, `cell-set`, `cell-fill`
- `resource-add`, `resource-remove`, `resource-update`

The full list is `python -c "from frictionless import steps;
print([s for s in dir(steps) if not s.startswith('_')])"`.

## A second pipeline: rename the output

Edit `pipeline.json` to add a step that renames the `pages`
column to `page_count`:

```json
{
  "steps": [
    { "type": "field-remove", "names": ["in_print"] },
    { "type": "row-filter", "formula": "int(published_year) >= 1970" },
    { "type": "field-add", "name": "century", "value": 20, "descriptor": { "type": "integer" } },
    { "type": "field-update", "name": "pages", "descriptor": { "name": "page_count" } }
  ]
}
```

Re-run:

```bash
python run-pipeline.py
cat books-modern.csv
```

The header now reads `..., page_count, century`.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0` on Python 3.11.15.

### What worked

- Pipeline-as-JSON is the right authoring shape: it's
  declarative, hand-readable, and travels with the data
  package. No imperative code needed for typical ETL.
- The Python entry-points are well-named: `transform()` for
  one-shot, `Pipeline.from_descriptor()` for loading.
  `result.write()` writes the parsed/transformed table back to
  CSV with a sensible default dialect.
- The step vocabulary is rich enough for everyday ETL —
  field/row/cell/resource families with consistent prefixes.

### What surprised

- **No CLI `transform` command in v5.19.** The most-mentioned
  Frictionless verb is also the only one without a CLI — you
  have to drop into Python. The lesson now leads with this fact
  rather than burying it. Anyone scanning the `frictionless
  --help` output will not find a transform; this needs to be
  the first thing the lesson tells them.
- **`row-filter` formulas operate on raw strings.** A formula
  like `published_year >= 1970` raises a TypeError because
  `published_year` is `str` at filter time, not the schema's
  `integer`. Need `int(published_year) >= 1970`. Easy to fix,
  easy to miss; the error message is helpful when it happens.
- **`field-remove` takes `names` (plural list), not `name`.**
  Other steps take `name` (singular). Inconsistent across
  steps and a real foot-stub when authoring pipelines fast.
  Worth a callout.
- **`field-update` with `descriptor.name` renames a column.**
  Took a beat to find — there's no `field-rename` step. Once
  spotted, the pattern is general (descriptor-overrides for any
  field property), but it isn't obvious from step-name alone.

### What required workarounds

- The `python` invocation in the embedded shell needs the
  Frictionless package installed via Pyodide's `micropip` —
  which it is, by Phase 0 design. No extra step in this
  lesson, but worth mentioning if a learner runs commands in
  an order that hasn't reached the Pyodide-ready state.

### Open questions

- Will `row-filter`'s string-coercion behaviour be considered a
  bug or a feature in v6? Worth a Frictionless GitHub-issue
  search before tagging v1.0 of this artefact.
- Does `result.schema` reflect the post-transform schema (with
  `in_print` removed and `century` added)? Spot-check before
  using transform output as input to a downstream package.

### Version-fragility note (Principle VI)

If `frictionless` is upgraded past 5.x, this lesson is the
**most likely** to break — the API has churned across major
versions historically. The README and the package's pinned
requirements lock 5.19.0; **don't bump without re-walking this
lesson**.
