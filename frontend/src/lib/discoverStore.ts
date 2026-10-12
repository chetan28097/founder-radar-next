import { RecentSearch } from '../types';

export interface SearchParams {
  query: string;
  employer: string;
  role: string;
  location: string;
  country: string;
  limit: number;
}

export const EMPTY_PARAMS: SearchParams = { query: '', employer: '', role: 'Founder', location: '', country: '', limit: 10 };

// One-shot hand-off from other pages (Overview quick search, recent searches) to Discover
let pending: Partial<SearchParams> | null = null;

export function queueDiscoverSearch(params: Partial<SearchParams>) {
  pending = params;
}

export function takePendingSearch(): Partial<SearchParams> | null {
  const p = pending;
  pending = null;
  return p;
}

/** The backend stores the typed query, or echoes a filter value when no query was typed. */
export function paramsFromRecent(r: RecentSearch): Partial<SearchParams> {
  const f = r.filters || {};
  const isEcho = !r.query || r.query === 'Founders' || r.query === f.previous_employer || r.query === f.current_title;
  return {
    query: isEcho ? '' : r.query,
    employer: f.previous_employer || '',
    location: f.location || '',
    country: f.country || '',
    role: f.current_title || 'Founder',
  };
}
