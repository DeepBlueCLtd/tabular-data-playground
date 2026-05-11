# Data Model: Terminal Tab Autocomplete

This feature is not data-driven in the traditional sense (no entities
persisted, no schemas). The "model" here is the set of in-memory types
that flow between the terminal layer and the new completion module.

## Types

All types live in `app/src/mini-shell/complete.ts` unless noted.

### `CompletionKind`

```ts
export type CompletionKind = 'command' | 'file' | 'dir';
```

Drives the trailing character used after a unique match (`command` /
`file` → space; `dir` → `/`) and the visual marker in the candidate
list (dirs are shown with a trailing `/`).

### `Candidate`

```ts
export interface Candidate {
  /** The name as it should appear in the line and the list. */
  name: string;
  kind: CompletionKind;
}
```

A single completion option. The `name` does **not** include the
trailing space or slash; the terminal layer composes those.

### `CompleteInput`

```ts
export interface CompleteInput {
  /** The full current line, including text after the cursor. */
  line: string;
  /** Cursor position as a character index into `line`. */
  cursor: number;
  /** Current working directory in the mini-shell session. */
  cwd: string;
  /** VFS handle for readdir/stat. */
  vfs: Vfs;
  /** Builtin names ∪ external command names. */
  commandNames: readonly string[];
  /** True iff this is the second consecutive Tab on the same (line, cursor). */
  doubleTab: boolean;
}
```

### `CompletionResult`

A discriminated union covering the four observable outcomes.

```ts
export type CompletionResult =
  | UniqueResult
  | PrefixResult
  | ListResult
  | NoneResult;

export interface UniqueResult {
  kind: 'unique';
  /** Inclusive start of the substring to replace. */
  insertStart: number;
  /** Exclusive end of the substring to replace. */
  insertEnd: number;
  /** Replacement text including any trailing slash / space. */
  insert: string;
  /** New cursor position (always insertStart + insert.length). */
  newCursor: number;
}

export interface PrefixResult {
  kind: 'prefix';
  insertStart: number;
  insertEnd: number;
  /** The longest common prefix (no trailing slash/space). */
  insert: string;
  newCursor: number;
  /** Always true — bell is emitted alongside the expansion. */
  bell: true;
}

export interface ListResult {
  kind: 'list';
  /** Same fields as a prefix result, so the line is also expanded
   *  if a deeper LCP exists between the second-Tab moment and now. */
  insertStart: number;
  insertEnd: number;
  insert: string;
  newCursor: number;
  /** All candidates, in lexicographic order. */
  candidates: Candidate[];
  bell: true;
}

export interface NoneResult {
  kind: 'none';
  bell: true;
}
```

### Internal helpers (not exported)

```ts
interface TokenSlice {
  /** Inclusive start in `line`. */
  start: number;
  /** Exclusive end in `line`. */
  end: number;
  /** line.slice(start, end). */
  text: string;
  /** Index of this token in the unquoted-whitespace split (0 = first token). */
  index: number;
  /** True iff `text` contains any quote or backslash character. */
  hasQuoteOrEscape: boolean;
}

function tokenAtCursor(line: string, cursor: number): TokenSlice;

interface SplitPath {
  /** Directory part (may be ''). */
  dir: string;
  /** Basename part. */
  base: string;
}

function splitTokenPath(token: string): SplitPath;

function longestCommonPrefix(names: readonly string[]): string;
```

## State

### Terminal-side state (in `app/src/terminal/terminal.tsx`)

One new ref:

```ts
const lastTabRef = useRef<{ line: string; cursor: number } | null>(null);
```

- Set on every Tab keystroke *before* dispatch.
- Cleared on every non-Tab keystroke (including paste, history,
  cursor movement) and after the completion has been applied if
  the result was anything other than `prefix` (the user is now in
  a new state).

The double-Tab decision is: `doubleTab = lastTabRef.current &&
lastTabRef.current.line === line && lastTabRef.current.cursor ===
cursor`.

### Shell-side state

None. `useShellRunner` already owns `cwdRef`; the new `complete`
callback reads it. No additional state is introduced.

## Validation rules

Encoded in the completer's algorithm rather than declarative
schema:

1. If `terminal busy`: caller (terminal handler) does not invoke
   the completer — this is enforced at the call site, not in
   `complete()` itself, because the busy flag lives in the
   terminal component.
2. If `token.hasQuoteOrEscape`: return `{kind: 'none', bell: true}`.
3. If `token.index === 0` (first token): candidates =
   `commandNames` filtered by prefix.
4. Otherwise: resolve `splitTokenPath(token.text).dir` against
   `cwd`; if `resolveCwd` returns null (path outside workspace),
   return `{kind: 'none', bell: true}`; else `readdir` and filter
   entries whose `name` starts with `base`.
5. Zero candidates → `{kind: 'none', bell: true}`.
6. One candidate → `unique`; suffix is `/` for dir, else space
   (with the "skip if next char already space" rule).
7. Multiple candidates and `doubleTab === false`:
   - LCP > current basename → `prefix` result expanding to LCP,
     bell.
   - LCP === current basename → `prefix` result with `insert =
     token.text` (no-op replacement), bell. The terminal applies
     this as a no-op but still emits the bell.
8. Multiple candidates and `doubleTab === true` → `list` result.

## State transitions

Pseudo-FSM for the terminal's view of Tab:

```text
[idle] --tab-->        [tab-1]      (lastTabRef set)
[tab-1] --non-tab-->   [idle]       (lastTabRef cleared)
[tab-1] --tab(same)--> [tab-2]      (doubleTab=true passed)
[tab-1] --tab(diff)--> [tab-1]      (lastTabRef updated)
[tab-2] --non-tab-->   [idle]
[tab-2] --tab(same)--> [tab-2]      (idempotent — keeps listing)
```

"Same" means the `(line, cursor)` snapshot matches the snapshot
stored at the previous Tab; "different" means it doesn't (e.g.,
the previous Tab expanded the line by one character, so the new
snapshot won't match the old one and we treat it as a fresh
single Tab).
