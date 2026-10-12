import React, { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { SourceTag, Unavailable } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { RadarGraphic } from '../components/RadarGraphic';
import { navigate, paths } from '../lib/router';
import { queueDiscoverSearch, SearchParams } from '../lib/discoverStore';
import { useCycle, useReveal } from '../lib/motion';

const ROLES = ['founders', 'co-founders', 'engineers', 'product leaders', 'operators'];

interface UseCase {
  id: string;
  audience: string;
  goal: string;
  steps: string[];
  note?: string;
  tryLabel: string;
  search: Partial<SearchParams>;
}

/* Each step describes something the product does today. */
const USE_CASES: UseCase[] = [
  {
    id: 'scouts',
    audience: 'VC scouts and angels',
    goal: 'Spot people who left established companies to start something, early.',
    steps: [
      'Filter by past employer and founder title, then check when the founder role started.',
      'Open the dossier for the company website, headcount and industry, straight from the record.',
      'Save to a watchlist with notes, and run research to turn unknowns like funding into diligence questions.',
    ],
    tryLabel: 'Ex-Stripe founders',
    search: { employer: 'Stripe' },
  },
  {
    id: 'jobseekers',
    audience: 'Job seekers',
    goal: 'Find young companies run by people from teams you respect.',
    steps: [
      'Search founders by location or past employer to find companies worth approaching.',
      'Use headcount and the founder role start date to judge how early the company is.',
      'Open the founder on LinkedIn in one click, and keep notes on every company you consider.',
    ],
    note: 'Founder Radar does not list job openings. It helps you find companies to approach.',
    tryLabel: 'Founders in Bengaluru',
    search: { location: 'Bengaluru' },
  },
  {
    id: 'students',
    audience: 'Students and aspiring founders',
    goal: 'Study the paths people took before founding a company.',
    steps: [
      'Read dated career timelines with role durations and education.',
      'Compare how long people spent in roles before they started their own company.',
      'Save the paths you find useful and annotate what you learned.',
    ],
    tryLabel: 'Co-founders in India',
    search: { role: 'Co-founder', country: 'India' },
  },
  {
    id: 'analysts',
    audience: 'Analysts and researchers',
    goal: 'Map professionals beyond founders, by title, place and background.',
    steps: [
      'Set "Current title contains" to any role: Head of Product, Staff Engineer, CTO.',
      'Combine it with location, country or past employer filters.',
      'Every result links to the source profile, and missing fields are shown as missing.',
    ],
    tryLabel: 'Heads of Product in Bengaluru',
    search: { role: 'Head of Product', location: 'Bengaluru' },
  },
];

const STEPS = [
  {
    title: 'Search by title, employer or place',
    body: 'Founders are the default, but any current title works. Every search is one Crustdata request, and nothing runs until you ask.',
  },
  {
    title: 'Read the career record',
    body: 'Each dossier lays out roles with dates, the current company with its website, headcount and industry, and a direct LinkedIn link.',
  },
  {
    title: 'See what is missing',
    body: 'Gaps are listed plainly: undated roles, no company website, no founder title. Leaving an employer is never read as proof of founding.',
  },
  {
    title: 'Ask for research when you need it',
    body: 'Claude reads the same record, separates the facts it used from what it cannot establish, and suggests diligence questions.',
  },
];

function runSearch(search: Partial<SearchParams>) {
  queueDiscoverSearch(search);
  navigate(paths.discover());
}

export const LandingPage: React.FC = () => {
  const [role, roleIndex] = useCycle(ROLES, 2200);
  const [active, setActive] = useState(USE_CASES[0].id);
  const useCase = USE_CASES.find((u) => u.id === active) ?? USE_CASES[0];
  const useCasesRef = useReveal<HTMLElement>();
  const labelsRef = useReveal<HTMLElement>();
  const stepsRef = useReveal<HTMLElement>();

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <p className="rise eyebrow mb-4" style={{ ['--i' as string]: 0 }}>
            Professional research for scouts, investors, students and job seekers
          </p>
          <h1
            className="rise text-[40px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[54px]"
            style={{ ['--i' as string]: 1 }}
          >
            <span className="sr-only">Find founders and professionals. </span>
            <span aria-hidden>
              Find{' '}
              <span key={roleIndex} className="word-in text-accent">
                {role}
              </span>
              .
            </span>
            <br />
            Read the record.
            <br />
            Keep your notes.
          </h1>
          <p className="rise mt-5 max-w-[56ch] text-[17px] leading-relaxed text-ink-2" style={{ ['--i' as string]: 2 }}>
            Founder Radar searches professional profiles by current title, past employer and location. It shows where each
            fact came from, and keeps AI interpretation clearly apart from the source data. Founders are the default; any
            role works.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ ['--i' as string]: 3 }}>
            <a href={paths.discover()} className="btn btn-primary h-11 px-5 text-[15px]">
              Start searching
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </a>
            <a href={paths.overview()} className="btn btn-secondary h-11 px-5 text-[15px]">
              Open workspace
            </a>
          </div>
        </div>

        <div className="rise mx-auto aspect-square w-full max-w-[440px]" style={{ ['--i' as string]: 2 }}>
          <RadarGraphic />
        </div>
      </section>

      {/* Use cases */}
      <section ref={useCasesRef} aria-labelledby="usecases-h" className="border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="reveal max-w-2xl">
            <h2 id="usecases-h" className="text-[28px] font-semibold text-ink">
              Who it is for
            </h2>
            <p className="mt-2 text-[16px] text-ink-2">
              The same search and dossier serve different questions. Pick one to see how it is used.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div role="tablist" aria-label="Use cases" className="reveal flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" style={{ ['--i' as string]: 1 }}>
              {USE_CASES.map((u) => {
                const selected = u.id === active;
                return (
                  <button
                    key={u.id}
                    role="tab"
                    id={`tab-${u.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${u.id}`}
                    onClick={() => setActive(u.id)}
                    className={`relative shrink-0 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected ? 'border-line-strong bg-surface text-ink shadow-card' : 'border-transparent text-ink-2 hover:bg-surface-2/70'
                    }`}
                  >
                    {selected && <span className="absolute inset-y-3 left-0 hidden w-[3px] rounded-r bg-accent lg:block" aria-hidden />}
                    <span className="block text-[15px] font-medium">{u.audience}</span>
                  </button>
                );
              })}
            </div>

            <div className="reveal min-w-0" style={{ ['--i' as string]: 2 }}>
            <div
              key={useCase.id}
              role="tabpanel"
              id={`panel-${useCase.id}`}
              aria-labelledby={`tab-${useCase.id}`}
              className="fade-swap panel p-6 sm:p-8"
            >
              <p className="eyebrow">{useCase.audience}</p>
              <h3 className="mt-1.5 text-[22px] font-semibold leading-snug text-ink">{useCase.goal}</h3>
              <ol className="mt-5 space-y-3">
                {useCase.steps.map((s, i) => (
                  <li key={s} className="grid grid-cols-[26px_1fr] gap-2 text-[15px] text-ink-2">
                    <span className="tabular flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {useCase.note && <p className="mt-4 text-[13px] text-ink-3">{useCase.note}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                <button onClick={() => runSearch(useCase.search)} className="btn btn-primary">
                  <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Try: {useCase.tryLabel}
                </button>
                <span className="text-[13px] text-ink-3">Runs one live Crustdata search.</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provenance */}
      <section ref={labelsRef} aria-labelledby="labels-h" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="reveal">
            <h2 id="labels-h" className="text-[28px] font-semibold text-ink">
              Every fact says where it came from
            </h2>
            <p className="mt-2 max-w-[48ch] text-[16px] text-ink-2">
              Profile data and AI output look different on purpose, so you always know what you are relying on.
            </p>
          </div>
          <dl className="space-y-3">
            {[
              {
                term: <SourceTag kind="sourced" />,
                desc: 'Roles, dates, company website, headcount and LinkedIn links exactly as the provider returned them.',
              },
              {
                term: <SourceTag kind="ai" />,
                desc: "Claude's reading of that record. Generated only on request, with the model and time shown.",
              },
              { term: <Unavailable />, desc: 'Shown wherever a field is missing. Nothing is filled in by guesswork.' },
              {
                term: (
                  <span className="flex flex-col items-start gap-1.5">
                    <StatusBadge status="verified" size="sm" />
                    <StatusBadge status="unverified" size="sm" />
                    <StatusBadge status="insufficient_evidence" size="sm" />
                  </span>
                ),
                desc: 'For founders only: rule-based labels describing whether the record has the dates to place the move into a founder role.',
              },
            ].map((row, i) => (
              <div
                key={i}
                className="reveal lift panel grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[150px_1fr] sm:items-start sm:gap-4"
                style={{ ['--i' as string]: i + 1 }}
              >
                <dt className="pt-0.5">{row.term}</dt>
                <dd className="text-[15px] text-ink-2">{row.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef} aria-labelledby="how-h" className="border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how-h" className="reveal text-[28px] font-semibold text-ink">
            How it works
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="reveal grid grid-cols-[28px_1fr] gap-3" style={{ ['--i' as string]: i }}>
                <span className="tabular pt-0.5 text-[14px] font-medium text-accent">{i + 1}</span>
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 max-w-[60ch] text-[15px] text-ink-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="reveal mt-12 flex flex-col gap-4 rounded-xl border border-line bg-surface px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[17px] font-semibold text-ink">Start with a search. Nothing runs until you press it.</p>
              <p className="mt-1 text-[14px] text-ink-3">
                Built for NeatHacks 2026 with Entire, Neatlogs and cfo.ai.{' '}
                <a href={paths.builtWith()} className="link">
                  See what each tool did
                </a>
                .
              </p>
            </div>
            <a href={paths.discover()} className="btn btn-primary h-11 shrink-0 px-5">
              Open Discover
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
