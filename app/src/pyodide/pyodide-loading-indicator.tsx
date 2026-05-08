import { usePyodide } from './use-pyodide';

interface Props {
  variant?: 'full' | 'compact';
}

export function PyodideLoadingIndicator({ variant = 'full' }: Props) {
  const { status, error } = usePyodide();

  const dotClass =
    status === 'ready'
      ? 'bg-emerald-500'
      : status === 'error'
        ? 'bg-red-500'
        : 'bg-amber-500 animate-pulse';

  const label =
    status === 'ready'
      ? variant === 'compact'
        ? 'Python: ready'
        : 'Python ready'
      : status === 'error'
        ? variant === 'compact'
          ? 'Python: error'
          : `Python failed to load: ${error?.message ?? 'unknown error'}`
        : variant === 'compact'
          ? 'Python: loading'
          : 'Loading Python…';

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}
