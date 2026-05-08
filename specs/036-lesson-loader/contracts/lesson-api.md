# Public TS surface — `app/src/lessons/`

Modules outside `app/src/lessons/` MUST consume only the named exports
from `@/lessons` listed below. Nothing else is part of the contract.

## Types

```ts
export interface LessonMeta {
  title: string;
  slug: string;          // === folder name
  order: number;         // integer
  summary: string;
  estimatedMinutes: number;
  [unknown: string]: unknown;  // tolerated, untyped
}

export interface Lesson {
  slug: string;
  meta: LessonMeta;
  body: string;          // raw markdown
}

export interface LessonIndex {
  entries: readonly LessonMeta[];   // sorted by order asc
  bySlug:  ReadonlyMap<string, Lesson>;
}
```

## Functions

```ts
export function getLessonIndex(): LessonIndex;
// Lazily-initialised, memoised. Throws at first call if a build-time
// invariant was violated (spec FR-005).

export function getLesson(slug: string): Lesson | undefined;
// Convenience over getLessonIndex().bySlug.get(slug).
```

## Components

```tsx
export function LessonView(props: {
  slug: string | null;     // null => render empty state
}): JSX.Element;

// LessonCodeBlock is the <code> override used by LessonView.
// Exported so #39 (Copy/Run buttons) can wrap it.
export function LessonCodeBlock(props: {
  inline?: boolean;
  className?: string;      // hljs sets `language-bash` etc here
  children?: ReactNode;
  renderActions?: (lang: string, source: string) => ReactNode; // for #39
}): JSX.Element;
```

## Stability

- The four named functions/components and the three types above are the
  public surface.
- `LessonCodeBlock`'s `renderActions` prop is reserved for #39; #38
  ships the prop wired but unused.
- Anything else under `app/src/lessons/` is internal and may change
  without a spec update.
