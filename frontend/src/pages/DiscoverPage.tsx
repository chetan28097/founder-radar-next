import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Building2, MapPin, Briefcase, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { FounderProfile, SearchResponse } from '../types';
import { api } from '../services/api';
import { FounderCard } from '../components/FounderCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { SaveModal } from '../components/SaveModal';

interface DiscoverPageProps {
  initialQuery?: string;
  initialEmployer?: string;
  onOpenDossier: (profileId: string) => void;
  onDraftOutreach: (profile: FounderProfile) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  initialQuery = '',
  initialEmployer = '',
  onOpenDossier,
  onDraftOutreach,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [employer, setEmployer] = useState<string>(initialEmployer);
  const [role, setRole] = useState<string>('Founder');
  const [location, setLocation] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const [profiles, setProfiles] = useState<FounderProfile[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [queryInterpretation, setQueryInterpretation] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Save Modal State
  const [savingProfile, setSavingProfile] = useState<FounderProfile | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Quick preset pills
  const presets = [
    { label: 'Ex-Stripe Founders', employer: 'Stripe', role: 'Founder' },
    { label: 'Ex-Google AI Builders', employer: 'Google', role: 'Founder' },
    { label: 'Ex-Meta Leaders in SF', employer: 'Meta', location: 'San Francisco' },
    { label: 'Fintech Spinouts (London)', employer: 'Revolut', location: 'London' },
  ];

  const executeSearch = async (newCursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchFounders({
        query: query.trim() || undefined,
        employer: employer.trim() || undefined,
        role: role.trim() || undefined,
        location: location.trim() || undefined,
        limit,
        cursor: newCursor,
      });

      setProfiles(res.profiles);
      setTotalCount(res.total_count);
      setNextCursor(res.next_cursor);
      setQueryInterpretation(res.query_interpretation);
    } catch (err: any) {
      setError(err.message || 'Failed to search founders from Crustdata API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
    // Fetch saved profiles to highlight saved status
    api.getSavedFounders().then((saved) => {
      setSavedIds(new Set(saved.map((s) => s.profile_id)));
    }).catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(undefined);
    executeSearch();
  };

  const handleResetFilters = () => {
    setQuery('');
    setEmployer('');
    setRole('Founder');
    setLocation('');
    setCursor(undefined);
    setLimit(10);
  };

  const handleApplyPreset = (p: typeof presets[0]) => {
    if (p.employer) setEmployer(p.employer);
    if (p.role) setRole(p.role);
    if (p.location) setLocation(p.location);
    setQuery(`Ex-${p.employer || ''} ${p.role || 'founders'} ${p.location ? 'in ' + p.location : ''}`.trim());
    setTimeout(() => executeSearch(), 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Discover Founders</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search real professional profiles via Crustdata People Search, identify career transitions, and investigate candidates.
        </p>
      </div>

      {/* Search Input & Filter Controls */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
        {/* Main Natural Language Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Find founders who previously worked at Stripe and recently transitioned..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Explicit Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Previous / Target Employer</label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Stripe, Google, Meta"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Current Title / Role</label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Founder, Co-Founder, CEO"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Location / Country</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. San Francisco, London, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Results Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={5} className="bg-slate-900">5 profiles</option>
                <option value={10} className="bg-slate-900">10 profiles</option>
                <option value={20} className="bg-slate-900">20 profiles</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preset Query Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Target Queries:</span>
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Interpretation Banner & Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          {queryInterpretation ? (
            <span className="font-mono bg-white/[0.02] border border-white/5 px-3 py-1 rounded-md text-indigo-300">
              Query: {queryInterpretation}
            </span>
          ) : (
            <span>Showing verified candidate profiles from Crustdata People Search</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalCount !== undefined && (
            <span className="font-mono text-slate-300 font-medium">
              {totalCount.toLocaleString()} matching in global database
            </span>
          )}
          <span>·</span>
          <span>{profiles.length} returned on page</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          <strong>Search Error:</strong> {error}
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          type="search"
          title="No Matching Founders Found"
          description="Try broadening your employer, title, or location criteria to surface candidates across global geographies."
          actionText="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <FounderCard
              key={profile.id}
              profile={profile}
              isSaved={savedIds.has(profile.id)}
              onOpenDossier={onOpenDossier}
              onSave={(p) => setSavingProfile(p)}
              onDraftOutreach={onDraftOutreach}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {nextCursor && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => executeSearch(nextCursor)}
            className="px-5 py-2.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors flex items-center gap-2 shadow-lg"
          >
            <span>Load More Results</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Save Modal */}
      <SaveModal
        profile={savingProfile}
        isOpen={Boolean(savingProfile)}
        onClose={() => setSavingProfile(null)}
        onSuccess={() => {
          if (savingProfile) {
            setSavedIds(new Set([...savedIds, savingProfile.id]));
          }
        }}
      />
    </div>
  );
};
