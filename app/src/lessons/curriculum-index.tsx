import type { LessonMeta } from './types';

interface Props {
  entries: readonly LessonMeta[];
  onSelect: (slug: string) => void;
}

export function CurriculumIndex({ entries, onSelect }: Props) {
  if (entries.length === 0) {
    return (
      <div className="curriculum-index curriculum-index--empty">
        <p>No lessons available.</p>
      </div>
    );
  }
  return (
    <ol className="curriculum-index" data-curriculum-index>
      {entries.map((meta) => (
        <li key={meta.slug}>
          <button
            type="button"
            className="curriculum-index-row"
            data-lesson-slug={meta.slug}
            onClick={() => onSelect(meta.slug)}
          >
            <span className="curriculum-index-title">
              <span className="curriculum-index-order">{meta.order}.</span> {meta.title}
            </span>
            <span className="curriculum-index-summary">{meta.summary}</span>
            <span className="curriculum-index-time">{meta.estimatedMinutes} min</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
