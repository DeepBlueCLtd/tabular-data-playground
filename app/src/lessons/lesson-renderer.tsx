import type { AnchorHTMLAttributes, ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { copyRunActions } from './copy-run-actions';
import { rehypeHighlightConfigured } from './highlight';
import { LessonCodeBlock } from './lesson-code-block';

export interface LessonRendererProps {
  source: string;
  renderCodeActions?: (lang: string, source: string) => ReactNode;
}

function isExternalHref(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
}

function LessonAnchor({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <a {...rest} href={href}>
      {children}
    </a>
  );
}

export function LessonRenderer({ source, renderCodeActions }: LessonRendererProps) {
  // Default action renderer for #39 (Copy/Run on bash blocks). Callers
  // can override via the prop (e.g. tests, or future per-lesson modes).
  const actions = renderCodeActions ?? copyRunActions;
  const components: Components = {
    pre: ({ children }) => <LessonCodeBlock renderActions={actions}>{children}</LessonCodeBlock>,
    a: LessonAnchor,
  };

  return (
    <div className="lesson-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlightConfigured]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
