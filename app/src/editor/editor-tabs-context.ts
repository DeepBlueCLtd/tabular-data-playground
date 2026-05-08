import { createContext } from 'react';
import type { EditorTab } from './types';

export interface EditorTabsContextValue {
  tabs: EditorTab[];
  activeTabId: string | null;
  open: (path: string) => Promise<void>;
  close: (id: string) => Promise<void>;
  setActive: (id: string) => void;
  setBuffer: (id: string, content: string) => void;
  /** Force-flush all pending saves; used by #26 pre-execution flush. */
  flushAll: () => Promise<void>;
  /** True if a save is in flight for the given tab id. */
  isSaving: (id: string) => boolean;
}

export const EditorTabsContext = createContext<EditorTabsContextValue | null>(null);
