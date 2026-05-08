import { cn } from '@/lib/utils';
import { BookIcon, FilesIcon } from './icons';

export type ActivityEntry = 'lessons' | 'files';

interface ActivityBarProps {
  active: ActivityEntry;
  collapsed: boolean;
  onSelect: (entry: ActivityEntry) => void;
}

interface Item {
  id: ActivityEntry;
  label: string;
  Icon: typeof BookIcon;
}

const ITEMS: readonly Item[] = [
  { id: 'lessons', label: 'Lessons', Icon: BookIcon },
  { id: 'files', label: 'Files', Icon: FilesIcon },
];

export function ActivityBar({ active, collapsed, onSelect }: ActivityBarProps) {
  return (
    <nav
      aria-label="Activity bar"
      className="flex w-12 flex-col items-center gap-1 border-r border-border bg-muted/30 py-2"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = !collapsed && id === active;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => onSelect(id)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive && 'bg-accent text-foreground',
            )}
          >
            <Icon />
          </button>
        );
      })}
    </nav>
  );
}
