import { createContext } from 'react';

export interface CursorPosition {
  line: number;
  column: number;
}

export interface EditorFocusContextValue {
  cursor: CursorPosition | null;
  setCursor: (cursor: CursorPosition | null) => void;
}

export const EditorFocusContext = createContext<EditorFocusContextValue | null>(null);
