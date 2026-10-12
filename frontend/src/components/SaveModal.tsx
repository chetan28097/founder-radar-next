import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { FounderProfile, Watchlist } from '../types';
import { api } from '../services/api';
import { errorMessage } from '../lib/format';

interface SaveModalProps {
  profile: FounderProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({ profile, isOpen, onClose, onSuccess }) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [newWatchlistName, setNewWatchlistName] = useState<string>('');
  const [showNewWatchlist, setShowNewWatchlist] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    api
      .getWatchlists()
      .then((data) => {
        setWatchlists(data);
        setSelectedWatchlist((current) => current || data[0]?.id || '');
      })
      .catch((err) => setError(errorMessage(err, 'Could not load watchlists.')));
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    try {
      const created = await api.createWatchlist({ name: newWatchlistName.trim() });
      setWatchlists([...watchlists, created]);
      setSelectedWatchlist(created.id);
      setNewWatchlistName('');
      setShowNewWatchlist(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not create the watchlist.'));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
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
      setError(errorMessage(err, 'Could not save this founder.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-dialog-title"
        className="relative w-full max-w-md rounded-t-xl border border-line bg-surface p-5 shadow-card outline-none sm:rounded-xl sm:p-6"
      >
        <button onClick={onClose} className="btn btn-quiet absolute right-3 top-3 px-2" aria-label="Close">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <h2 id="save-dialog-title" className="pr-8 text-[18px] font-semibold text-ink">
          Save {profile.name}
        </h2>
        <p className="mt-1 text-[14px] text-ink-2">Add to a watchlist. Notes stay on this machine in SQLite.</p>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="save-watchlist" className="text-[13px] font-medium text-ink-2">
                Watchlist
              </label>
              <button
                type="button"
                onClick={() => setShowNewWatchlist(!showNewWatchlist)}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                New list
              </button>
            </div>
            {showNewWatchlist && (
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  placeholder="List name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist()}
                  className="field"
                  autoFocus
                />
                <button type="button" onClick={handleCreateWatchlist} className="btn btn-secondary">
                  Create
                </button>
              </div>
            )}
            <select
              id="save-watchlist"
              value={selectedWatchlist}
              onChange={(e) => setSelectedWatchlist(e.target.value)}
              className="field"
            >
              <option value="">No list</option>
              {watchlists.map((wl) => (
                <option key={wl.id} value={wl.id}>
                  {wl.name} ({wl.member_count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="save-notes" className="mb-1.5 block text-[13px] font-medium text-ink-2">
              Note <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <textarea
              id="save-notes"
              rows={3}
              placeholder="Why this founder is worth a look"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-quiet">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
