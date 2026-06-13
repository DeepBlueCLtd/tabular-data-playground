# Contract: The XSD as the data contract

The XSD is the language-agnostic contract; the generated Python bindings are a
convenience derived from it (per the SMH delivery plan). This file fixes the
properties the schema and its bindings must satisfy so the demo's claims hold.

## Schema properties (the contract the demo proves)

1. **Annotation coverage** — every named complex type, element/attribute, and
   enumeration value carries an `xs:annotation/xs:documentation`. This is what
   travels through to docstrings (SC-003a). Documentation, not XML comments
   (comments are discarded at parse time).
2. **Construct breadth** — the schema includes at least: nested complex types,
   a repeated element (`maxOccurs="unbounded"`), an optional element
   (`minOccurs="0"`), enumerations, and numeric `xs:restriction` facets. This
   guarantees the generated model shows dataclasses, `Enum`s, `Optional[...]`,
   `list[...]`, and typed numeric fields.
3. **Units in documentation** — quantities state their unit in the annotation
   text (knots, metres, Hz, km, dB, dimensionless probability) so units are
   visible in the generated docstrings even though XSD has no native unit type.

## Binding properties (what generation must yield)

- One importable Python package under `generated/sonar_performance/`.
- One `@dataclass` per complex type, with a class docstring sourced from the
  type's `xs:documentation`.
- One `Enum` per enumeration.
- Field types faithful to the XSD (`Decimal` for `xs:decimal`, `date` for
  `xs:date`, sub-dataclass references, `list[...]`, `Optional[...]`).
- No hand edits — regenerable via `make generate` to byte-identical output.

## Round-trip contract (structural gate)

- Parsing `valid_prediction.xml` into the bindings and serialising back MUST
  produce XML that **validates against this XSD**.
- The canonical (C14N) form of the round-tripped XML MUST equal the canonical
  form of the input, OR any difference MUST be reported and explained as
  insignificant formatting — never silent data loss (SC-005a).

## Non-conformance contract

- `invalid_prediction.xml` MUST fail XSD validation (out-of-range `seaState`,
  missing required field) and the demo MUST surface that failure clearly rather
  than producing output (FR-008, SC-005).
