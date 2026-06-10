# Publish with Livemark

Lesson 8 *consumed* a published package. This lesson goes the other way:
it *publishes* a human-readable document. **Livemark** is Frictionless's
static-site generator — it extends Markdown so a page can pull live data,
tables, and charts straight from your Frictionless resources at build time.

We'll build one HTML page that weaves together three things:

1. **Narrative** markdown prose,
2. an **equation**, and
3. two **live tables** read from CSV files in a *sister* folder.

## Livemark in this playground

Livemark is a separate tool, not a `frictionless` sub-command — so it gets
its own command here: **`livemark`**. A few things to know up front, all
recorded in [docs/limitations.md](https://github.com/DeepBlueCLtd/tabular-data-playground/blob/main/docs/limitations.md):

- The **first** `livemark` command installs Livemark into the Python runtime
  (a few seconds, one time per session). Later commands are instant.
- We use **`livemark build`** only. `livemark start` (its live-reload dev
  server) needs a real HTTP server, which a browser sandbox can't provide.
- Livemark builds the HTML *into your workspace*. Previewing the rendered
  page in-app isn't wired up yet (see Notes); you build and inspect it here.

## Set up

Click **Load lesson files** in the lesson header, then move into the folder:

```bash
cd 09-livemark
```

Look at how the files are laid out:

```bash
ls
```

```bash
ls data
```

There are two **sister folders**: `report/` holds the document, and `data/`
holds the CSVs. Have a look at the document source:

```bash
cat report/report.md
```

## The three ingredients

**1 — Narrative** is just ordinary Markdown headings and paragraphs.

**2 — A live table** is a fenced block tagged `yaml table`. Its body is a
Frictionless resource. The important key is `data:` (not `path:`), and the
path is resolved **relative to where you run `livemark build`**, not relative
to the Markdown file:

````text
```yaml table
data: ../data/measurements.csv
```
````

At build time Livemark opens that CSV with Frictionless and renders every row
as an interactive table — the data is never copy-pasted into the document.

**3 — An equation.** Livemark ships **no** math renderer, so `report.md`
injects [MathJax](https://www.mathjax.org/) with a small raw-HTML `<script>`
block (raw HTML passes straight through Livemark's Markdown). The equation
itself is plain LaTeX between `$$`:

```text
$$
SL = SL_0 + N \cdot \log_{10}\left(\frac{v}{v_0}\right)
$$
```

One sharp edge worth knowing: the Markdown parser runs **before** MathJax, and
it eats backslash-*punctuation* macros — `\,` and `\!` get stripped. Backslash-
*letter* macros (`\cdot`, `\frac`, `\log`, `\left`, `\right`) survive, so the
equation above is built only from those.

## Build it

This is the step that bites people: **build from the document's own folder**,
so the table's `../data/...` path resolves. Move in first:

```bash
cd report
```

Then build:

```bash
livemark build report.md
```

(The first run pauses while Livemark installs — that's expected.) When it
finishes, a new `report.html` sits next to `report.md`:

```bash
ls
```

Open **report.html** in the editor (click it in the file tree). Even though
it's HTML source, you can confirm the payload is all there:

- the `<script>` tags that load MathJax,
- your LaTeX equation, untouched, ready for MathJax to typeset,
- a `<table>` per `yaml table` block, with **every row** from
  `measurements.csv` and `vessels.csv` embedded inline.

To see it *rendered* — equation typeset, tables interactive — you'd open
`report.html` in a normal browser tab. Getting files out of the sandbox to do
that is a known gap (see Notes).

## Why it works

- **`data:` is a Frictionless source.** Anything `frictionless describe`
  accepts works here — a CSV path, a URL, even an inline descriptor. That's
  the whole point of Livemark: your *published* document and your *validated*
  data are the same artefacts.
- **Paths are build-cwd-relative.** `cd report` before building is what makes
  `../data/measurements.csv` point at the sister folder. Build from the wrong
  directory and you get `scheme "None" is not supported` or a file-not-found.
- **Raw HTML is a first-class escape hatch.** Unlike the lesson panel you're
  reading now (which strips raw HTML), Livemark passes it through — which is
  exactly why the MathJax `<script>` injection works.

## Notes & Observations

> Filled in while authoring this lesson against `livemark 0.110.8` /
> `frictionless 5.19.0` / `marko 1.3.1` on Pyodide 0.27.7.

### What worked

- **Livemark `build` runs in the browser at all** — the headline result. With
  the server stack (`livereload` → `tornado`, which has no wasm wheel) stubbed
  out and `marko` pinned to 1.x, `livemark build` produces real static HTML
  under Pyodide. The `table` plugin reads each CSV through Frictionless and
  embeds the rows via DataTables — exactly as on a desktop install.
- **The file/URL polymorphism carries over from Frictionless.** `data:` takes
  the same sources `frictionless describe` does, so the publishing layer and
  the validation layer share one mental model.
- **Raw-HTML passthrough** made MathJax trivial to add without any Livemark
  config — paste a `<script>`, done.

### What surprised

- **The table key is `data:`, not `path:`.** The intuitive `path:` silently
  yields `scheme "None" is not supported` (the resource gets an empty source).
  This cost a few minutes; flagged prominently above.
- **Table paths resolve against the build cwd, not the document.** Building
  from the workspace root made `../data/...` escape the lesson folder
  entirely. The fix — `cd` into the document's folder first — happily matches
  this curriculum's existing "`cd <lesson-folder>`" convention.
- **Markdown mangles LaTeX before MathJax sees it.** `\,` and `\!` (backslash-
  punctuation) get eaten by the Markdown escape rules; `\cdot`/`\frac` survive
  because backslash-letter isn't a Markdown escape. A genuinely confusing class
  of bug if you don't know to look for it.
- **A version collision hides under the hood.** `frictionless` wants
  `marko>=1.0` (and grabs 2.x); `livemark` wants `marko==1.*`. They only
  coexist if `marko 1.3.1` is installed *before* frictionless — micropip 0.9
  can't downgrade it afterwards. The runtime pins marko at startup to keep both
  happy.

### What required workarounds

- **No dev server.** `livemark start` is out — it needs `tornado`, which has no
  Pyodide wheel, and a socket server a browser can't host. `livemark build` is
  the supported path; the lesson is written around it.
- **Server stack stubbed, not installed.** Importing `livemark` pulls in its
  `.server` module (which imports `livereload`). We register dummy `tornado` /
  `livereload` modules so the import succeeds without ever installing them.

### Open questions

- **In-app preview.** We can *build* the static site but not *view* it
  rendered — there's no HTML preview pane and no file export (decision #21).
  A sandboxed `<iframe srcdoc>` preview, or a download affordance, would close
  the loop. Owned as future work, not v1.
- **Charts.** Livemark's `chart` plugin (Vega-Lite) wasn't exercised here.
  Whether its client-side assets behave the same way under this build is worth
  a follow-up if charts earn a place in the curriculum.
- **`git`-backed plugins.** `gitpython` imports cleanly without a `git` binary
  (we set `GIT_PYTHON_REFRESH=quiet`), but any plugin that actually shells out
  to `git` (e.g. `github`, `blog`) would fail at runtime. None are used here.
