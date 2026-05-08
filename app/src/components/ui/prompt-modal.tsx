import { useEffect, useRef, useState } from 'react';

interface PromptModalProps {
  open: boolean;
  title: string;
  initialValue?: string;
  okLabel?: string;
  validate?: (value: string) => string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({
  open,
  title,
  initialValue = '',
  okLabel = 'OK',
  validate,
  onSubmit,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
      // focus + select on the next tick so the input has mounted
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  function handleSubmit() {
    const trimmed = value.trim();
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    } else if (!trimmed) {
      setError('Name is required');
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded border border-border bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-modal-title" className="text-sm font-medium">
          {title}
        </h2>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          className="mt-3 w-full rounded border border-border bg-background px-2 py-1 text-xs"
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-foreground px-3 py-1 text-xs text-background hover:opacity-90"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
