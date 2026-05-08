import { useContext } from 'react';
import { EditorTabsContext, type EditorTabsContextValue } from './editor-tabs-context';

export function useEditorTabs(): EditorTabsContextValue {
  const ctx = useContext(EditorTabsContext);
  if (!ctx) {
    throw new Error('useEditorTabs must be used inside <EditorTabsProvider>.');
  }
  return ctx;
}
