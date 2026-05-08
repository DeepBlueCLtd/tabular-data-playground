# Sample lesson

This sample lesson exists so backlog item #38 (the lesson loader) has
something to render in dev. It is excluded from production builds.

## Headings, paragraphs, and inline formatting

Some text with **bold**, _italic_, ~~strikethrough~~, and `inline code`.
Visit https://example.org — that should be autolinked.

## A GFM table

| Column A | Column B   |
| -------- | ---------- |
| one      | two        |
| three    | four       |

## A GFM task list

- [x] First, ship the loader.
- [ ] Then, author the eight real lessons.

## Code blocks

Bash:

```bash
frictionless describe data.csv
```

JSON:

```json
{ "title": "Sample", "order": 0 }
```

Python:

```python
print("hello")
```

YAML:

```yaml
title: Sample
order: 0
```

CSV (intentionally not on the highlight allow-list — should render as
plain monospace):

```csv
id,name
1,alice
2,bob
```

Unknown language tag (also plain):

```sniglet
this is not a real language
```

## Links

- [Internal anchor](#headings-paragraphs-and-inline-formatting)
- [External link](https://example.org)

## Notes & Observations

This is a placeholder. The real lessons (#42–#49) carry author notes.
