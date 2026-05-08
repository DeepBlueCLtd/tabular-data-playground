import { useCallback, useState } from 'react';
import { useTerminalSubmit } from '@/terminal/terminal-submit-store';

interface Props {
  source: string;
}

export function CopyRunBar({ source }: Props) {
  const submit = useTerminalSubmit();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

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
    void submit(source);
  }, [submit, source]);

  return (
    <>
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
        disabled={submit === null}
        title={submit === null ? 'Terminal not ready (Python is loading)' : undefined}
        className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
      >
        Run
      </button>
    </>
  );
}
