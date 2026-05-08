import { useMemo, useState, type ReactNode } from 'react';
import { type CursorPosition, EditorFocusContext } from './editor-focus-context';

export function EditorFocusProvider({ children }: { children: ReactNode }) {
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
  const value = useMemo(() => ({ cursor, setCursor }), [cursor]);
  return <EditorFocusContext.Provider value={value}>{children}</EditorFocusContext.Provider>;
}
