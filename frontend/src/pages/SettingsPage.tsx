import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { HealthResponse } from '../types';
import { api } from '../services/api';
import { Notice, PageHeader } from '../components/ui';
import { SkeletonBlock } from '../components/SkeletonLoader';
import { paths } from '../lib/router';
import { errorMessage, relativeTime } from '../lib/format';

type Tone = 'ok' | 'warn' | 'muted';

const Pill: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`inline-flex rounded-[4px] px-1.5 py-px text-[12px] font-medium ${
      tone === 'ok' ? 'bg-ok-soft text-ok' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-muted-soft text-ink-2'
    }`}
  >
    {children}
  </span>
);

interface Row {
  name: string;
  role: string;
  checks: { label: string; tone: Tone }[];
  note: React.ReactNode;
}

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    try {
      setHealth(await api.getHealth());
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Health check failed.'));
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getHealth()
      .then((h) => !cancelled && setHealth(h))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Health check failed.')))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = health
    ? [
        {
          name: 'Crustdata People Search',
          role: 'Founder discovery and employment history (API version 2025-11-01).',
          checks: [{ label: health.crustdata_connected ? 'Key configured' : 'Key missing', tone: health.crustdata_connected ? 'ok' : 'warn' }],
          note: 'Not called from this page. A search on Discover is the live test.',
        },
        {
          name: 'Claude via LiteLLM',
          role: 'On-demand research and optional message drafts.',
          checks: [
            { label: health.litellm_connected ? 'Key configured' : 'Key missing', tone: health.litellm_connected ? 'ok' : 'warn' },
            { label: health.model_id, tone: 'muted' },
          ],
          note: 'Not called from this page, to avoid spending tokens. Running research is the live test.',
        },
        {
          name: 'Neatlogs tracing',
          role: 'Spans for crustdata_fetch, profile_normalization, ai_synthesis and founder_research_analysis.',
          checks: [
            { label: health.neatlogs_connected ? 'Key configured' : 'Key missing', tone: health.neatlogs_connected ? 'ok' : 'warn' },
            {
              label: health.neatlogs_tracer_active ? 'Tracer initialised' : 'Tracer not initialised',
              tone: health.neatlogs_tracer_active ? 'ok' : 'warn',
            },
          ],
          note: 'Delivery is confirmed in the Neatlogs dashboard, not here.',
        },
        {
          name: 'Local SQLite database',
          role: 'Saved founders, notes, watchlists, searches, cached profiles and research.',
          checks: [{ label: health.database_connected ? 'Query succeeded' : 'Query failed', tone: health.database_connected ? 'ok' : 'warn' }],
          note: 'Checked with a live query on every refresh.',
        },
        {
          name: 'cfo.ai financial diligence',
          role: 'Planned. Not part of the product today.',
          checks: [{ label: 'Coming soon', tone: 'muted' }],
          note: (
            <>
              Used during development only.{' '}
              <a href={paths.builtWith()} className="link">
                See how
              </a>
              .
            </>
          ),
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Settings and integrations"
        description="What the backend can confirm about each service. 'Key configured' means a credential is set, not that a live call succeeded."
        actions={
          <button onClick={check} disabled={checking} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} strokeWidth={1.75} aria-hidden />
            Check again
          </button>
        }
      />

      {error && <Notice>{error}</Notice>}

      {checking && !health ? (
        <div className="panel p-5">
          <SkeletonBlock lines={6} />
        </div>
      ) : (
        health && (
          <>
            <p className="text-[13px] text-ink-3">
              Backend reports <span className="font-medium text-ink-2">{health.status}</span>, checked {relativeTime(health.timestamp)}.
            </p>
            <ul className="panel divide-y divide-line">
              {rows.map((r) => (
                <li key={r.name} className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-[14px] text-ink-2">{r.role}</p>
                    <p className="mt-1 text-[13px] text-ink-3">{r.note}</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-1.5 sm:justify-end">
                    {r.checks.map((c) => (
                      <Pill key={c.label} tone={c.tone}>
                        {c.label}
                      </Pill>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-ink-3">API keys live only in the backend .env and are never sent to the browser.</p>
          </>
        )
      )}
    </div>
  );
};
