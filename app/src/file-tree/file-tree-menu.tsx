import { useEffect, useRef } from 'react';

export interface MenuAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface FileTreeMenuProps {
  x: number;
  y: number;
  actions: MenuAction[];
  onClose: () => void;
}

export function FileTreeMenu({ x, y, actions, onClose }: FileTreeMenuProps) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <ul
      ref={ref}
      role="menu"
      style={{ left: x, top: y }}
      className="fixed z-40 min-w-[140px] rounded border border-border bg-background py-1 shadow-md"
    >
      {actions.map((action) => (
        <li key={action.label} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`block w-full px-3 py-1 text-left text-xs hover:bg-muted ${
              action.destructive ? 'text-red-600' : ''
            }`}
          >
            {action.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
