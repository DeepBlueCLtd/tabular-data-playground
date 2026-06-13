# Feature Specification: Codespaces XSD → XSData Typed-Data Demo

**Feature Branch**: `claude/codespaces-xsd-xsdata-demo-0quywk`
**Created**: 2026-06-13
**Status**: Draft
**Input**: User description: "I want to experiment with using GitHub codespaces in this project. I want to demonstrate how we can take the XML XSD containing the sonar performance data for a warship, use XSData to develop python types for it, then use that typed data in python coding. I want to demo that in the Codespace for this project."

## Context

This is an **experiment / spike**, not a change to the Frictionless Data
Explorer SPA. Its purpose is to evaluate a *different* data-modelling leg —
schema-first typed binding from an XML Schema (XSD) — and to prove that the
project can be opened and demonstrated inside a GitHub Codespace with zero
local setup. The sonar-performance subject matter is synthetic-but-realistic
and aligns with the project's maritime-acoustics domain framing (radiated
noise levels and sonar performance characteristics). No real or sensitive
warship data is used.

The headline story the author wants to be able to tell a colleague is:
*"Click 'Open in Codespace', wait for it to build, run one command, and watch
an XML schema become type-safe Python objects that I can program against."*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zero-setup demo environment in a Codespace (Priority: P1)

The author (or a colleague) opens the repository in a GitHub Codespace from
the branch and, after the environment finishes building, has every tool the
demonstration needs already installed and pinned — without running any manual
install or configuration steps. They can immediately run the demonstration.

**Why this priority**: The entire premise is "demo it in the Codespace". If
the environment does not come up ready-to-run, there is no demo. This story
is the enabling MVP — even before any XSData output exists, a reproducible
environment is independently valuable as the foundation everything else sits
on.

**Independent Test**: Open the repository in a fresh Codespace from the
feature branch; confirm the environment finishes provisioning and that the
demonstration's prerequisites (a pinned Python runtime and the schema-binding
tooling) are present and report their versions, with no manual install steps
performed by the user.

**Acceptance Scenarios**:

1. **Given** the repository branch, **When** a user opens it in a new
   Codespace, **Then** the environment provisions automatically and signals
   when it is ready to use.
2. **Given** a freshly built Codespace, **When** the user checks the demo
   prerequisites, **Then** the required Python runtime and schema-binding
   tool are already installed at the pinned versions and runnable.
3. **Given** a freshly built Codespace, **When** the user follows the
   demonstration's "first step" instructions, **Then** they can run the demo
   end-to-end without editing configuration or installing packages.

---

### User Story 2 - Generate Python types from the sonar XSD (Priority: P2)

Starting from an XSD that describes warship sonar performance data, the user
runs a single, documented command that produces typed Python bindings
(classes/types) representing the schema's elements, attributes, and
enumerations.

**Why this priority**: This is the central capability being evaluated —
turning a schema into code. It depends on the environment (P1) but delivers
the first concrete, inspectable artefact of the experiment: generated types.

**Independent Test**: With the environment ready, run the documented
generation command against the provided sonar XSD and confirm it emits Python
type definitions whose structure mirrors the schema (the major entities,
their fields, and any enumerations appear as named, typed members).

**Acceptance Scenarios**:

1. **Given** the sonar-performance XSD and a ready environment, **When** the
   user runs the documented generation command, **Then** Python type
   definitions are produced that correspond to the schema's structure.
2. **Given** generated types, **When** the user inspects them, **Then** the
   schema's named entities, fields, and enumerations are recognisable as
   typed Python members.
3. **Given** an XSD rich in annotations/documentation, **When** types are
   generated, **Then** those annotations appear in the generated Python types
   (e.g. as docstrings on the corresponding classes/fields), demonstrating
   that schema documentation travels through to the code.
3. **Given** the generation step, **When** it is re-run, **Then** it produces
   the same result deterministically (no manual fix-ups required to make the
   output usable).

---

### User Story 3 - Use the typed data in Python code (Priority: P3)

The user runs a short, documented Python program that loads a sample sonar
performance XML document, parses it into the generated typed objects, and
uses those objects in ordinary Python code — reading fields with type-aware
access and computing or printing a small summary that proves the data round-
tripped into usable, structured form.

**Why this priority**: This closes the loop the author described — *"then use
that typed data in python coding"* — and is the payoff that makes the demo
compelling. It depends on P1 and P2 but is the part a colleague actually
watches happen.

**Independent Test**: With generated types available, run the documented demo
program against a sample sonar XML document and confirm it prints a correct,
human-readable summary derived from typed field access (not raw string/XML
scraping).

**Acceptance Scenarios**:

1. **Given** generated types and a sample sonar XML document, **When** the
   user runs the demo program, **Then** the XML is parsed into typed objects
   and a summary derived from those objects is printed.
2. **Given** the demo program, **When** a field is accessed, **Then** it is
   reached through the typed object model (attribute access on generated
   types), demonstrating type-safe usage rather than manual XML traversal.
3. **Given** a sample document that does not conform to the schema, **When**
   it is loaded, **Then** the program surfaces a clear, understandable error
   rather than silently producing wrong results.

---

### Edge Cases

- What happens when the Codespace is reopened later (warm start) — does it
  remain ready without re-running setup?
- How does the demo behave when network access to fetch pinned tooling is
  unavailable during provisioning? (Failure should be clear, not silent.)
- What happens when the XSD contains a construct the binding tool cannot
  represent (e.g. an exotic type or unsupported pattern)? The limitation
  should be captured rather than hidden.
- How does the demo handle an XML document that is well-formed but does not
  match the schema (missing required elements, out-of-range enumeration)?
- What happens when the generation command is run a second time over an
  existing output directory — are stale generated files left behind?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST provide a Codespaces configuration so that
  opening the branch in a Codespace produces a ready-to-use environment
  automatically, with no manual install or configuration steps required of
  the user.
- **FR-002**: The provisioned environment MUST include a pinned Python
  runtime and the schema-binding tooling needed to generate Python types from
  an XSD, both installed and runnable on first use.
- **FR-003**: The repository MUST include a mock XSD describing warship sonar
  performance data (synthetic-but-realistic, non-sensitive) suitable for
  driving the demonstration.
- **FR-003a**: The mock XSD MUST be richly annotated with documentation on
  its entities, fields, and enumerations, so the demonstration can show those
  annotations carrying through into the generated Python types.
- **FR-004**: The repository MUST include at least one sample XML document
  that conforms to the sonar XSD for use as demo input, plus a clearly
  labelled non-conforming sample to exercise error handling.
- **FR-005**: The demonstration MUST provide a single documented command that
  generates Python types from the sonar XSD.
- **FR-006**: The generation step MUST produce deterministic output that is
  usable without manual edits.
- **FR-006a**: The generated types MUST preserve the XSD's annotations as
  in-code documentation (e.g. docstrings) wherever the schema provides them.
- **FR-007**: The demonstration MUST provide a short, documented Python
  program that loads a sample sonar XML document, parses it into the
  generated typed objects, and uses those objects to compute or print a
  summary via type-aware field access.
- **FR-008**: When given a non-conforming XML document, the demo program MUST
  surface a clear, understandable error rather than producing incorrect
  output silently.
- **FR-009**: The repository MUST document the end-to-end demo walkthrough
  (open Codespace → generate types → run demo) in a single discoverable place
  so a colleague can reproduce it unaided.
- **FR-010**: All newly introduced external tooling versions MUST be pinned
  and recorded, consistent with the project's version-pinning principle.
- **FR-011**: The experiment's findings — what worked, what creaked, and the
  binding tool's limitations against this schema — MUST be captured in a
  Notes & Observations record, consistent with the project's durable-notes
  principle.
- **FR-012**: The demonstration MUST be self-contained to this experiment and
  MUST NOT alter the behaviour of the existing Frictionless Data Explorer
  single-page application.

### Key Entities *(include if feature involves data)*

- **Sonar Performance Schema (XSD)**: The mock XML Schema describing warship
  sonar performance data — the structural contract that defines the entities,
  fields, units, and enumerations the demonstration binds to code. Richly
  annotated so its documentation can be shown travelling through into the
  generated types.
- **Sonar Performance Document (XML)**: A sample instance conforming to the
  schema; the input the demo program parses. Includes at least one valid and
  one deliberately invalid example.
- **Generated Python Types**: The typed bindings produced from the XSD —
  named classes/types mirroring the schema's entities, fields, and
  enumerations, used for type-safe access in Python.
- **Demo Program**: The short Python program that consumes the generated
  types against a sample document and emits a summary.
- **Codespace Environment Definition**: The configuration that makes the
  repository open into a ready-to-run development environment.
- **Notes & Observations Record**: The captured findings about the
  schema-first typed-binding leg (smooth spots, workarounds, limitations).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A colleague who has never seen the project can, starting only
  from "open this in a Codespace", reach a running demonstration in under 10
  minutes of active effort, performing no manual install or configuration
  steps.
- **SC-002**: Generating the Python types from the sonar schema is a single
  command that completes successfully on first attempt in a freshly built
  environment.
- **SC-003**: 100% of the schema's named entities, fields, and enumerations
  are represented in the generated types (the generated model is a faithful
  mirror of the schema).
- **SC-003a**: Every annotated element in the XSD has its documentation
  present in the corresponding generated type (e.g. as a docstring), so the
  "annotations travel through" claim is demonstrable for each annotated
  member.
- **SC-004**: The demo program parses the valid sample document and prints a
  correct summary derived from typed field access on the first run.
- **SC-005**: Loading the deliberately invalid sample produces a clear,
  understandable error and never a silently-wrong summary.
- **SC-006**: Re-running the full walkthrough (build, generate, run) twice
  yields identical generated types and identical demo output (reproducible).
- **SC-007**: The experiment's Notes & Observations record names at least the
  smooth spots and the limitations encountered for the schema-first typed-
  binding leg.

## Assumptions

- This is a standalone Codespaces experiment. It is intentionally separate
  from the Frictionless Data Explorer SPA and does not become a curriculum
  lesson within v1 (it may inform a future fitness-assessment leg, but that
  is out of scope here).
- No real or classified warship data exists or is required; a synthetic-but-
  realistic XSD and sample documents will be authored for the demo, consistent
  with the project's stance that domain data is non-sensitive and synthetic.
- The schema-binding tool is XSData and the runtime is Python, as named in the
  request; specific pinned versions are an implementation detail to be fixed
  during planning and recorded per the pinning principle.
- "Use the typed data in Python coding" is satisfied by a small,
  representative program (load → parse → typed access → summary), not a full
  application; the goal is demonstration, not production tooling.
- The demonstration runs in a GitHub Codespace; running it locally is a nice-
  to-have side effect of a portable environment definition but is not a
  required deliverable.
- Network access during Codespace provisioning is available to fetch pinned
  tooling; graceful, clear failure when it is not is expected behaviour rather
  than a supported offline mode.
