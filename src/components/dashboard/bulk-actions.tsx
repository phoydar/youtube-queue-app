'use client';

import {
  CheckSquare,
  Square,
  ArrowUp,
  ArrowRight,
  ArrowDown,
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
    <div className="cw-bulk-bar" style={{ marginBottom: 16 }}>
      <button
        className="cw-icon-btn"
        style={{ opacity: 1 }}
        onClick={allSelected ? onDeselectAll : onSelectAll}
        title={allSelected ? 'Deselect all' : 'Select all'}
      >
        {allSelected ? (
          <CheckSquare size={14} strokeWidth={1.75} />
        ) : (
          <Square size={14} strokeWidth={1.75} />
        )}
      </button>
      <span className="count">{selectedIds.length} selected</span>

      <span style={{ width: 1, height: 14, background: 'var(--border-cw)' }} />

      <button
        className="cw-icon-btn high"
        style={{ opacity: 1 }}
        onClick={() => onAction({ priority: 'HIGH' })}
        title="Priority High"
      >
        <ArrowUp size={14} strokeWidth={1.75} />
      </button>
      <button
        className="cw-icon-btn med"
        style={{ opacity: 1 }}
        onClick={() => onAction({ priority: 'MEDIUM' })}
        title="Priority Medium"
      >
        <ArrowRight size={14} strokeWidth={1.75} />
      </button>
      <button
        className="cw-icon-btn low"
        style={{ opacity: 1 }}
        onClick={() => onAction({ priority: 'LOW' })}
        title="Priority Low"
      >
        <ArrowDown size={14} strokeWidth={1.75} />
      </button>

      <span style={{ width: 1, height: 14, background: 'var(--border-cw)' }} />

      <button
        className="cw-icon-btn"
        style={{ opacity: 1, color: 'var(--moss)' }}
        onClick={() => onAction({ watched: true })}
        title="Mark watched"
      >
        <Eye size={14} strokeWidth={1.75} />
      </button>
      <button
        className="cw-icon-btn"
        style={{ opacity: 1 }}
        onClick={() => onAction({ watched: false })}
        title="Mark unwatched"
      >
        <EyeOff size={14} strokeWidth={1.75} />
      </button>

      <div className="spacer" />

      <button className="cw-btn-ghost" onClick={onCancel}>
        <X size={11} strokeWidth={2} />
        Cancel
      </button>
    </div>
  );
}
