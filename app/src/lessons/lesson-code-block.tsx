import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

export interface LessonCodeBlockProps {
  children?: ReactNode;
  renderActions?: (lang: string, source: string) => ReactNode;
}

const LANG_PREFIX = 'language-';

function languageFromClassName(className: string | undefined): string {
  if (!className) return '';
  for (const cls of className.split(/\s+/)) {
    if (cls.startsWith(LANG_PREFIX)) {
      return cls.slice(LANG_PREFIX.length);
    }
  }
  return '';
}

function flattenChildren(children: ReactNode): string {
  let acc = '';
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      acc += String(child);
    } else if (isValidElement<{ children?: ReactNode }>(child)) {
      acc += flattenChildren(child.props.children);
    }
  });
  return acc;
}

function findCodeElement(
  children: ReactNode,
): ReactElement<{ className?: string; children?: ReactNode }> | null {
  let found: ReactElement<{ className?: string; children?: ReactNode }> | null = null;
  Children.forEach(children, (child) => {
    if (
      found === null &&
      isValidElement<{ className?: string; children?: ReactNode }>(child) &&
      child.type === 'code'
    ) {
      found = child;
    }
  });
  return found;
}

export function LessonCodeBlock({ children, renderActions }: LessonCodeBlockProps) {
  const codeChild = findCodeElement(children);
  const lang = codeChild ? languageFromClassName(codeChild.props.className) : '';
  const source = codeChild ? flattenChildren(codeChild.props.children) : '';

  const actions = renderActions ? renderActions(lang, source) : null;
  return (
    <div className="lesson-code-block">
      {actions ? (
        <div className="lesson-code-actions" data-lesson-code-actions>
          {actions}
        </div>
      ) : null}
      <pre data-lesson-code-lang={lang || undefined}>{children}</pre>
    </div>
  );
}
