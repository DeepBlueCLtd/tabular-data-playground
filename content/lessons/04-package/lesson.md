# Build a Data Package

A **Data Package** is the central concept in the Frictionless
ecosystem. It bundles multiple tabular resources (CSVs) plus
their schemas, metadata, and relationships into a single
self-describing JSON file: `datapackage.json`.

This lesson takes two related CSVs (books + authors), describes
them, then hand-authors a `datapackage.json` with a foreign-key
relationship between them, and validates the whole thing.

## Set up

Click **Load lesson files**. Three files arrive:

- `books.csv`
- `authors.csv`
- `datapackage-starter.json` — a hand-authored package you'll
  use after a brief detour through inference.

```bash
cd 04-package
ls
```

## Auto-describe a folder

Frictionless can infer a package from a folder of CSVs:

```bash
frictionless describe . --json
```

You get a JSON object with a `resources` array. Each entry has
an inferred name (from the filename), path, format, mediatype,
encoding, and schema. This is a **package** — `frictionless
describe` is generous: pointed at one file it returns a
resource, pointed at a folder it returns a package.

For a real project this is a useful starter, but it's missing
a lot of what makes a package valuable: title, description,
license, and — critically — relationships between resources.

## Read the hand-authored `datapackage.json`

```bash
cat datapackage-starter.json
```

What it adds beyond inference:

- Top-level metadata: `name`, `title`, `description`, `licenses`.
- Tighter schemas (the same constraints we built in lesson 2).
- A **foreign key**: `books.author_id` → `authors.id`. This
  declares the relational link, and Frictionless uses it during
  validation.

Save it as the canonical `datapackage.json`:

```bash
cp datapackage-starter.json datapackage.json
```

## Validate the package

```bash
frictionless validate datapackage.json
```

The Dataset table now lists **two** resources, each with a
status. Both VALID — the schemas match, the foreign keys
resolve.

## Break the foreign key, see the report

Open `books.csv` in the editor (Files panel) and find the
*Solaris* row (editor line 3 — the second data row). Change its
`author_id` from `2` to `99` (an id that doesn't exist in
`authors.csv`). Save and re-run:

```bash
frictionless validate datapackage.json
```

```
status: INVALID
foreign-key: Row at position "3" violates the foreign key:
for "author_id": values "99" not found in the lookup table
"authors" as "id"
```

This is the payoff. A foreign-key relationship is declared
once, in metadata, and Frictionless audits it across files
without you writing a join. Restore `2` to fix it.

## Look at the package as a whole

```bash
frictionless describe datapackage.json --stats
```

You see resource-level stats (rows, bytes, hash) for each CSV
in the package. Useful when handing off a package: the
recipient can verify they got the bytes you sent.

## Why "Package before Dialect"?

This curriculum puts Data Package (lesson 4) before Dialect
(lesson 5) deliberately. Data Package is the **named central
concept** — if a learner runs out of time they've still met
the idea that ties everything together. Dialect is plumbing
for awkward CSV variants; useful, but secondary.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- Auto-describing a folder produces a credible starter package
  with no extra arguments — surprised this worked the first try
  on the inferred name "library" being absent (Frictionless
  emits the resources list without a top-level `name`).
  Authoring then becomes "fill in the missing metadata", which
  is a friendly on-ramp.
- The foreign-key check is the most pleasing pedagogical moment
  in the curriculum so far: declare a relationship in JSON,
  break the data, get a precise report. Felt like real-world
  database integrity, just without the database.
- Stats at the package level (`describe --stats`) give you
  per-resource bytes/rows/hash, which is exactly what you'd
  hand to someone alongside the package itself.

### What surprised

- The auto-described package has paths relative to the **invocation
  cwd**, not the folder you described. Running `frictionless
  describe ./files` from one level up produces paths like
  `files/books.csv` baked into the JSON. That works but is
  fragile if the package is later moved. Hand-authoring a
  `datapackage.json` and keeping `path` values relative to the
  package file (the conventional approach) is more robust.
- The foreign-key error report includes the **lookup table
  name and the unresolvable value**, which is more specific
  than typical relational-database "FK violation" messages.
  Something the rest of the data ecosystem could learn from.
- Frictionless emits a `licenses` array (plural). Worth noting:
  even single-license packages should use `licenses`, not
  `license`. The Data Package spec is explicit about this and
  Frictionless follows it.

### What required workarounds

- Foreign keys' `fields` accepts a string or an array of
  strings (composite keys). The single-string form, used here,
  felt natural; learners doing composite keys later may need
  to read the spec section to remember the array form.

### Open questions

- Does Frictionless validate that resource names are unique
  within a package? (Almost certainly yes; spec demands it.)
  Could be a fun "deliberately break this" exercise in a
  follow-up.
- The package supports `contributors`, `keywords`,
  `homepage`, `version`, etc. None used here. Lesson kept lean;
  worth a callout in lesson 8 (Publish & consume) where these
  fields actually matter for discovery.
