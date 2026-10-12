import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { SavedFounder, Watchlist, RecentSearch } from '../types';
import { api } from '../services/api';
import { Notice, PageHeader } from '../components/ui';
import { SkeletonBlock } from '../components/SkeletonLoader';
import { queueDiscoverSearch, paramsFromRecent } from '../lib/discoverStore';
import { navigate, paths } from '../lib/router';
import { errorMessage, isKnownLocation, relativeTime } from '../lib/format';

export const OverviewPage: React.FC = () => {
  const [saved, setSaved] = useState<SavedFounder[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([api.getSavedFounders(), api.getWatchlists(), api.getRecentSearches()])
      .then(([s, w, r]) => {
        setSaved(s);
        setWatchlists(w);
        setRecent(r);
      })
      .catch((err) => setError(errorMessage(err, 'Workspace data could not be loaded.')))
      .finally(() => setLoading(false));
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    queueDiscoverSearch({ query: query.trim() });
    navigate(paths.discover());
  };

  const researched = saved.filter((f) => f.researched_at).length;
  const recentUnique = recent.filter(
    (r, i, all) => all.findIndex((x) => x.query === r.query && JSON.stringify(x.filters) === JSON.stringify(r.filters)) === i,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      <PageHeader title="Overview" description="Your saved founders, lists and recent searches on this machine." />

      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search for founders</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search founders, e.g. ex-Google founders in London"
            className="field h-11 pl-9 text-[15px]"
          />
        </label>
        <button type="submit" className="btn btn-primary h-11 px-5">
          Search
        </button>
      </form>

      {error && <Notice>{error}</Notice>}

      {loading ? (
        <div className="panel p-5">
          <SkeletonBlock lines={5} />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-[10px] border border-line bg-surface sm:grid-cols-4 sm:divide-x">
            {[
              ['Saved founders', saved.length],
              ['Researched', researched],
              ['Watchlists', watchlists.length],
              ['With notes', saved.filter((f) => f.notes?.trim()).length],
            ].map(([label, value]) => (
              <div key={label} className="border-line px-5 py-4 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
                <dt className="text-[13px] text-ink-3">{label}</dt>
                <dd className="tabular mt-0.5 text-[24px] font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section aria-labelledby="recent-saved">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="recent-saved" className="text-[18px] font-semibold text-ink">
                  Recently saved
                </h2>
                <a href={paths.watchlists()} className="link text-[14px]">
                  All watchlists
                </a>
              </div>
              {saved.length === 0 ? (
                <p className="panel px-5 py-6 text-[14px] text-ink-3">
                  Nothing saved yet. Use Save on a search result or dossier.
                </p>
              ) : (
                <ul className="panel divide-y divide-line">
                  {saved.slice(0, 6).map((f) => (
                    <li key={f.id}>
                      <a href={paths.profile(f.profile_id)} className="block px-5 py-3.5 hover:bg-surface-2/60">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-ink">{f.name}</span>
                          <span className="shrink-0 text-[12px] text-ink-3">{relativeTime(f.created_at)}</span>
                        </div>
                        <p className="text-[14px] text-ink-2">
                          {f.current_title || 'No title saved'}
                          {f.current_company && <> at {f.current_company}</>}
                          {isKnownLocation(f.location) && <span className="text-ink-3">, {f.location}</span>}
                        </p>
                        {f.notes && <p className="mt-1 line-clamp-1 text-[13px] text-ink-3">{f.notes}</p>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-7">
              <section aria-labelledby="recent-searches">
                <h2 id="recent-searches" className="mb-3 text-[18px] font-semibold text-ink">
                  Recent searches
                </h2>
                {recentUnique.length === 0 ? (
                  <p className="text-[14px] text-ink-3">No searches yet.</p>
                ) : (
                  <ul className="panel divide-y divide-line">
                    {recentUnique.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => {
                            queueDiscoverSearch(paramsFromRecent(r));
                            navigate(paths.discover());
                          }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-surface-2/60"
                        >
                          <span className="truncate text-ink">{r.query}</span>
                          <span className="tabular shrink-0 text-[12px] text-ink-3">{r.result_count} results</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="lists">
                <h2 id="lists" className="mb-3 text-[18px] font-semibold text-ink">
                  Watchlists
                </h2>
                <ul className="panel divide-y divide-line">
                  {watchlists.map((w) => (
                    <li key={w.id}>
                      <a href={paths.watchlists()} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] hover:bg-surface-2/60">
                        <span className="truncate text-ink">{w.name}</span>
                        <span className="tabular text-[12px] text-ink-3">{w.member_count}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
