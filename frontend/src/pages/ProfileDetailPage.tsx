import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Loader2, MapPin, Sparkles } from 'lucide-react';
import { CareerPosition, ProfileDossier, ResearchResponse } from '../types';
import { api, ApiError } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SaveModal } from '../components/SaveModal';
import { SkeletonBlock } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { Avatar, Notice, OutLink, SourceTag, Unavailable } from '../components/ui';
import { navigate, paths } from '../lib/router';
import { durationLabel, errorMessage, hostname, isKnownLocation, monthYear, monthsBetween, relativeTime } from '../lib/format';

interface ProfileDetailPageProps {
  profileId: string;
}

export const ProfileDetailPage: React.FC<ProfileDetailPageProps> = ({ profileId }) => {
  const [dossier, setDossier] = useState<ProfileDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesState, setNotesState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [research, setResearch] = useState<ResearchResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getProfileDossier(profileId)
      .then((data) => {
        if (cancelled) return;
        setDossier(data);
        setIsSaved(data.is_saved);
        setNotes(data.notes || '');
        setResearch(data.latest_research || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError({
          message: errorMessage(err, 'The dossier could not be loaded.'),
          notFound: err instanceof ApiError && err.status === 404,
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const saveNotes = async () => {
    if (!dossier) return;
    setNotesState('saving');
    try {
      if (!isSaved) {
        const p = dossier.profile;
        await api.saveFounder({
          profile_id: p.id,
          name: p.name,
          headline: p.headline,
          current_company: p.current_company,
          current_title: p.current_title,
          location: p.location,
          notes,
          tags: p.tags,
        });
        setIsSaved(true);
      } else {
        await api.updateNotes(profileId, notes);
      }
      setNotesState('saved');
      setTimeout(() => setNotesState('idle'), 2000);
    } catch {
      setNotesState('error');
    }
  };

  const runResearch = async () => {
    setResearching(true);
    setResearchError(null);
    try {
      setResearch(await api.analyzeResearch({ profile_id: profileId, custom_question: question.trim() || undefined }));
    } catch (err) {
      setResearchError(errorMessage(err, 'Research could not be generated.'));
    } finally {
      setResearching(false);
    }
  };

  const back = (
    <a href={paths.discover()} className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink">
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Back to results
    </a>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {back}
        <div className="flex items-center gap-4">
          <div className="skeleton h-16 w-16 rounded-[14px]" />
          <div className="flex-1 space-y-2.5">
            <div className="skeleton h-6 w-64" />
            <div className="skeleton h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="panel p-5">
          <SkeletonBlock lines={5} />
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {back}
        <EmptyState
          type="error"
          title={error?.notFound ? 'This profile is not loaded' : 'Dossier unavailable'}
          description={
            error?.notFound
              ? 'Founder Radar only keeps profiles that appeared in a search or were saved. Run a search that includes this person to load their record.'
              : error?.message || 'The dossier could not be loaded.'
          }
          actionText="Go to Discover"
          onAction={() => navigate(paths.discover())}
        />
      </div>
    );
  }

  const { profile } = dossier;
  const company = profile.company;

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      {back}

      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={profile.name} src={profile.avatar_url} size={68} />
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight text-ink">{profile.name}</h1>
            <p className="mt-1 text-[16px] text-ink-2">
              {profile.current_title || <Unavailable>No current title</Unavailable>}
              {profile.current_company && (
                <>
                  <span className="text-ink-3"> at </span>
                  <span className="font-medium text-ink">{profile.current_company}</span>
                </>
              )}
            </p>
            {profile.headline && <p className="mt-1.5 max-w-2xl text-[14px] text-ink-3">{profile.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
              {isKnownLocation(profile.location) ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {profile.location}
                </span>
              ) : (
                <Unavailable>Location not recorded</Unavailable>
              )}
              {profile.data_updated_at && <span>Record updated {monthYear(profile.data_updated_at)}</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          {profile.linkedin_url ? (
            <OutLink href={profile.linkedin_url} variant="button">
              Open LinkedIn
            </OutLink>
          ) : (
            <span className="btn btn-secondary cursor-default text-ink-3" title="No LinkedIn URL in the Crustdata record">
              No LinkedIn URL
            </span>
          )}
          <button onClick={() => setSaveOpen(true)} className={isSaved ? 'btn btn-secondary text-accent' : 'btn btn-primary'}>
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <Bookmark className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            {isSaved ? 'Saved' : 'Save founder'}
          </button>
        </div>
      </header>

      {/* Transition summary (rule-based, from the record) */}
      {profile.founder_status ? (
        <section className="flex flex-col items-start gap-2 rounded-lg bg-surface-2/70 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <StatusBadge status={dossier.transition_status} />
          <p className="text-[14px] text-ink-2">{profile.transition_summary}</p>
        </section>
      ) : (
        <p className="rounded-lg bg-surface-2/70 px-4 py-3 text-[14px] text-ink-2">
          No current title in the record says founder, so no founder-transition label applies to this profile.
        </p>
      )}

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          {/* Career timeline */}
          <section aria-labelledby="career-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="career-heading" className="text-[18px] font-semibold text-ink">
                Career history
              </h2>
              <SourceTag kind="sourced" />
            </div>
            {dossier.career_timeline.length === 0 ? (
              <p className="panel px-5 py-4 text-[14px] text-ink-3">No employment history in the record.</p>
            ) : (
              <ol className="panel divide-y divide-line">
                {dossier.career_timeline.map((pos, idx) => (
                  <TimelineRow key={`${pos.company}-${pos.start_date}-${idx}`} pos={pos} />
                ))}
              </ol>
            )}
          </section>

          {profile.education.length > 0 && (
            <section aria-labelledby="edu-heading">
              <h2 id="edu-heading" className="mb-3 text-[18px] font-semibold text-ink">
                Education
              </h2>
              <ul className="panel divide-y divide-line">
                {profile.education.map((e, i) => (
                  <li key={i} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <span>
                      <span className="font-medium text-ink">{e.school}</span>
                      {e.degree && <span className="text-ink-2">, {e.degree}</span>}
                    </span>
                    <span className="tabular text-[13px] text-ink-3">
                      {e.start_year || e.end_year ? `${e.start_year ?? '?'} to ${e.end_year ?? '?'}` : 'Years not recorded'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* AI research: only on request */}
          <section aria-labelledby="research-heading" className="panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="research-heading" className="text-[18px] font-semibold text-ink">
                  Research notes from Claude
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-3">
                  Generated only when you ask, from the record above. It can be wrong; check it against the sources.
                </p>
              </div>
              <SourceTag kind="ai" />
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Optional focus, e.g. how relevant is their payments experience?"
                  className="field"
                  aria-label="Optional research focus"
                />
                <button onClick={runResearch} disabled={researching} className="btn btn-secondary shrink-0">
                  {researching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  )}
                  {research ? 'Run again' : 'Run research'}
                </button>
              </div>

              {researchError && <Notice>{researchError}</Notice>}

              {researching && !research && <SkeletonBlock lines={4} />}

              {research ? (
                <ResearchBody research={research} />
              ) : (
                !researching &&
                !researchError && <p className="text-[14px] text-ink-3">No research has been run for this founder yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Aside: company, gaps, notes */}
        <aside className="space-y-6">
          <section aria-labelledby="company-heading" className="panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="company-heading" className="text-[15px] font-semibold text-ink">
                Current company
              </h2>
              <SourceTag kind="sourced" detail="Crustdata" />
            </div>
            {company ? (
              <div className="space-y-3 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={company.name} src={company.logo_url} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{company.name}</p>
                    <p className="text-[13px] text-ink-3">
                      {company.title || 'Role not recorded'}
                      {company.start_date && <> since {monthYear(company.start_date)}</>}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 text-[14px]">
                  <dt className="text-ink-3">Website</dt>
                  <dd className="min-w-0 truncate">
                    {company.website ? (
                      <OutLink href={company.website}>{hostname(company.website) || company.website}</OutLink>
                    ) : (
                      <Unavailable />
                    )}
                  </dd>
                  <dt className="text-ink-3">LinkedIn</dt>
                  <dd>
                    {company.linkedin_url ? <OutLink href={company.linkedin_url}>Company page</OutLink> : <Unavailable />}
                  </dd>
                  <dt className="text-ink-3">Industry</dt>
                  <dd className="text-ink-2">{company.industries.length ? company.industries.join(', ') : <Unavailable />}</dd>
                  <dt className="text-ink-3">Headcount</dt>
                  <dd className="tabular text-ink-2">
                    {typeof company.headcount === 'number'
                      ? company.headcount.toLocaleString()
                      : company.headcount_range || <Unavailable />}
                  </dd>
                  <dt className="text-ink-3">HQ</dt>
                  <dd className="text-ink-2">{company.hq || <Unavailable />}</dd>
                </dl>
              </div>
            ) : (
              <p className="px-4 py-4 text-[14px] text-ink-3">No current company in the record.</p>
            )}
          </section>

          <section aria-labelledby="gaps-heading" className="panel px-4 py-4">
            <h2 id="gaps-heading" className="text-[15px] font-semibold text-ink">
              What the record does not show
            </h2>
            <p className="mb-2 mt-0.5 text-[13px] text-ink-3">Checked automatically against the Crustdata fields.</p>
            {dossier.data_gaps.length === 0 ? (
              <p className="text-[14px] text-ink-2">No obvious gaps in the core fields.</p>
            ) : (
              <ul className="space-y-1.5 text-[14px] text-ink-2">
                {dossier.data_gaps.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                    {g}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="notes-heading" className="panel px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="notes-heading" className="text-[15px] font-semibold text-ink">
                Your notes
              </h2>
              <button onClick={saveNotes} disabled={notesState === 'saving'} className="btn btn-quiet min-h-8 px-2 text-[13px]">
                {notesState === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {notesState === 'saved' && <Check className="h-3.5 w-3.5 text-ok" aria-hidden />}
                {notesState === 'saved' ? 'Saved' : 'Save notes'}
              </button>
            </div>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isSaved ? 'Add diligence notes' : 'Saving a note also saves this founder'}
              className="field resize-y"
              aria-labelledby="notes-heading"
            />
            {notesState === 'error' && <p className="mt-1.5 text-[13px] text-danger">Notes could not be saved.</p>}
          </section>
        </aside>
      </div>

      <SaveModal profile={profile} isOpen={saveOpen} onClose={() => setSaveOpen(false)} onSuccess={() => setIsSaved(true)} />
    </div>
  );
};

const TimelineRow: React.FC<{ pos: CareerPosition }> = ({ pos }) => {
  const start = monthYear(pos.start_date);
  const end = pos.is_current ? 'Present' : monthYear(pos.end_date);
  const duration = durationLabel(
    pos.start_date && (pos.is_current || pos.end_date) ? monthsBetween(pos.start_date, pos.end_date) : null,
  );
  return (
    <li className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[150px_1fr] sm:gap-4">
      <div className="tabular text-[13px] text-ink-3">
        {start || end ? (
          <>
            {start || '?'} to {end || '?'}
            {duration && <span className="block">{duration}</span>}
          </>
        ) : (
          <Unavailable>Dates not recorded</Unavailable>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink">
          {pos.title || <Unavailable>Title not recorded</Unavailable>}
          {pos.is_current && (
            <span className="ml-2 rounded-[4px] bg-accent-soft px-1.5 py-px align-middle text-[12px] font-medium text-accent">
              Current
            </span>
          )}
        </p>
        <p className="text-[14px] text-ink-2">
          {pos.company_website ? <OutLink href={pos.company_website}>{pos.company}</OutLink> : pos.company}
          {pos.company_industries.length > 0 && <span className="text-ink-3">, {pos.company_industries[0]}</span>}
        </p>
        {pos.description && <p className="mt-1 line-clamp-3 text-[13px] text-ink-3">{pos.description}</p>}
      </div>
    </li>
  );
};

export const ResearchBody: React.FC<{ research: ResearchResponse }> = ({ research }) => (
  <div className="space-y-4">
    <p className="text-[12px] text-ink-3">
      {research.model || 'Model not recorded'}
      {research.generated_at && <>, {relativeTime(research.generated_at)}</>}
      {research.custom_question && <>. Focus: "{research.custom_question}"</>}
    </p>
    <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink">{research.research_summary}</p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ResearchList title="Facts it relied on" items={research.supporting_evidence} empty="None listed." />
      <ResearchList title="What it could not establish" items={research.uncertainties} empty="None listed." />
    </div>
    {research.suggested_questions.length > 0 && (
      <ResearchList title="Questions to ask next" items={research.suggested_questions} ordered />
    )}
  </div>
);

const ResearchList: React.FC<{ title: string; items: string[]; empty?: string; ordered?: boolean }> = ({
  title,
  items,
  empty,
  ordered,
}) => (
  <div>
    <h3 className="eyebrow mb-1.5">{title}</h3>
    {items.length === 0 ? (
      <p className="text-[14px] text-ink-3">{empty}</p>
    ) : (
      <ul className="space-y-1.5 text-[14px] text-ink-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="tabular w-4 shrink-0 text-ink-3">{ordered ? `${i + 1}.` : '–'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
