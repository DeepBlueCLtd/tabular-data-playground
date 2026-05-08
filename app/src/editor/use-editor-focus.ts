import { useContext } from 'react';
import { EditorFocusContext, type EditorFocusContextValue } from './editor-focus-context';

export function useEditorFocus(): EditorFocusContextValue {
  const ctx = useContext(EditorFocusContext);
  if (!ctx) {
    throw new Error('useEditorFocus must be used inside <EditorFocusProvider>.');
  }
  return ctx;
}
