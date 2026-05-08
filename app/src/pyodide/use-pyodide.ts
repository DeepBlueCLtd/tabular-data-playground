import { useContext } from 'react';
import { PyodideContext, type PyodideContextValue } from './pyodide-context';

export function usePyodide(): PyodideContextValue {
  const ctx = useContext(PyodideContext);
  if (!ctx) {
    throw new Error('usePyodide must be used inside a <PyodideProvider>.');
  }
  return ctx;
}
