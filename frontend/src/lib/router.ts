import { useEffect, useState } from 'react';

/*
  Minimal hash router. Routes:
    #/                 landing
    #/overview         workspace overview
    #/discover         founder discovery
    #/founders/:id     founder dossier
    #/watchlists       saved founders and lists
    #/research         AI research (optional ?founder=:id)
    #/settings         integration health
    #/built-with       NeatHack tools showcase
*/
export type Route =
  | { name: 'landing' }
  | { name: 'overview' }
  | { name: 'discover' }
  | { name: 'profile'; id: string }
  | { name: 'watchlists' }
  | { name: 'research'; founderId?: string }
  | { name: 'settings' }
  | { name: 'built-with' }
  | { name: 'not-found'; path: string };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'landing' };
  switch (parts[0]) {
    case 'overview':
      return { name: 'overview' };
    case 'discover':
      return { name: 'discover' };
    case 'founders':
      return parts[1] ? { name: 'profile', id: decodeURIComponent(parts[1]) } : { name: 'discover' };
    case 'watchlists':
      return { name: 'watchlists' };
    case 'research':
      return { name: 'research', founderId: params.get('founder') || undefined };
    case 'settings':
      return { name: 'settings' };
    case 'built-with':
      return { name: 'built-with' };
    default:
      return { name: 'not-found', path };
  }
}

export const paths = {
  landing: () => '#/',
  overview: () => '#/overview',
  discover: () => '#/discover',
  profile: (id: string) => `#/founders/${encodeURIComponent(id)}`,
  watchlists: () => '#/watchlists',
  research: (founderId?: string) => (founderId ? `#/research?founder=${encodeURIComponent(founderId)}` : '#/research'),
  settings: () => '#/settings',
  builtWith: () => '#/built-with',
};

export function navigate(href: string) {
  if (window.location.hash === href) return;
  window.location.hash = href;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
