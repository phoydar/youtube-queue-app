'use client';

import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <a href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                Q
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Queue
              </span>
            </a>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="/settings"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
              >
                Settings
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-5">{children}</main>
      </div>
    </ThemeProvider>
  );
}
