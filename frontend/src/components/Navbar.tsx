import React, { useState } from 'react';
import { Menu, X, Settings2 } from 'lucide-react';
import { Route, paths } from '../lib/router';

interface NavbarProps {
  route: Route;
}

const LINKS: { label: string; href: string; match: Route['name'][] }[] = [
  { label: 'Overview', href: paths.overview(), match: ['overview'] },
  { label: 'Discover', href: paths.discover(), match: ['discover', 'profile'] },
  { label: 'Watchlists', href: paths.watchlists(), match: ['watchlists'] },
  { label: 'Research', href: paths.research(), match: ['research'] },
];

export const Navbar: React.FC<NavbarProps> = ({ route }) => {
  const [open, setOpen] = useState(false);
  const isActive = (match: Route['name'][]) => match.includes(route.name);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-surface focus:px-3 focus:py-1.5"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href={paths.landing()} className="flex items-center gap-2.5 text-ink" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
            <path d="M12 12 L19.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16.2" cy="9" r="1.6" fill="currentColor" />
          </svg>
          <span className="text-[16px] font-semibold tracking-tight">Founder Radar</span>
        </a>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={isActive(l.match) ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors ${
                isActive(l.match) ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2/70 hover:text-ink'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={paths.builtWith()}
            aria-current={route.name === 'built-with' ? 'page' : undefined}
            className={`hidden rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors sm:inline-block ${
              route.name === 'built-with' ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            Built with
          </a>
          <a
            href={paths.settings()}
            aria-label="Settings and integration status"
            title="Settings and integration status"
            aria-current={route.name === 'settings' ? 'page' : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              route.name === 'settings' ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`}
          >
            <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-line bg-paper px-4 pb-3 pt-2 md:hidden" aria-label="Mobile">
          {[...LINKS, { label: 'Built with', href: paths.builtWith(), match: ['built-with'] as Route['name'][] }].map(
            (l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.match) ? 'page' : undefined}
                className={`block rounded-md px-3 py-2.5 text-[15px] ${
                  isActive(l.match) ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2'
                }`}
              >
                {l.label}
              </a>
            ),
          )}
        </nav>
      )}
    </header>
  );
};
