import { useEffect, useRef } from 'react';
import { getLesson } from './load';
import { LessonRenderer } from './lesson-renderer';
import { LoadLessonFilesButton } from './load-files-action';

export interface LessonViewProps {
  slug: string | null;
}

export function LessonView({ slug }: LessonViewProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const lesson = slug !== null ? getLesson(slug) : undefined;

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [slug]);

  if (slug === null) {
    return (
      <div className="lesson-view lesson-view--empty">
        <p>Pick a lesson from the curriculum index.</p>
      </div>
    );
  }
  if (!lesson) {
    return (
      <div className="lesson-view lesson-view--missing">
        <p>Lesson &ldquo;{slug}&rdquo; not found.</p>
      </div>
    );
  }

  return (
    <div className="lesson-view" ref={bodyRef}>
      <header className="lesson-view-header">
        <h1>{lesson.meta.title}</h1>
        <p className="lesson-view-meta">{lesson.meta.estimatedMinutes} min</p>
        <LoadLessonFilesButton lesson={lesson} />
      </header>
      <LessonRenderer source={lesson.body} />
    </div>
  );
}
