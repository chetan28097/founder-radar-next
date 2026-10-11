import React, { useState, useEffect } from 'react';
import { X, Bookmark, Plus, Loader2 } from 'lucide-react';
import { FounderProfile, Watchlist } from '../types';
import { api } from '../services/api';

interface SaveModalProps {
  profile: FounderProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [newWatchlistName, setNewWatchlistName] = useState<string>('');
  const [showNewWatchlist, setShowNewWatchlist] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getWatchlists()
        .then((data) => {
          setWatchlists(data);
          if (data.length > 0 && !selectedWatchlist) {
            setSelectedWatchlist(data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    try {
      const created = await api.createWatchlist({
        name: newWatchlistName.trim(),
        description: 'Custom research watchlist',
        color: 'indigo',
      });
      setWatchlists([...watchlists, created]);
      setSelectedWatchlist(created.id);
      setNewWatchlistName('');
      setShowNewWatchlist(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveFounder({
        profile_id: profile.id,
        name: profile.name,
        headline: profile.headline,
        current_company: profile.current_company,
        current_title: profile.current_title,
        location: profile.location,
        watchlist_id: selectedWatchlist || undefined,
        notes: notes.trim() || undefined,
        tags: profile.tags,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Save to Watchlist</h3>
            <p className="text-xs text-slate-400">Organize {profile.name} in your research pipeline</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Watchlist Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Target Watchlist</label>
              <button
                type="button"
                onClick={() => setShowNewWatchlist(!showNewWatchlist)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New List</span>
              </button>
            </div>

            {showNewWatchlist ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Watchlist name..."
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateWatchlist}
                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Create
                </button>
              </div>
            ) : null}

            <select
              value={selectedWatchlist}
              onChange={(e) => setSelectedWatchlist(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {watchlists.map((wl) => (
                <option key={wl.id} value={wl.id} className="bg-slate-900 text-slate-200">
                  {wl.name} ({wl.member_count} saved)
                </option>
              ))}
            </select>
          </div>

          {/* Research Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Initial Research Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Followed their work at Stripe; strong infra credentials..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
