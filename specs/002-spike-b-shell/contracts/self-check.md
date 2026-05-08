# Contract — Spike B Self-Check Assertions

The self-check defined in spec FR-007. Each entry is a stable name,
the line driven through the shell, and the post-condition the spike
asserts. The on-page banner is PASS iff every entry passes.

## Assertions

### A1 — pipeline_redirect

- **command**: `echo hello | cat > out.txt`
- **post-condition**: VFS contains `/workspace/out.txt` whose bytes
  are exactly the UTF-8 encoding of `hello\n`.

### A2 — read_back

- **precondition**: A1 has run.
- **command**: `cat out.txt`
- **post-condition**: The terminal has just emitted `hello\n`
  followed by a fresh prompt. (Comparison is done on the captured
  stdout of the executor, not by scraping xterm rendering.)

### A3 — multistage_pipeline

- **precondition**: VFS may be in any state from prior assertions.
- **command**: `echo a | cat | cat`
- **post-condition**: The executor's captured stdout for the
  pipeline ends with `a\n`.

### A4 — rejected_feature

- **command**: `echo a && echo b`
- **post-condition**: Parsing fails with a rejection error whose
  message contains the rejected operator name (e.g. `&&`). The
  shell did NOT attempt to execute either side. The terminal
  remains usable; a fresh prompt follows the error message.

## Output format (paste into docs/architecture.md)

````markdown
### Spike B — Mini-shell pipes prototype

**Browser**: <e.g. Chromium 141 (Playwright headless)>
**Date**: <YYYY-MM-DD>
**Outcome**: PASS | FAIL
**Total elapsed**: <N> ms

**Versions**:

- xterm.js pinned URL: `<URL>`
- xterm.js runtime version: `<X.Y.Z>`

**Self-check**:

| # | Name | Command | Passed | Details |
|---|------|---------|--------|---------|
| 1 | pipeline_redirect | `echo hello \| cat > out.txt` | ✓ / ✗ | <one-line> |
| 2 | read_back | `cat out.txt` | ✓ / ✗ | <one-line> |
| 3 | multistage_pipeline | `echo a \| cat \| cat` | ✓ / ✗ | <one-line> |
| 4 | rejected_feature | `echo a && echo b` | ✓ / ✗ | <rejection message> |

**Notes / sharp edges observed**:

- <free-form>
````
