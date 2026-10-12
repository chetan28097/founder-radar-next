import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, Loader2 } from 'lucide-react';
import { FounderProfile, RecentSearch } from '../types';
import { api } from '../services/api';
import { FounderCard } from '../components/FounderCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { SaveModal } from '../components/SaveModal';
import { Notice, PageHeader } from '../components/ui';
import { errorMessage, relativeTime } from '../lib/format';
import { EMPTY_PARAMS, SearchParams, paramsFromRecent, takePendingSearch } from '../lib/discoverStore';

interface ResultsState {
  params: SearchParams;
  profiles: FounderProfile[];
  totalCount?: number;
  nextCursor?: string;
  interpretation?: string;
  appliedFilters: Record<string, unknown>;
}

// Kept for the lifetime of the tab so returning from a dossier restores the list
// instead of spending another Crustdata request.
let cachedForm: SearchParams = EMPTY_PARAMS;
let cachedResults: ResultsState | null = null;

const PRESETS: { label: string; params: Partial<SearchParams> }[] = [
  { label: 'Ex-Stripe founders', params: { employer: 'Stripe' } },
  { label: 'Ex-Google founders', params: { employer: 'Google' } },
  { label: 'Founders in Bengaluru', params: { location: 'Bengaluru' } },
  { label: 'Ex-Revolut founders in London', params: { employer: 'Revolut', location: 'London' } },
  { label: 'Heads of Product in Bengaluru', params: { role: 'Head of Product', location: 'Bengaluru' } },
  { label: 'Staff engineers, ex-Google', params: { role: 'Staff Engineer', employer: 'Google' } },
];

const FILTER_LABELS: Record<string, string> = {
  current_title: 'Current title',
  previous_employer: 'Past employer',
  location: 'Location',
  country: 'Country',
};

export const DiscoverPage: React.FC = () => {
  const [form, setForm] = useState<SearchParams>(cachedForm);
  const [results, setResults] = useState<ResultsState | null>(cachedResults);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingProfile, setSavingProfile] = useState<FounderProfile | null>(null);

  useEffect(() => {
    cachedForm = form;
  }, [form]);
  useEffect(() => {
    cachedResults = results;
  }, [results]);

  const runSearch = async (params: SearchParams, cursor?: string) => {
    const append = Boolean(cursor);
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.searchFounders({
        query: params.query.trim() || undefined,
        employer: params.employer.trim() || undefined,
        role: params.role.trim() || undefined,
        location: params.location.trim() || undefined,
        country: params.country.trim() || undefined,
        limit: params.limit,
        cursor,
      });
      setResults((prev) => {
        const base = append && prev ? prev.profiles : [];
        const seen = new Set(base.map((p) => p.id));
        const merged = [...base, ...res.profiles.filter((p) => !seen.has(p.id))];
        return {
          params,
          profiles: merged,
          totalCount: res.total_count,
          nextCursor: res.next_cursor,
          interpretation: res.query_interpretation,
          appliedFilters: res.applied_filters || {},
        };
      });
      if (!append) api.getRecentSearches().then(setRecent).catch(() => undefined);
    } catch (err) {
      setError(errorMessage(err, 'The search failed.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    api.getSavedFounders().then((s) => setSavedIds(new Set(s.map((f) => f.profile_id)))).catch(() => undefined);
    api.getRecentSearches().then(setRecent).catch(() => undefined);
    const pending = takePendingSearch();
    if (pending) {
      const params = { ...EMPTY_PARAMS, ...pending };
      setForm(params);
      runSearch(params);
    }
    // runSearch is stable in behaviour; this effect intentionally runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: keyof SearchParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: key === 'limit' ? Number(e.target.value) : e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(form);
  };

  const applyPreset = (preset: Partial<SearchParams>) => {
    const params = { ...EMPTY_PARAMS, limit: form.limit, ...preset };
    setForm(params);
    runSearch(params);
  };

  const reset = () => {
    setForm(EMPTY_PARAMS);
    setResults(null);
    setError(null);
  };

  const filterChips = Object.entries(results?.appliedFilters || {}).filter(([k]) => k !== 'cursor');
  const recentUnique = recent.filter(
    (r, i, all) => all.findIndex((x) => x.query === r.query && JSON.stringify(x.filters) === JSON.stringify(r.filters)) === i,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Discover founders and professionals"
        description="Search Crustdata's people index by current title, past employer and location. Founder is the default title; change it to find any role. Describe who you are looking for, or set filters directly."
      />

      <form onSubmit={submit} className="panel space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Describe the founders you want to find</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="text"
              value={form.query}
              onChange={update('query')}
              placeholder="e.g. founders who previously worked at Stripe in San Francisco"
              className="field h-11 pl-9 text-[15px]"
            />
          </label>
          <button type="submit" disabled={loading} className="btn btn-primary h-11 px-5">
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {(
            [
              ['employer', 'Past employer', 'Stripe, Google'],
              ['role', 'Current title contains', 'Founder'],
              ['location', 'Location', 'London, Bengaluru'],
              ['country', 'Country', 'India'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
              <input value={form[key]} onChange={update(key)} placeholder={placeholder} className="field" />
            </label>
          ))}
          <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
            <label className="block flex-1">
              <span className="mb-1 block text-[13px] font-medium text-ink-2">Per page</span>
              <select value={form.limit} onChange={update('limit')} className="field">
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={reset} className="btn btn-secondary px-2.5" title="Clear filters and results">
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">Reset</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-[13px] text-ink-3">Try</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={loading}
              onClick={() => applyPreset(p.params)}
              className="rounded-md border border-line px-2.5 py-1 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <Notice
          action={
            <button className="btn btn-secondary" onClick={() => runSearch(results?.params || form)}>
              Try again
            </button>
          }
        >
          <strong className="font-semibold">Search failed.</strong> {error}
        </Notice>
      )}

      {results && !loading && (
        <div className="flex flex-col gap-2 text-[13px] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-ink-3">Filters sent to Crustdata:</span>
            {filterChips.map(([k, v]) => (
              <span key={k} className="rounded-[4px] bg-surface-2 px-1.5 py-px">
                {FILTER_LABELS[k] || k}: <span className="font-medium text-ink">{String(v)}</span>
              </span>
            ))}
          </div>
          <span className="tabular shrink-0">
            {results.profiles.length} shown
            {typeof results.totalCount === 'number' && <> of {results.totalCount.toLocaleString()} matches</>}
          </span>
        </div>
      )}

      {loading ? (
        <div className="panel overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results && results.profiles.length === 0 ? (
        <EmptyState
          title="No one matched"
          description="Crustdata returned no profiles for these filters. Try a broader location, drop the past employer, or search by country."
          actionText="Clear filters"
          onAction={reset}
        />
      ) : results ? (
        <>
          <div className="panel overflow-hidden">
            {results.profiles.map((profile) => (
              <FounderCard
                key={profile.id}
                profile={profile}
                isSaved={savedIds.has(profile.id)}
                onSave={setSavingProfile}
              />
            ))}
          </div>
          {results.nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={() => runSearch(results.params, results.nextCursor)}
                disabled={loadingMore}
                className="btn btn-secondary"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Load more
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="eyebrow mb-2">How search works</h2>
            <ul className="space-y-2 text-[14px] text-ink-2">
              <li>Each search is one Crustdata request. Nothing runs until you press Search.</li>
              <li>Results only include people whose current title contains the role you set (Founder by default).</li>
              <li>Leaving a company is never treated as evidence of founding one.</li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow mb-2">Recent searches</h2>
            {recentUnique.length === 0 ? (
              <p className="text-[14px] text-ink-3">No searches yet.</p>
            ) : (
              <ul className="panel divide-y divide-line">
                {recentUnique.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => applyPreset(paramsFromRecent(r))}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] hover:bg-surface-2/60"
                    >
                      <span className="truncate text-ink">{r.query}</span>
                      <span className="tabular shrink-0 text-[12px] text-ink-3">
                        {r.result_count} results, {relativeTime(r.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <SaveModal
        profile={savingProfile}
        isOpen={Boolean(savingProfile)}
        onClose={() => setSavingProfile(null)}
        onSuccess={() => savingProfile && setSavedIds((prev) => new Set([...prev, savingProfile.id]))}
      />
    </div>
  );
};
