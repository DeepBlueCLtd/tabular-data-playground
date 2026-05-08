# Quickstart — Spike B

## Run from the repo

```sh
cd app/spikes/spike-b
python3 -m http.server 8001
# Open http://localhost:8001/ in a fresh browser tab.
```

## What to see

1. xterm.js terminal with prompt `$ `.
2. Above the terminal, **Self-check**: four rows; banner reads
   **PASS** if all four pass, **FAIL** otherwise.
3. **Versions** block lists pinned `xterm.js` version.

## Reproduce manually

After the self-check finishes (the prompt is unlocked), type:

```
$ echo hello | cat > out.txt
$ cat out.txt
hello
$ ls
out.txt
$ pwd
/workspace
$ echo a && echo b
shell: rejected: '&&' is not supported (see docs/limitations.md)
$ 
```

## Capture the result

The page exposes a **Copy results** button that emits the markdown
block defined in [`contracts/self-check.md`](contracts/self-check.md).
Paste it into `docs/architecture.md` under the Spike B subsection.

The verification harness at `verify/run-spikes.mjs` automates the
same capture for Chromium and Firefox headless and writes records to
`verify/results/<browser>.{md,json}`.

## What to verify before declaring item #2 done

- [ ] PASS in latest Chrome / Chromium.
- [ ] PASS in latest Firefox.
- [ ] Both records pasted into `docs/architecture.md`.
- [ ] Pinned `xterm.js` version recorded.
- [ ] Sharp edges added to `docs/limitations.md`.
- [ ] Backlog row #2 status bumped to `complete`.
