import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import { Watchlist, SavedFounder } from '../types';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonLoader';
import { Notice, PageHeader } from '../components/ui';
import { navigate, paths } from '../lib/router';
import { errorMessage, isKnownLocation, relativeTime } from '../lib/format';

export const WatchlistsPage: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [saved, setSaved] = useState<SavedFounder[]>([]);
  const [selected, setSelected] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [wl, sf] = await Promise.all([api.getWatchlists(), api.getSavedFounders()]);
      setWatchlists(wl);
      setSaved(sf);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Saved founders could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await api.createWatchlist({ name: newName.trim(), description: newDesc.trim() || undefined });
      setNewName('');
      setNewDesc('');
      setCreatingOpen(false);
      setSelected(created.id);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'The list could not be created.'));
    } finally {
      setCreating(false);
    }
  };

  const removeFounder = async (f: SavedFounder) => {
    if (!window.confirm(`Remove ${f.name} and their notes from your saved founders?`)) return;
    try {
      await api.removeSavedFounder(f.profile_id);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not remove this founder.'));
    }
  };

  const removeFromList = async (f: SavedFounder, listId: string) => {
    try {
      await api.removeFromWatchlist(listId, f.profile_id);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not update the list.'));
    }
  };

  const listName = (id: string) => watchlists.find((w) => w.id === id)?.name;
  const visible = selected === 'all' ? saved : saved.filter((f) => f.watchlist_ids.includes(selected));
  const current = watchlists.find((w) => w.id === selected);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Watchlists"
        description="Founders you saved, grouped into lists, with your notes and whether research has been run."
        actions={
          <button onClick={() => setCreatingOpen(!creatingOpen)} className="btn btn-secondary">
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            New list
          </button>
        }
      />

      {creatingOpen && (
        <form onSubmit={createList} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-[13px] font-medium text-ink-2">Name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="field" autoFocus required />
          </label>
          <label className="block flex-[2]">
            <span className="mb-1 block text-[13px] font-medium text-ink-2">Description (optional)</span>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="field" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCreatingOpen(false)} className="btn btn-quiet">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Create
            </button>
          </div>
        </form>
      )}

      {error && <Notice>{error}</Notice>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Watchlists" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {[{ id: 'all', name: 'All saved', member_count: saved.length }, ...watchlists].map((wl) => (
            <button
              key={wl.id}
              onClick={() => setSelected(wl.id)}
              aria-current={selected === wl.id ? 'true' : undefined}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
                selected === wl.id ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2 hover:bg-surface-2/60'
              }`}
            >
              <span className="truncate">{wl.name}</span>
              <span className="tabular text-[12px] text-ink-3">{wl.member_count}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-3">
          {current?.description && <p className="text-[14px] text-ink-2">{current.description}</p>}

          {loading ? (
            <div className="panel overflow-hidden">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              type="watchlist"
              title={selected === 'all' ? 'Nothing saved yet' : 'This list is empty'}
              description={
                selected === 'all'
                  ? 'Save founders from search results or a dossier. Saved founders and notes are stored locally in SQLite.'
                  : 'Add founders to this list from the Save dialog on a result or dossier.'
              }
              actionText="Find founders"
              onAction={() => navigate(paths.discover())}
            />
          ) : (
            <ul className="panel divide-y divide-line">
              {visible.map((f) => (
                <li key={f.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <a href={paths.profile(f.profile_id)} className="text-[16px] font-semibold text-ink hover:text-accent">
                        {f.name}
                      </a>
                      <p className="text-[14px] text-ink-2">
                        {f.current_title || 'No title saved'}
                        {f.current_company && <> at {f.current_company}</>}
                        {isKnownLocation(f.location) && <span className="text-ink-3">, {f.location}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[12px]">
                      {f.researched_at ? (
                        <span className="rounded-[4px] bg-ai-soft px-1.5 py-px font-medium text-ai">
                          Researched {relativeTime(f.researched_at)}
                        </span>
                      ) : (
                        <span className="rounded-[4px] bg-muted-soft px-1.5 py-px text-ink-2">Not researched</span>
                      )}
                      <button
                        onClick={() => removeFounder(f)}
                        className="btn btn-quiet min-h-8 px-2"
                        aria-label={`Remove ${f.name}`}
                        title="Remove from saved founders"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {f.notes && (
                    <p className="mt-2 max-w-[70ch] border-l-2 border-line-strong pl-3 text-[14px] text-ink-2">{f.notes}</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                    {f.watchlist_ids.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-[4px] border border-line px-1.5 py-px text-ink-2">
                        {listName(id) || id}
                        <button
                          onClick={() => removeFromList(f, id)}
                          className="text-ink-3 hover:text-ink"
                          aria-label={`Remove ${f.name} from ${listName(id) || 'list'}`}
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                    <span className="text-ink-3">Saved {relativeTime(f.created_at)}</span>
                    <a href={paths.research(f.profile_id)} className="link ml-auto">
                      Research
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
