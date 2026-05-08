# Phase 0 Research — Lesson Loader (#38)

## Decisions

### D1. Discovery: `import.meta.glob` over a hand-rolled build script

**Decision**: Use Vite's `import.meta.glob('/content/lessons/*/meta.json',
{ eager: true, import: 'default' })` to enumerate lessons at build time
and (in dev) pick up new folders on HMR. Pair it with
`import.meta.glob('/content/lessons/*/lesson.md', { eager: true,
query: '?raw', import: 'default' })` to inline the bodies as strings.

**Rationale**:
- Already part of Vite; no new build step, no extra config, no separate
  CLI to run.
- Eager glob produces a static map at build, so the lesson index has zero
  runtime cost beyond a `Map.get` per click.
- HMR works for free in dev; adding a folder triggers a re-glob.

**Alternatives considered**:
- *Custom Node script that writes `lessons.generated.ts`*: more moving
  parts, easy to forget to run. Rejected.
- *Runtime fetch of `meta.json` over HTTP*: forbidden by Principle IV
  ("permissible only for fetching pinned static assets"). Adds latency
  and an offline failure mode. Rejected.
- *MDX*: explicitly excluded by Constitution → Technology Constraints
  ("deliberately not MDX; lessons are static markdown").

### D2. Markdown stack: `react-markdown` 9.x + `remark-gfm` 4.x + `rehype-highlight` 7.x

**Decision**: Pin the three named libraries at their current major
versions. Use the default sanitiser behaviour (raw HTML stripped — see
spec FR-010).

**Rationale**:
- Named explicitly in the constitution and decision #9.
- `react-markdown` 9.x supports React 18; the 8.x line does not, so 9.x
  is the only viable major.
- `remark-gfm` covers tables, task lists, strikethrough, autolinks (spec
  FR-008).
- `rehype-highlight` does syntax highlighting at render time, which is
  acceptable for our 8 lessons; we explicitly register only the
  languages we use (next decision).

**Alternatives considered**:
- `rehype-pretty-code` / `shiki`: produces beautiful output but adds a
  much heavier WASM payload and runs at build time. Overkill for 8
  lessons; conflicts with the simplicity Principle.
- `marked` + custom React wrapper: would require re-implementing the
  `<code>` override hook needed for #39. Rejected.

### D3. Highlight languages: explicit allow-list

**Decision**: Register only the languages used in v1: `bash`, `json`,
`python`, `yaml`. `csv`, `text`, and any unknown tag are **not**
registered — they render as plain monospace via `rehype-highlight`'s
graceful fallback. Use `rehype-highlight`'s `languages` option pointing
at named `highlight.js/lib/languages/*` imports rather than the
autoloader.

**Allow-list discipline**: adding a language to the allow-list is a
deliberate change to this spec, not an ad-hoc PR — bumping it requires
updating spec FR-009 and this decision record together. The bundle-size
trade-off is the reason; we want the language list to stay short and
visible.

**Rationale**:
- The default `highlight.js` import auto-registers ~200 languages and
  bloats the bundle by ~600 KB minified. We need 4.
- An allow-list is also a deterministic surface — adding a new language
  is a deliberate code change.

**Alternatives considered**:
- Autoload everything: rejected on bundle-size grounds.
- Use `lowlight` directly: same engine; the `rehype-highlight` wrapper
  is fine and matches the constitution.

### D4. Validation: hand-rolled, no Zod

**Decision**: Validate `meta.json` with a small hand-rolled validator
function (~30 lines) that throws on the failure modes listed in
spec FR-005. Do **not** add Zod or any schema lib.

**Rationale**:
- Five fields, validated at build time; throwing on bad input is enough.
- Adding Zod is an undeclared dependency that the constitution says to
  avoid for this scope ("Redux is overkill at this scope" precedent).
- A JSON-Schema for `meta.json` lives under `contracts/` for human
  reference and editor support, but is not used at runtime.

**Alternatives considered**:
- *Zod*: clean, but a new dep needing pinning + lockfile churn for five
  fields. Rejected.
- *Ajv against the JSON Schema*: same.

### D5. Build-fail behaviour

**Decision**: Bad `meta.json` causes `pnpm build` to fail because the
loader throws during module evaluation, and the failure surfaces in
Vite's build pipeline. Throw with the offending file path in the message.

**Rationale**:
- Catches bad lessons before deploy. Aligns with FR-005 / SC-003.
- No "ignore and continue" path — the curriculum is small enough that a
  broken lesson is always wrong.

**Alternatives considered**:
- Return `null` for invalid lessons and log a console warning: silent
  drop violates the spirit of FR-005.

### D6. Structural hook for #39 (Copy/Run buttons)

**Decision**: Expose a `LessonCodeBlock` component used as
`react-markdown`'s `code` renderer. It accepts a
`renderActions?: (lang: string, source: string) => ReactNode` prop. In
this PR (#38) the prop is unused; #39 wires in a real implementation.

**Rationale**:
- Keeps #38 self-contained while leaving #39 a clean integration point.
- Avoids "code-block also gets a Run button" creep into this item.

**Alternatives considered**:
- A global Zustand slice that #39 subscribes to: heavier than needed
  for a render-time prop.

### D7. Sample lesson for development

**Decision**: Ship one tiny `_sample` lesson under
`content/lessons/_sample/` so the panel renders something during E2 work
**before** any real lesson lands. Filter `_*` slugs out of production
builds via a check in `load.ts`.

**Rationale**:
- Smoke tests need at least one lesson to render; we don't want to gate
  this PR on simultaneously authoring lesson #1.
- The `_` prefix is a convention; underscored slugs are excluded from
  the index in prod (`import.meta.env.PROD`).

**Alternatives considered**:
- Mock-only fixture under `app/src/lessons/__tests__/`: works for unit
  tests but doesn't drive the side-panel integration test. The
  underscore-prefix convention is cheap and useful.

## Open questions resolved at planning time

- **Where do lesson images live?** In the lesson folder. `import.meta.glob`
  with `{ as: 'url' }` could resolve them, but for v1 we punt: lesson
  authors write images as `data:` URIs in markdown, or use absolute
  Pages-base paths. Revisit if any lesson needs more than one image.
  *(Documented as a known limitation in the spec's Edge Cases — bad alt
  text falls back gracefully.)*
- **Caching the rendered AST?** Not needed at v1 scope. 8 lessons,
  re-render on click is fast.
