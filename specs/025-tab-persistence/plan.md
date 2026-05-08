# Implementation Plan: Tab Persistence

**Branch**: `claude/epic-e1-1gMf9` (epic mode)

## Summary

Persist tab paths + active index to localStorage; restore on
vfs ready. Content always re-read from vfs (decision #38).

## Files touched

- `app/src/editor/editor-tabs-provider.tsx`.

## Constitution Check

All gates pass.
