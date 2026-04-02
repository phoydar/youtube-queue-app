'use client';

import {
  CheckSquare,
  Square,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAction: (action: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAction,
  onCancel,
}: BulkActionsProps) {
  if (selectedIds.length === 0) return null;

  const allSelected = selectedIds.length === totalCount;

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-border bg-secondary/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-muted-foreground hover:text-foreground"
        >
          {allSelected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="text-xs font-medium text-foreground">
          {selectedIds.length} selected
        </span>
      </div>

      <span className="h-3 w-px bg-border" />

      <button
        onClick={() => onAction({ priority: 'HIGH' })}
        title="High"
        className="rounded-md p-1 text-red-400 transition-colors hover:bg-muted"
      >
        <ArrowUpCircle className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onAction({ priority: 'MEDIUM' })}
        title="Medium"
        className="rounded-md p-1 text-amber-400 transition-colors hover:bg-muted"
      >
        <ArrowRightCircle className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onAction({ priority: 'LOW' })}
        title="Low"
        className="rounded-md p-1 text-sky-400 transition-colors hover:bg-muted"
      >
        <ArrowDownCircle className="h-3.5 w-3.5" />
      </button>

      <span className="h-3 w-px bg-border" />

      <button
        onClick={() => onAction({ watched: true })}
        title="Mark Watched"
        className="rounded-md p-1 text-emerald-400 transition-colors hover:bg-muted"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onAction({ watched: false })}
        title="Mark Unwatched"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>

      <div className="ml-auto">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}
