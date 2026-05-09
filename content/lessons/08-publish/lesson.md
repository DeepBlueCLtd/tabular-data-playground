# Publish & consume

A Data Package is, fundamentally, a `datapackage.json` file plus
its CSVs sitting at relative paths. Publishing it means putting
those files somewhere a `frictionless` client can `GET` them.
Consuming it means pointing `frictionless describe` (or
`validate`) at the URL.

This lesson does both.

## A Frictionless package, served from this site

Lesson 4 walked you through *building* a Data Package locally.
We've put a copy of that package on the same Pages site that
hosts this IDE — under `/sample-package/`. So the package is
reachable at:

```
https://deepbluecltd.github.io/tabular-data-playground/sample-package/datapackage.json
```

(That link comes alive once this branch is deployed; in dev /
preview it's served from `http://localhost:5173/sample-package/`.)

This lesson doesn't ship its own starter files because the
whole point is to read from the published URL.

## Consume a remote package

In the terminal:

```bash
frictionless describe https://deepbluecltd.github.io/tabular-data-playground/sample-package/datapackage.json
```

You should see two resources — `authors` and `books` — with
their inferred fields. Frictionless fetched the
`datapackage.json`, then followed the relative `path` entries
(`authors.csv`, `books.csv`) on the same host to read each
resource's data. No local files involved.

Now validate it:

```bash
frictionless validate https://deepbluecltd.github.io/tabular-data-playground/sample-package/datapackage.json
```

Both resources should report **VALID** — the schemas hold,
the foreign key (`books.author_id` → `authors.id`) resolves,
the row count is what it should be.

## Now try a real public package

The Pages-hosted example proves the mechanics. To prove
Frictionless works against a real, third-party-hosted package,
try one published at [datasets/world-cities](https://github.com/datasets/world-cities)
on GitHub:

```bash
frictionless describe https://raw.githubusercontent.com/datasets/world-cities/main/datapackage.json
```

```bash
frictionless validate https://raw.githubusercontent.com/datasets/world-cities/main/datapackage.json
```

This package has one resource — `world-cities` — and validates
against its hand-authored schema. Same command, third-party URL.

## Why this works

Three things matter:

1. **Relative paths in the package.** The
   `datapackage.json` lists `"path": "authors.csv"`, not
   `"path": "/abs/path/authors.csv"`. Frictionless resolves
   each path **relative to the package URL**, so moving the
   whole folder doesn't break it.
2. **Plain HTTP.** No special protocol; static hosting works.
   GitHub Pages, S3 + a static front-end, a hand-rolled
   nginx — anything that serves files works.
3. **CORS-permissive hosts.** Both Pages and
   raw.githubusercontent.com send `Access-Control-Allow-Origin:
   *`. A host that doesn't would block the fetch in a
   browser context. (When run server-side via Python, CORS
   doesn't apply.)

## The minimum a published package needs

If you ever publish your own:

- `datapackage.json` at the root.
- Every `path` in the package resolves to a sibling/below-it file.
- Top-level `name`, `title`, `description`, `licenses`,
  `homepage`, `version`. Discovery tools (and human readers)
  look for these.
- A `README.md` next to `datapackage.json`. Not required by
  the spec, expected by everyone.

## Notes & Observations

> Filled in while authoring this lesson against
> `frictionless 5.19.0`.

### What worked

- Pointing `describe` at a remote URL "just works" — same
  command shape, same output, no flag dance. This is the
  big quiet-good of Frictionless: the file/URL polymorphism
  is invisible.
- `validate` against a remote package fetches each CSV in
  turn and runs the same checks as the local form. Foreign
  keys resolve across CSVs hosted at the same URL prefix.
- The world-cities package on GitHub validated cleanly first
  try. Real-world packages, hand-authored by other people,
  do hold up.

### What surprised

- The author initially tried
  `https://raw.githubusercontent.com/datasets/country-codes/master/datapackage.json`
  (a frequently-cited example) and got a 404. The repo's
  default branch is `main`, not `master`. **Documenting
  this**: example URLs in Frictionless tutorials around the
  internet are surprisingly often dead. The `datasets/world-cities`
  one used here was verified live during authoring; if it
  goes away, swap to another `datasets/*` package on GitHub.
- Frictionless emits a `--trusted` flag in CLI help (security
  posture). For the `datasets/*` packages on GitHub,
  `describe` and `validate` work **without** `--trusted`
  in v5.19. The flag is needed for some forms of
  remote-resource fetch (looks like it gates `script` /
  `transform` paths that load Python). Worth flagging if a
  learner sees the flag in help and wonders.

### What required workarounds

- Self-hosted package URL is brittle: it changes if the
  GitHub Pages URL changes (account rename, repo rename).
  The lesson's primary URL is paired with the live URL of
  the deployed Pages site. If we move hosts, this lesson
  needs an edit. (Documented in `docs/limitations.md` for
  v1.0 freeze.)

### Open questions

- Can `frictionless` handle a package whose CSVs live on a
  different host than `datapackage.json` itself? (Likely
  yes — `path` accepts a full URL, not just a relative one.
  Worth confirming for v1.1.)
- The `script` and `query` sub-commands in v5.19 hint at
  richer remote workflows. Out of scope for this curriculum
  but worth a callout once the eight lessons are settled.
