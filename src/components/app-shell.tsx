'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

const CW_MARK = (
  <svg className="cw-mark" viewBox="0 0 32 32" fill="none" width="22" height="22">
    <path d="M8 9 C 8 4, 16 4, 16 11 C 16 18, 24 18, 24 23" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"/>
    <path d="M8 23 C 8 18, 16 18, 16 11" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" opacity="0.55"/>
    <circle cx="8" cy="9" r="1.6" fill="currentColor"/>
    <circle cx="24" cy="23" r="1.6" fill="currentColor"/>
  </svg>
);

const NAV: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: '/', label: 'Library', match: (p) => p === '/' },
  { href: '/clusters', label: 'Threads', match: (p) => p.startsWith('/clusters') },
  { href: '/settings', label: 'Settings', match: (p) => p.startsWith('/settings') },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>('/');
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    update();
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  return (
    <ThemeProvider>
      <header className="cw-header">
        <div className="cw-header-inner">
          <a href="/" className="cw-lockup">
            {CW_MARK}
            <span className="cw-word">Queue</span>
            <span className="cw-word-sub">a personal video library</span>
          </a>
          <nav className="cw-nav">
            <ThemeToggle />
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className={item.match(pathname) ? 'active' : ''}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="cw-main">{children}</main>
    </ThemeProvider>
  );
}
