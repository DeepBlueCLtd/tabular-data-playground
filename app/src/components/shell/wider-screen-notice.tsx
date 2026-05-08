import { useEffect, useState } from 'react';

const MIN_RECOMMENDED_PX = 900;

export function WiderScreenNotice() {
  const [narrow, setNarrow] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MIN_RECOMMENDED_PX,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < MIN_RECOMMENDED_PX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!narrow || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-b border-border bg-amber-500/15 px-3 py-1 text-xs text-foreground"
    >
      <span>
        Best viewed on a wider screen (≥ {MIN_RECOMMENDED_PX} px). Mobile / narrow layouts are not
        supported in v1.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss wider-screen notice"
        className="opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
