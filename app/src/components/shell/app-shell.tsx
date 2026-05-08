import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ThemeToggle } from '@/components/theme-toggle';
import { ActivityBar, type ActivityEntry } from './activity-bar';
import { SidePanel } from './side-panel';
import { EditorArea } from '@/editor/editor-area';
import { TerminalPanel } from './terminal-panel';
import { StatusBar } from './status-bar';

export function AppShell() {
  const [active, setActive] = useState<ActivityEntry>('lessons');
  const [collapsed, setCollapsed] = useState(false);

  function handleSelect(entry: ActivityEntry) {
    if (!collapsed && entry === active) {
      setCollapsed(true);
      return;
    }
    setActive(entry);
    setCollapsed(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium">Frictionless Data Explorer</span>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 min-h-0">
        <ActivityBar active={active} collapsed={collapsed} onSelect={handleSelect} />
        <PanelGroup direction="horizontal" autoSaveId="fde-shell-h" className="flex flex-1 min-h-0">
          {!collapsed && (
            <>
              <Panel defaultSize={22} minSize={12} maxSize={45} order={1} id="side">
                <SidePanel active={active} />
              </Panel>
              <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-ring" />
            </>
          )}
          <Panel defaultSize={78} minSize={40} order={2} id="main">
            <PanelGroup direction="vertical" autoSaveId="fde-shell-v" className="h-full">
              <Panel defaultSize={68} minSize={20} order={1} id="editor">
                <EditorArea />
              </Panel>
              <PanelResizeHandle className="h-px bg-border transition-colors hover:bg-ring" />
              <Panel defaultSize={32} minSize={10} order={2} id="terminal">
                <TerminalPanel />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
      <StatusBar />
    </div>
  );
}
