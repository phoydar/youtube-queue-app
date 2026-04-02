interface TagBadgeProps {
  name: string;
  color: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export function TagBadge({ name, color, onClick, removable, onRemove }: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-px text-[10px] font-medium"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {name}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          &times;
        </button>
      )}
    </span>
  );
}
