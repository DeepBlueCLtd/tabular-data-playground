import type { AnchorHTMLAttributes, ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const components: Components = {
    pre: ({ children }) =>
      renderCodeActions ? (
        <LessonCodeBlock renderActions={renderCodeActions}>{children}</LessonCodeBlock>
      ) : (
        <LessonCodeBlock>{children}</LessonCodeBlock>
      ),
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
