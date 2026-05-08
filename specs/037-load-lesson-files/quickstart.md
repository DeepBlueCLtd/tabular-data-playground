# Quickstart — Loading lesson files

## For lesson authors

Add a `files/` subfolder next to your `lesson.md` and `meta.json`.
Drop in any starter content (CSV, JSON, README, partial schema).
Subfolders are supported.

```
content/lessons/01-describe/
  lesson.md
  meta.json
  files/
    data.csv
    README.md
    raw/2025/sample.csv
```

Rebuild — the lesson's view now shows a **Load lesson files**
button. Clicking copies everything under `files/` into
`/workspace/01-describe/`, mirroring the structure.

If a learner has already edited files at the destination, they get
a single confirm modal:

> Folder `01-describe` already has files. Loading the lesson's
> starter files will overwrite any with the same name. Your edits to
> those files will be lost.

Files in `/workspace/01-describe/` that don't match a starter file
name are preserved (e.g., a learner's `notes.txt`).

## For learners

Click **Load lesson files** at the top of the lesson. If you've made
changes, decide whether to keep them (Cancel) or replace with the
fresh starter set (Overwrite).
