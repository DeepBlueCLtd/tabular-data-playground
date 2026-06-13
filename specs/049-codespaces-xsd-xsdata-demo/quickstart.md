# Quickstart: the one-click sonar XSData demo

The colleague-facing walkthrough. Goal: from "open in a Codespace" to a running,
type-safe demonstration in under 10 minutes, with no manual install (SC-001).

## 1. Open in a Codespace

- On the repository's branch, click **Code → Codespaces → Create codespace**.
- Wait for the container to build. The dev container installs the pinned demo
  dependencies automatically via its `postCreateCommand` — you do **not** run
  any install step yourself.
- When the terminal is ready, you're set.

## 2. Generate the Python types from the XSD

```bash
cd experiments/sonar-xsdata
make generate
```

This runs `xsdata` over `schema/sonar_performance.xsd` and writes typed
dataclasses + Enums into `generated/sonar_performance/`.

**Look at what travelled through:** open a generated file and note that the
`xs:documentation` from the schema is now **docstrings** on the classes and
fields, and enumerations became Python `Enum`s. That's the headline — schema
documentation is now in the code, available to every consumer.

## 3. Use the typed data in Python

```bash
make demo
```

`demo.py` loads `samples/valid_prediction.xml`, parses it into the generated
types, and prints a summary built entirely from **typed attribute access**
(e.g. `prediction.sonar_system.designation`, looping `prediction.predictions`
for per-band detection ranges) — not string scraping. It also computes the
maximum detection range across bands.

## 4. See clear failure on bad data

```bash
make demo-invalid
```

`samples/invalid_prediction.xml` has an out-of-range sea state and a missing
required field. The program reports the validation failure clearly and exits
non-zero — never a silently-wrong summary.

## 5. Prove the structural gate (round-trip + validate)

```bash
make roundtrip
```

`roundtrip.py` parses the valid sample, serialises the typed objects **back** to
XML, validates that output against the XSD, and diffs the canonical (C14N) forms
of input vs output. A clean run means the bindings are *conformant by
construction* — you can trust them as the data contract, not just for reading.

## 6. Run the checks

```bash
make test
```

`pytest` asserts: types + docstrings were generated, the demo summary is correct,
invalid input errors clearly, and the round-trip is schema-valid and equivalent.

## What to take away

- An XSD became type-safe Python with **its documentation intact**.
- The typed objects round-trip back to schema-valid XML.
- Everything is pinned and regenerable; re-running `make generate` and the demo
  yields identical results.

See `experiments/sonar-xsdata/README.md` for the **Notes & Observations** — where
the build-time findings about xsdata on this schema (what was smooth, what
creaked, limitations) are recorded.
