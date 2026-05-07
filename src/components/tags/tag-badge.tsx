interface TagBadgeProps {
  name: string;
  color?: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export function TagBadge({ name, color, onClick, removable, onRemove }: TagBadgeProps) {
  const customStyle = color
    ? { backgroundColor: `${color}1a`, color }
    : undefined;
  return (
    <span
      onClick={onClick}
      className="cw-tag"
      style={{ ...customStyle, cursor: onClick ? 'pointer' : 'default' }}
    >
      {name}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            marginLeft: 4,
            color: 'inherit',
            opacity: 0.55,
            cursor: 'pointer',
          }}
        >
          &times;
        </button>
      )}
    </span>
  );
}
