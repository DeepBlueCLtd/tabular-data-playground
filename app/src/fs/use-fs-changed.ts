import { useEffect, useRef } from 'react';
import { usePyodide } from '@/pyodide/use-pyodide';
import type { FsChangedListener } from './events';

export function useFsChanged(listener: FsChangedListener): void {
  const { fsEvents } = usePyodide();
  const ref = useRef(listener);
  ref.current = listener;

  useEffect(() => {
    return fsEvents.on((event) => {
      ref.current(event);
    });
  }, [fsEvents]);
}
