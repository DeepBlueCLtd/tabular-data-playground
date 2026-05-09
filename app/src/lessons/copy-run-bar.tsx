import { useCallback, useState } from 'react';
import {
  setLastRunSource,
  useLastRunSource,
  useTerminalRunning,
  useTerminalSubmit,
} from '@/terminal/terminal-submit-store';

interface Props {
  source: string;
}

export function CopyRunBar({ source }: Props) {
  const submit = useTerminalSubmit();
  const running = useTerminalRunning();
  const lastRun = useLastRunSource();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const isActive = lastRun === source;
  const isInFlight = running && isActive;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopyState('copied');
      window.setTimeout(() => setCopyState((s) => (s === 'copied' ? 'idle' : s)), 1000);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState((s) => (s === 'error' ? 'idle' : s)), 1500);
    }
  }, [source]);

  const onRun = useCallback(() => {
    if (!submit) return;
    setLastRunSource(source);
    void submit(source);
  }, [submit, source]);

  const runDisabled = submit === null || running;
  const runLabel = isInFlight ? 'Running…' : 'Run';
  const runTitle =
    submit === null
      ? 'Terminal not ready (Python is loading)'
      : running && !isInFlight
        ? 'Another command is running'
        : undefined;

  return (
    <div data-lesson-code-active={isActive ? 'true' : 'false'} className="flex gap-1">
      <button
        type="button"
        onClick={() => {
          void onCopy();
        }}
        className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
      >
        {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={onRun}
        disabled={runDisabled}
        title={runTitle}
        className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
      >
        {runLabel}
      </button>
    </div>
  );
}
