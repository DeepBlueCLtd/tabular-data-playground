# Quickstart: Terminal Tab Autocomplete

Manual verification recipe. Run this against the local dev build
before declaring the feature complete. The same flows are encoded
as Playwright assertions in
`app/e2e/terminal-autocomplete.spec.ts`.

## Prereqs

- `pnpm install` (frozen lockfile).
- `pnpm --filter app dev` running; open the served URL in Chrome.
- Wait for the Pyodide-ready status bar indicator before testing
  Pyodide-backed completions (`frictionless`, `python`). Builtin
  completion should work *immediately*, before Pyodide is ready —
  verify that as the first step.

## A. Command-name completion (builtins, pre-Pyodide)

1. Reload the page; do **not** wait for Pyodide.
2. In the terminal, type `e` and press Tab.
   - **Expect**: line becomes `echo ` (trailing space).
3. Backspace to clear. Type `m` and press Tab.
   - **Expect**: line becomes `mkdir ` (only builtin starting
     with `m`).
4. Backspace to clear. Type `c` and press Tab.
   - **Expect**: bell fires; line does *not* expand (longest
     common prefix of `cat`, `cd` is `c`, already typed).
5. Press Tab again without typing.
   - **Expect**: candidate list prints — `cat`, `cd` (and any
     other `c…` commands) — and a new prompt appears with `c`
     re-displayed; cursor sits after the `c`.

## B. Command-name completion (externals, post-Pyodide)

1. Wait for Pyodide-ready.
2. Type `f` and press Tab.
   - **Expect**: line becomes `frictionless `.
3. Backspace; type `p` and press Tab.
   - **Expect**: line becomes `python ` (`pwd` shares no longer
     prefix beyond `p` either, so this confirms either single
     match or LCP behaviour — see step 4).
4. If step 3 didn't uniquely expand (both `python` and `pwd`
   begin with `p`), press Tab again — expect both candidates
   listed.

## C. File / directory completion

1. Run `cd lessons` (assuming the lesson fixture is loaded).
2. Type `cd 0` and press Tab.
   - **Expect**: if more than one numeric lesson exists, bell +
     no expansion (or expansion to a deeper LCP if one exists);
     pressing Tab again lists `01-describe/`, `02-validate/`,
     etc., each with a trailing `/`.
3. Type enough characters to disambiguate (e.g. `cd 01`) then
   Tab.
   - **Expect**: line becomes `cd 01-describe/` (trailing `/`,
     no trailing space).
4. Press Enter to enter the directory.
5. Type `cat ti` and press Tab.
   - **Expect**: line becomes `cat titanic.csv ` (trailing
     space because it's a file).

## D. Path with directory part

1. From `/workspace` (run `cd /workspace`), type
   `cat lessons/01-describe/ti` and press Tab.
   - **Expect**: line becomes
     `cat lessons/01-describe/titanic.csv `.
2. Type `cat lessons/zz` and press Tab.
   - **Expect**: bell; no expansion (no matching entries).

## E. Mid-line completion

1. Type `cat  | head` (two spaces between `cat` and `|`).
2. Use Left arrow to move the cursor between the two spaces
   (column 5).
3. Press Tab.
   - **Expect**: a filename is inserted at the cursor position;
     the trailing ` | head` is preserved verbatim.

## F. No-op while busy

1. Run a slow command. If Pyodide is ready:
   `python -c "import time; time.sleep(3)"`. Otherwise use any
   long-running builtin equivalent.
2. While it's running, press Tab repeatedly.
   - **Expect**: nothing changes — no character appears, no
     prompt changes, no bell sound, terminal stays "busy".
3. Wait for completion; verify the prompt redraws cleanly and
   subsequent Tabs work normally.

## G. History interaction

1. Run `echo hello`.
2. Press Up arrow.
   - **Expect**: line shows `echo hello`, cursor at end.
3. Press Tab.
   - **Expect**: bell + no expansion (`echo hello` is not a
     prefix match for anything; the token under cursor is the
     filename argument `hello`, which doesn't match any VFS
     entry). Behavior should match a fresh `echo hello` + Tab.

## H. Spec amendment present

After implementation, open `spec.md` §10 line 173 and confirm
"tab completion" has been removed from the "Rejected for v1"
list (with a short note that it was added in iteration 048).
