# Phase 1 Data Model: Sonar Performance Schema (mock)

The mock XSD models a **sonar performance prediction** for a warship — synthetic,
non-sensitive, and deliberately broad in XSD *construct types* (complex types,
enumerations, constrained simple types, repeated elements, optional fields) so
the generated Python types exercise docstrings, Enums, and typed fields.

Every entity, field, and enumeration value below carries an
`xs:annotation/xs:documentation` in the XSD. Units are stated in the
documentation text so they ride through to the generated docstrings (SC-003a).
The root element is `SonarPerformancePrediction`.

## Entities

### SonarPerformancePrediction (root)

The top-level document: one prediction run for one platform under one set of
environmental conditions.

| Field | Type | Card. | Notes (→ becomes docstring) |
|-------|------|-------|------------------------------|
| `predictionId` | xs:string (attribute) | 1 | Stable identifier for this prediction run. |
| `generatedOn` | xs:date | 1 | Date the prediction was produced. |
| `platform` | Platform | 1 | The vessel the sonar is fitted to. |
| `environment` | EnvironmentConditions | 1 | Acoustic conditions assumed for the run. |
| `sonarSystem` | SonarSystem | 1 | The sonar whose performance is predicted. |
| `predictions` | DetectionPrediction | 1..* | Per-frequency-band predicted detection ranges. |

### Platform

The warship carrying the sonar.

| Field | Type | Card. | Notes |
|-------|------|-------|-------|
| `name` | xs:string | 1 | Ship name / hull designation (synthetic). |
| `class` | xs:string | 1 | Vessel class. |
| `speedKn` | SpeedKnots | 1 | Own-ship speed during the run, in knots. |

### EnvironmentConditions

Acoustic environment assumed for the prediction.

| Field | Type | Card. | Notes |
|-------|------|-------|-------|
| `seaState` | SeaState | 1 | Douglas sea state (enumeration 0–9). |
| `waterDepthM` | xs:decimal (≥0) | 1 | Water depth in metres. |
| `soundSpeedProfile` | xs:string | 0..1 | Optional named SSP (e.g. "summer-mixed"). |

### SonarSystem

The sonar being evaluated.

| Field | Type | Card. | Notes |
|-------|------|-------|-------|
| `designation` | xs:string | 1 | System designation (synthetic). |
| `type` | SonarType | 1 | Active / passive / dual (enumeration). |
| `mode` | OperatingMode | 1 | Operating mode (enumeration). |
| `sourceLevelDb` | DecibelLevel | 0..1 | Source level, dB re 1 µPa @ 1 m (active only). |

### DetectionPrediction (repeated)

One predicted detection range for one frequency band.

| Field | Type | Card. | Notes |
|-------|------|-------|-------|
| `bandHz` | FrequencyHertz | 1 | Centre frequency of the band, in Hz. |
| `detectionRangeKm` | xs:decimal (≥0) | 1 | Predicted detection range, in km. |
| `probabilityOfDetection` | UnitInterval | 1 | Modelled P(detection), 0.0–1.0. |
| `figureOfMerit` | DecibelLevel | 0..1 | Optional figure of merit, dB. |

## Enumerations (→ Python `Enum` with per-value docstrings where annotated)

### SonarType
- `ACTIVE` — emits and listens for echoes.
- `PASSIVE` — listens only.
- `DUAL` — switchable active/passive.

### OperatingMode
- `SEARCH` — wide-area search.
- `TRACK` — focused tracking of a contact.
- `CLASSIFY` — classification of a held contact.

### SeaState
- Restriction of `xs:integer` to `0`–`9` (Douglas scale), each value documented.

## Constrained simple types (→ typed fields, validated by the XSD)

| Type | Base | Restriction | Documents |
|------|------|-------------|-----------|
| `SpeedKnots` | xs:decimal | `minInclusive 0`, `maxInclusive 40` | Own-ship speed in knots. |
| `DecibelLevel` | xs:decimal | (none) | A level in decibels; reference stated in field docs. |
| `FrequencyHertz` | xs:decimal | `minExclusive 0` | Frequency in Hz. |
| `UnitInterval` | xs:decimal | `minInclusive 0`, `maxInclusive 1` | Probability in [0,1]. |

## Validation rules (enforced by the XSD; exercised by the round-trip gate)

- `seaState` MUST be 0–9; the invalid sample sets it to `12` to trip validation.
- `probabilityOfDetection` MUST be within [0,1].
- `speedKn` MUST be within [0,40].
- `predictions` MUST contain at least one `DetectionPrediction`.
- Required elements/attributes (`predictionId`, `platform`, `sonarSystem`, …)
  MUST be present; the invalid sample also omits a required field to show a
  second class of failure.

## Sample documents

- **`valid_prediction.xml`** — a fully conforming prediction with 3–4 detection
  bands, used by the demo and the round-trip gate.
- **`invalid_prediction.xml`** — same shape but with `seaState=12` (out of
  range) and a missing required field, used to demonstrate clear validation
  errors (FR-008, SC-005).

## Mapping to generated Python (what the demo asserts)

- Each complex type → a `@dataclass` with a class docstring from its
  `xs:documentation`.
- Each field → a dataclass field, typed (`str`, `date`, `Decimal`, sub-dataclass,
  `list[...]`, `Optional[...]`), with the documentation in the field metadata /
  docstring.
- Each enumeration → a Python `Enum`.
- The demo program reaches every printed value through attribute access on these
  generated types (no manual XML traversal), and `test_generation.py` asserts the
  presence of docstrings carried from the XSD.
