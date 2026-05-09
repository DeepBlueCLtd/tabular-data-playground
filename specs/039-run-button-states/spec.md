# Feature Specification: Run button states (#40)

**Branch**: `claude/epic-e2-qp0Tr` (epic E2)
**Backlog ID**: #40
**Input**: Run button states — disabled while Pyodide loading, disabled while previous command in flight (no command queueing in v1), idle/clickable otherwise; most-recently-clicked block visually marked. Copy button always enabled.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — No accidental command queueing (Priority: P1)

While a command is running (started via Run **or** typed into the
terminal), every **Run** button across the lesson is disabled. As
soon as the command finishes, all Run buttons re-enable. The user
cannot fire a new command on top of an in-flight one.

**Independent test**: Click **Run** on a `bash` block whose command
sleeps; while it runs, attempt to click another **Run** — assert
the button has `disabled`. After the first command completes,
assert all Run buttons return to enabled.

### User Story 2 — Most-recently-clicked block is visually marked (Priority: P2)

After the user clicks **Run** on a block, that block is visually
marked as the most-recent (e.g. a left-edge accent / data-active
attribute). The mark persists across subsequent commands until
the user clicks **Run** on a different block. Helps the user
remember "where they were" in the lesson.

**Independent test**: Click Run on block A → A has `[data-active]`.
Click Run on block B → B has `[data-active]`, A does not.

### User Story 3 — Copy is always enabled (Priority: P2)

**Copy** never disables. It works during Pyodide load, during a
command in flight, before, after — always.

**Independent test**: While Pyodide is loading and during an
in-flight command, click Copy and assert the clipboard text is
correct.

### Edge Cases

- **User typed a command directly in the terminal**: that also
  flips the global `running` flag, disabling all Run buttons until
  the typed command finishes.
- **A command errors out**: `running` returns to false; Run buttons
  re-enable. The most-recent marker stays.
- **The user clicks Run on the same block twice while it is running**:
  the second click is a no-op (button is disabled).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A global `running` flag MUST be set to `true` when a
  command starts (via Run button OR via user-typed Enter) and back
  to `false` when it finishes (success or error).
- **FR-002**: Every **Run** button MUST be disabled when `running`
  is true. Existing disable conditions (terminal-submit not
  registered) still apply.
- **FR-003**: Clicking **Run** MUST record the block's source as
  the most-recent run; this state survives until the user clicks
  **Run** on another block.
- **FR-004**: A block whose source matches the most-recent run
  MUST carry a `data-lesson-code-active="true"` attribute and a
  visual accent (per existing theme tokens) on its wrapper.
- **FR-005**: **Copy** MUST be enabled regardless of `running`,
  Pyodide state, or most-recent state.
- **FR-006**: While its block is the active in-flight one (matches
  most-recent AND `running` is true), the **Run** button MUST
  display a "Running…" label so the user can locate the in-flight
  block at a glance.

### Key Entities

- **`running`**: boolean global, owned by the terminal lifecycle.
- **`lastRunSource`**: `string | null`, set on each Run click.

## Success Criteria

- **SC-001**: All Run buttons are disabled within 50 ms of a
  command starting; all re-enable within 50 ms of it finishing.
- **SC-002**: Exactly one block carries `data-lesson-code-active`
  at any time after the first Run click.
- **SC-003**: Copy works in all states (Pyodide loading, in-flight,
  idle).

## Assumptions

- The terminal owns the authoritative `running` flag because it
  knows when a command starts/finishes.
- The "most-recent" state is process-lifetime; not persisted to
  localStorage. Reload resets it.
