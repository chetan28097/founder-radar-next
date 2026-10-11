import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Compass, Sparkles, ArrowRight, Clock, Building2, UserCheck, ShieldAlert } from 'lucide-react';
import { SavedFounder, Watchlist, RecentSearch, FounderProfile, NavigationTab } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenDossier: (profileId: string) => void;
  onRunSearch: (query: string, employer?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onOpenDossier,
  onRunSearch,
}) => {
  const [savedFounders, setSavedFounders] = useState<SavedFounder[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickQuery, setQuickQuery] = useState<string>('');

  useEffect(() => {
    Promise.all([
      api.getSavedFounders().catch(() => []),
      api.getWatchlists().catch(() => []),
      api.getRecentSearches().catch(() => []),
    ])
      .then(([saved, wl, recents]) => {
        setSavedFounders(saved);
        setWatchlists(wl);
        setRecentSearches(recents);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onRunSearch(quickQuery.trim());
      onNavigate('discover');
    }
  };

  const samplePresets = [
    { label: 'Ex-Stripe Founders', query: 'Ex-Stripe founders', employer: 'Stripe' },
    { label: 'AI Infrastructure', query: 'AI and infrastructure founders', employer: 'Google' },
    { label: 'Fintech Spinouts in London', query: 'Fintech founders in London', employer: 'Revolut' },
    { label: 'Ex-Meta Leaders', query: 'Ex-Meta founders', employer: 'Meta' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track emerging founder signals, active watchlists, and recent investigation queries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('discover')}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Founders</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Based on Stored Data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{savedFounders.length}</span>
            <span className="text-xs text-slate-400 block">Saved Founders in Workspace</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{watchlists.length}</span>
            <span className="text-xs text-slate-400 block">Active Watchlists</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{recentSearches.length}</span>
            <span className="text-xs text-slate-400 block">Recent Search Queries</span>
          </div>
        </div>
      </div>

      {/* Quick Search Launcher */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Launch Founder Investigation</span>
        </h2>
        <form onSubmit={handleQuickSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Find founders who previously worked at Stripe and recently transitioned..."
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="text-slate-500">Quick Filters:</span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onRunSearch(preset.query, preset.employer);
                onNavigate('discover');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Recently Saved Founders & Watchlists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Profiles (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Recently Saved Profiles</span>
            </h2>
            <button
              onClick={() => onNavigate('watchlists')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all watchlists →
            </button>
          </div>

          {savedFounders.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-white/5">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">No saved founders yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Discover founders in the search portal and save them to watchlists to organize your research.
              </p>
              <button
                onClick={() => onNavigate('discover')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
              >
                Go to Discover
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedFounders.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => onOpenDossier(f.profile_id)}
                  className="glass-card glass-card-hover rounded-xl p-4 border border-white/5 cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400">
                        {f.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {f.current_title || 'Founder'} {f.current_company && `· ${f.current_company}`}
                      </p>
                    </div>
                  </div>
                  {f.notes && (
                    <p className="text-xs text-slate-300 bg-white/[0.02] p-2 rounded border border-white/5 line-clamp-2">
                      {f.notes}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                    <span>{f.location || 'Location Unknown'}</span>
                    <span className="text-indigo-400 hover:underline">Open Dossier →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlists & Recent Searches Column (1 Col) */}
        <div className="space-y-6">
          {/* Watchlists */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Watchlists</span>
            </h2>
            <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-2">
              {watchlists.map((wl) => (
                <div
                  key={wl.id}
                  onClick={() => onNavigate('watchlists')}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{wl.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{wl.description}</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                    {wl.member_count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Searches</span>
            </h2>
            <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-2">
              {recentSearches.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">No recent searches yet</p>
              ) : (
                recentSearches.slice(0, 5).map((rs) => (
                  <div
                    key={rs.id}
                    onClick={() => {
                      onRunSearch(rs.query, rs.filters?.previous_employer);
                      onNavigate('discover');
                    }}
                    className="p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer flex items-center justify-between text-xs text-slate-300 transition-colors"
                  >
                    <span className="line-clamp-1">{rs.query || 'Founders search'}</span>
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                      {rs.result_count} results
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
