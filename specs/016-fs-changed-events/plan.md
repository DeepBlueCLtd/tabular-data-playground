# Implementation Plan: fs-changed Event System

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Tiny pub-sub bus (`FsEventBus`) with a React hook
(`useFsChanged`). The Pyodide provider creates a singleton bus,
exposes it via context, and forwards worker `fs-changed` messages
to it.

## Constitution Check

1. Research-first — pass.
2. Notes-section — N/A.
3. Destruction — N/A.
4. Backend — pass.
5. Pinning — N/A.
6. Limitations — pass; no new sharp edges.

All gates pass.

## Technical Context

- The bus uses a plain `Set<listener>` to keep iteration cheap and
  insertion order stable (Set preserves insertion order in JS).
- `emit` snapshots the listener set before iterating so a
  subscriber that unsubscribes mid-iteration doesn't break things.
- `useFsChanged(cb)` stashes `cb` in a ref so the underlying
  subscription can stay stable across renders.

## Files touched

- `app/src/fs/events.ts` — new bus.
- `app/src/fs/use-fs-changed.ts` — new hook.
- `app/src/pyodide/pyodide-context.ts` — add `fsEvents`.
- `app/src/pyodide/pyodide-provider.tsx` — instantiate bus,
  forward `fs-changed` messages.

## Phase 0 — Research

No external libraries needed; the bus is ~25 LOC.
