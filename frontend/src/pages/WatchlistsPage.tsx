import React, { useState, useEffect } from 'react';
import { Compass, Plus, Trash2, ArrowRight, Bookmark, Building2, MapPin, Loader2 } from 'lucide-react';
import { Watchlist, SavedFounder } from '../types';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';

interface WatchlistsPageProps {
  onOpenDossier: (profileId: string) => void;
  onNavigateToDiscover: () => void;
}

export const WatchlistsPage: React.FC<WatchlistsPageProps> = ({
  onOpenDossier,
  onNavigateToDiscover,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [savedFounders, setSavedFounders] = useState<SavedFounder[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // New watchlist modal / form
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('indigo');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wl, saved] = await Promise.all([
        api.getWatchlists(),
        api.getSavedFounders(),
      ]);
      setWatchlists(wl);
      setSavedFounders(saved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createWatchlist({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        color: newColor,
      });
      setNewName('');
      setNewDesc('');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveSaved = async (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeSavedFounder(profileId);
      setSavedFounders(savedFounders.filter((f) => f.profile_id !== profileId));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFounders = selectedWatchlistId === 'all'
    ? savedFounders
    : savedFounders.filter((f) => f.watchlist_ids.includes(selectedWatchlistId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Watchlists & Saved Candidates</h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize discovered founders across custom sectors, investment theses, or diligence pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Watchlist</span>
        </button>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
        <button
          onClick={() => setSelectedWatchlistId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedWatchlistId === 'all'
              ? 'bg-white/10 text-white font-semibold'
              : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          }`}
        >
          All Saved ({savedFounders.length})
        </button>

        {watchlists.map((wl) => (
          <button
            key={wl.id}
            onClick={() => setSelectedWatchlistId(wl.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedWatchlistId === wl.id
                ? 'bg-white/10 text-white font-semibold'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
          >
            <span>{wl.name}</span>
            <span className="text-[10px] font-mono px-1.5 rounded bg-white/5 text-slate-400">
              {wl.member_count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        </div>
      ) : filteredFounders.length === 0 ? (
        <EmptyState
          type="watchlist"
          title="Watchlist is Empty"
          description="You haven't saved any founders to this watchlist yet. Use the Discover portal to search and add promising founders."
          actionText="Discover Founders"
          onAction={onNavigateToDiscover}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFounders.map((f) => (
            <div
              key={f.id}
              onClick={() => onOpenDossier(f.profile_id)}
              className="glass-card glass-card-hover rounded-xl p-5 border border-white/5 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {f.name}
                  </h3>
                  <button
                    onClick={(e) => handleRemoveSaved(f.profile_id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-white/5"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-indigo-300 mb-2">
                  {f.current_title || 'Founder'} {f.current_company && `at ${f.current_company}`}
                </p>

                {f.headline && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {f.headline}
                  </p>
                )}

                {f.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{f.location}</span>
                  </div>
                )}

                {f.notes && (
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-300 line-clamp-2 mb-3">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">Note:</span>
                    {f.notes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono text-slate-500">
                  Added {f.created_at.slice(0, 10)}
                </span>
                <span className="text-indigo-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Create New Watchlist</h3>
            <form onSubmit={handleCreateWatchlist} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. European AI Spinouts"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Founders emerging from top labs in Europe"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  {creating ? 'Creating...' : 'Create Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
