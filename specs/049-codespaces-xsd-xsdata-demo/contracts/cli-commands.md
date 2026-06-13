# Contract: CLI / Make command surface

The experiment exposes its workflow as a small set of `make` targets (thin
wrappers over `xsdata` and the demo scripts). These are the user-facing contract
for the demo; each maps to a spec requirement.

All commands run from `experiments/sonar-xsdata/`.

## `make generate`

- **Purpose**: Generate Python bindings from the XSD (FR-005).
- **Behaviour**: Removes `generated/` then runs
  `xsdata generate schema/sonar_performance.xsd --package generated.sonar_performance`
  (dataclasses output).
- **Inputs**: `schema/sonar_performance.xsd`.
- **Outputs**: `generated/sonar_performance/` package of dataclasses + Enums,
  with docstrings carried from the XSD annotations.
- **Success**: Exit 0; package importable; re-running yields identical output
  (FR-006, SC-002, SC-006).

## `make demo`

- **Purpose**: Use the typed data in Python (FR-007).
- **Behaviour**: Runs `python demo.py samples/valid_prediction.xml`.
- **Outputs (stdout)**: A human-readable summary derived purely from typed
  attribute access — platform name/class, sonar designation/type/mode, and a
  per-band table of frequency → detection range / P(detection), plus the
  computed maximum detection range across bands.
- **Success**: Exit 0; summary matches the valid sample (SC-004).

## `make demo-invalid`

- **Purpose**: Demonstrate clear failure on non-conforming input (FR-008).
- **Behaviour**: Runs `python demo.py samples/invalid_prediction.xml`.
- **Outputs**: A clear, human-readable validation error naming what failed
  (e.g. `seaState 12 outside 0..9`, missing required element); non-zero exit.
- **Success**: Non-zero exit with an explanatory message; never a wrong summary
  (SC-005).

## `make roundtrip`

- **Purpose**: Prove the structural verification gate (FR-008a, US4).
- **Behaviour**: Runs `python roundtrip.py samples/valid_prediction.xml`, which
  parses → serialises back to XML → validates the output against the XSD →
  canonicalises (C14N) both input and output and diffs them.
- **Outputs**: Confirmation that the re-serialised XML is schema-valid and that
  the round-trip is equivalent (empty diff, or differences printed and explained
  as insignificant formatting).
- **Success**: Exit 0 when output is schema-valid and canonical forms match
  (SC-005a, SC-006).

## `make test`

- **Purpose**: Automated checks for all of the above.
- **Behaviour**: Runs `pytest`.
- **Covers**: generation + docstring travel-through (SC-003/SC-003a), demo
  summary correctness (SC-004), invalid-input error (SC-005), round-trip
  validity + equivalence (SC-005a).

## `make all` (default)

- Runs `generate` → `test`. Intended as the one command a colleague can run
  after the Codespace builds.
