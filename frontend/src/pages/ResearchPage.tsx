import React, { useEffect, useState } from 'react';
import { Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { SavedFounder, ResearchResponse } from '../types';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { SkeletonBlock } from '../components/SkeletonLoader';
import { Notice, PageHeader, SourceTag } from '../components/ui';
import { ResearchBody } from './ProfileDetailPage';
import { navigate, paths } from '../lib/router';
import { errorMessage } from '../lib/format';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'founder', label: 'Founder to founder' },
  { value: 'investor', label: 'Investor or scout' },
  { value: 'warm', label: 'Warm introduction' },
];

export const ResearchPage: React.FC<{ founderId?: string }> = ({ founderId }) => {
  const [saved, setSaved] = useState<SavedFounder[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(founderId || '');
  const [question, setQuestion] = useState('');
  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tone, setTone] = useState('professional');
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getSavedFounders()
      .then((list) => {
        setSaved(list);
        setSelectedId((cur) => cur || list[0]?.profile_id || '');
      })
      .catch((err) => setError(errorMessage(err, 'Saved founders could not be loaded.')))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingExisting(true);
    setResearch(null);
    setDraft(null);
    setError(null);
    api
      .getLatestResearch(selectedId)
      .then((r) => !cancelled && setResearch(r))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoadingExisting(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setRunning(true);
    setError(null);
    try {
      setResearch(await api.analyzeResearch({ profile_id: selectedId, custom_question: question.trim() || undefined, tone }));
    } catch (err) {
      setError(errorMessage(err, 'Research could not be generated.'));
    } finally {
      setRunning(false);
    }
  };

  const generateDraft = async () => {
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await api.generateOutreach({ profile_id: selectedId, tone });
      setDraft({ subject: res.subject, body: res.body });
    } catch (err) {
      setDraftError(errorMessage(err, 'The draft could not be generated.'));
    } finally {
      setDrafting(false);
    }
  };

  const copyDraft = () => {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selected = saved.find((f) => f.profile_id === selectedId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Research"
        description="Ask Claude to read a saved founder's Crustdata record and list what it supports, what it does not, and what to ask next. Each run is one model call."
      />

      {!loadingList && saved.length === 0 ? (
        <EmptyState
          type="watchlist"
          title="Save a founder first"
          description="Research works on founders you have saved, so the record and results stay together."
          actionText="Find founders"
          onAction={() => navigate(paths.discover())}
        />
      ) : (
        <>
          <form onSubmit={run} className="panel space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium text-ink-2">Founder</span>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="field" disabled={loadingList}>
                  {saved.map((f) => (
                    <option key={f.id} value={f.profile_id}>
                      {f.name}
                      {f.current_company ? `, ${f.current_company}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium text-ink-2">Focus (optional)</span>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. what does their path say about domain depth?"
                  className="field"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {selected ? (
                <a href={paths.profile(selected.profile_id)} className="link text-[14px]">
                  Open {selected.name}'s dossier
                </a>
              ) : (
                <span />
              )}
              <button type="submit" disabled={running || !selectedId} className="btn btn-primary">
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                )}
                {research ? 'Run again' : 'Run research'}
              </button>
            </div>
          </form>

          {error && <Notice>{error}</Notice>}

          <section className="panel overflow-hidden" aria-live="polite">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <h2 className="truncate text-[17px] font-semibold text-ink">{selected?.name || 'Research'}</h2>
              </div>
              <SourceTag kind="ai" />
            </div>
            <div className="px-5 py-4">
              {loadingExisting || (running && !research) ? (
                <SkeletonBlock lines={4} />
              ) : research ? (
                <ResearchBody research={research} />
              ) : (
                <p className="text-[14px] text-ink-3">No research saved for this founder. Run it when you need it.</p>
              )}
            </div>
          </section>

          {selectedId && (
            <details className="panel group">
              <summary className="cursor-pointer list-none px-5 py-3.5 text-[15px] font-medium text-ink marker:hidden">
                Draft an introduction message
                <span className="ml-2 text-[13px] font-normal text-ink-3">optional, never sent by Founder Radar</span>
              </summary>
              <div className="space-y-3 border-t border-line px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block flex-1">
                    <span className="mb-1 block text-[13px] font-medium text-ink-2">Tone</span>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="field">
                      {TONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button onClick={generateDraft} disabled={drafting} className="btn btn-secondary">
                    {drafting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {draft ? 'Redraft' : 'Draft message'}
                  </button>
                </div>
                {draftError && <Notice>{draftError}</Notice>}
                {draft && (
                  <div className="space-y-2">
                    <input
                      value={draft.subject}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className="field"
                      aria-label="Subject"
                    />
                    <textarea
                      rows={8}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      className="field resize-y"
                      aria-label="Message body"
                    />
                    <div className="flex items-center justify-between">
                      <SourceTag kind="ai" detail="edit before sending" />
                      <button onClick={copyDraft} className="btn btn-secondary">
                        {copied ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};
