# Plan: Version pinning (#55)

## Summary
Make the Frictionless install pin real (currently
`micropip.install("frictionless")` — unpinned), replace the three
placeholder JSON Schemas with canonical snapshots, and add a
"Pinned versions" section to the README documenting all three.
The Pyodide pin is already real (`PYODIDE_VERSION = '0.27.7'`
in `app/src/pyodide/config.ts`).

## Constitution Check
| Gate | Status |
|------|--------|
| Research-first | PASS — directly serves §13 freeze and §11 Phase 3. |
| Notes-section | N/A — no new lessons. |
| Destruction | PASS — no destructive flow added. |
| Backend | PASS — no servers/accounts/telemetry. |
| Pinning | PASS — this is exactly the Pinning principle being honoured. |
| Limitations | PASS — `docs/limitations.md` "Bundled JSON Schemas are placeholders" entry retires/updates in the same change. |

## Source-code shape
```
app/src/pyodide/worker.ts                    # use FRICTIONLESS_VERSION
app/src/editor/schemas/data-package.json      # real snapshot
app/src/editor/schemas/table-schema.json      # real snapshot
app/src/editor/schemas/table-dialect.json     # real snapshot
README.md                                      # contributes "Pinned versions" section (#55 part)
docs/limitations.md                            # retire placeholder note
```

## Approach
1. Wire `FRICTIONLESS_VERSION` from `config.ts` into the worker's
   `micropip.install` call. Use a templated string with the
   version constant.
2. Snapshot canonical JSON Schemas:
   - `data-package.json` ←
     `https://specs.frictionlessdata.io/schemas/data-package.json`
   - `table-schema.json` ←
     `https://specs.frictionlessdata.io/schemas/table-schema.json`
   - `table-dialect.json` ←
     `https://datapackage.org/profiles/2.0/tabledialect.json`
     (Frictionless's `specs.frictionlessdata.io/schemas/table-
     dialect.json` returns 404 — only canonical home is
     datapackage.org for v2.)
   Update the `liveUrl` for the dialect slot in
   `json-schemas.ts` to match its canonical home.
3. Add a small "Pinned versions" stub at the top of README.md;
   #54 will fill in the surrounding framing/findings.
4. Retire the "Bundled JSON Schemas are placeholders" entry in
   `docs/limitations.md` and replace with a "Bundled JSON Schemas
   are pinned snapshots" note that records the source URLs.
