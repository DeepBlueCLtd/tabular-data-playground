# Feature Specification: xterm.js Terminal UI (#21)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #21 — `xterm-addon-fit`,
`xterm-addon-web-links`; up/down arrow command history within
session, no persistence, no Ctrl+R (decision #25).

## User Scenarios

- Once Pyodide is ready, the terminal panel shows a real
  xterm-driven prompt `$ `. The user can type, edit (backspace),
  and press Enter to submit.
- Up/Down arrows cycle session command history. No persistence.
- No Ctrl+R reverse search.
- Web links in output (e.g. printed URLs) are clickable.

## Requirements

- **FR-001**: Add `@xterm/xterm@5.5.0`, `@xterm/addon-fit@0.10.0`,
  `@xterm/addon-web-links@0.11.0` to `app/package.json` (exact).
- **FR-002**: New `app/src/terminal/terminal.tsx` mounts an
  `xterm.js` `Terminal` into a `<div>`, attaches FitAddon
  (resize on container changes) and WebLinksAddon. Theme follows
  the app theme.
- **FR-003**: Built-in line editing: cursor, Backspace, Left,
  Right, Home, End, basic typed input. No raw mode escape
  passthrough.
- **FR-004**: Up/Down arrows browse history (session only).
- **FR-005**: On Enter: emit a `command` event to a callback
  prop. v1 callback: stubbed runner that echoes
  `> command "<input>" — not yet wired (#24)\n` and returns to
  the prompt.
- **FR-006**: `terminal-panel.tsx` mounts the terminal once
  Pyodide is ready; the greyed prompt and Cancel/Reload chrome
  remain when not ready / errored.
- **FR-007**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- After Pyodide ready, the terminal renders, accepts typed
  input, supports backspace and arrow-key history, and emits
  Enter events with the typed line.

## Assumptions

- `@xterm/xterm` ships its own CSS that we import once.
- The mini-shell tokeniser (#22) / parser (#23) / executor (#24)
  / builtins (#25) wire into the runner callback later.
