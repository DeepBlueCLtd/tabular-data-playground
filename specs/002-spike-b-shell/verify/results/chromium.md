### Spike B — Mini-shell pipes prototype

**Browser**: chromium (Playwright headless) — Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36
**Date**: 2026-05-08
**Outcome**: PASS
**Total elapsed**: 229 ms

**Versions**:

- xterm.js pinned URL: `https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js`
- xterm.js: `5.5.0`
- @xterm/addon-fit: `0.10.0`

**Self-check**:

| # | Name | Command | Passed | Details |
|---|------|---------|--------|---------|
| 1 | A1 | `echo hello \| cat > out.txt` | ✓ | out.txt = "hello\n" (6 bytes) |
| 2 | A2 | `cat out.txt` | ✓ | stdout = "hello\n" |
| 3 | A3 | `echo a \| cat \| cat` | ✓ | stdout = "a\n" |
| 4 | A4 | `echo a && echo b` | ✓ | '&&' is not supported (see docs/limitations.md) |

**VFS keys at end of self-check**: `/workspace/out.txt`
