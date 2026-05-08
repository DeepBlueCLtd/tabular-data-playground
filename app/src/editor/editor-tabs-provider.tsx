import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFsChanged } from '@/fs/use-fs-changed';
import { useVfs } from '@/fs/use-vfs';
import { isFsError } from '@/fs/types';
import { AutoSaveQueue } from './auto-save';
import { EditorTabsContext } from './editor-tabs-context';
import type { EditorTab } from './types';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function EditorTabsProvider({ children }: { children: ReactNode }) {
  const { vfs } = useVfs();
  const vfsRef = useRef(vfs);
  vfsRef.current = vfs;

  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const queueRef = useRef(new AutoSaveQueue());

  const open = useCallback(async (path: string) => {
    const existing = tabsRef.current.find((t) => t.path === path);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const v = vfsRef.current;
    if (!v) {
      throw new Error('vfs not ready');
    }
    let content = '';
    let missing = false;
    try {
      content = await v.readFile(path);
    } catch (e) {
      if (isFsError(e) && e.code === 'ENOENT') {
        missing = true;
      } else {
        throw e;
      }
    }
    const id = newId();
    const tab: EditorTab = { id, path, content, dirty: false, missing };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);
  }, []);

  const close = useCallback(async (id: string) => {
    await queueRef.current.flush(id);
    setTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveTabId((cur) => {
      if (cur !== id) return cur;
      const remaining = tabsRef.current.filter((t) => t.id !== id);
      return remaining.length > 0 ? (remaining[remaining.length - 1]?.id ?? null) : null;
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const setBuffer = useCallback((id: string, content: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, content, dirty: true } : t)));
    queueRef.current.schedule(id, async () => {
      const tab = tabsRef.current.find((t) => t.id === id);
      const v = vfsRef.current;
      if (!tab || !v) return;
      await v.writeFile(tab.path, tab.content);
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, dirty: false, missing: false } : t)),
      );
    });
  }, []);

  const flushAll = useCallback(async () => {
    await Promise.all(tabsRef.current.map((t) => queueRef.current.flush(t.id)));
  }, []);

  useEffect(() => {
    const queue = queueRef.current;
    return () => {
      queue.cancelAll();
    };
  }, []);

  // If a file an open tab points at gets removed externally, mark missing.
  useFsChanged(() => {
    void (async () => {
      const v = vfsRef.current;
      if (!v) return;
      const updates: Array<{ id: string; missing: boolean }> = [];
      for (const t of tabsRef.current) {
        const stillThere = await v.exists(t.path).catch(() => true);
        if (t.missing !== !stillThere) {
          updates.push({ id: t.id, missing: !stillThere });
        }
      }
      if (updates.length === 0) return;
      setTabs((prev) =>
        prev.map((t) => {
          const u = updates.find((x) => x.id === t.id);
          return u ? { ...t, missing: u.missing } : t;
        }),
      );
    })();
  });

  const value = useMemo(
    () => ({ tabs, activeTabId, open, close, setActive, setBuffer, flushAll }),
    [tabs, activeTabId, open, close, setActive, setBuffer, flushAll],
  );

  return <EditorTabsContext.Provider value={value}>{children}</EditorTabsContext.Provider>;
}
