'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { key: 'light' as const, icon: Sun, label: 'Light' },
    { key: 'dark' as const, icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="cw-theme-toggle" role="group" aria-label="Theme">
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={theme === key ? 'active' : ''}
          title={label}
          aria-label={label}
          aria-pressed={theme === key}
        >
          <Icon size={13} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
