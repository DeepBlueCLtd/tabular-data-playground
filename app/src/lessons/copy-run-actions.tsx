import type { ReactNode } from 'react';
import { CopyRunBar } from './copy-run-bar';

export function copyRunActions(lang: string, source: string): ReactNode {
  if (lang !== 'bash') return null;
  // Trim a single trailing newline (markdown often appends one) so
  // the clipboard / submitted command doesn't carry it.
  const trimmed = source.endsWith('\n') ? source.slice(0, -1) : source;
  return <CopyRunBar source={trimmed} />;
}
