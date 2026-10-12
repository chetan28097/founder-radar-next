import React, { useState } from 'react';
import { ArrowUpRight, Database, Sparkles } from 'lucide-react';
import { initials } from '../lib/format';

/** Marks where a block of information comes from. */
export const SourceTag: React.FC<{ kind: 'sourced' | 'ai'; detail?: string }> = ({ kind, detail }) => {
  if (kind === 'ai') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[4px] bg-ai-soft px-1.5 py-px text-[12px] font-medium text-ai">
        <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
        AI interpretation{detail ? `, ${detail}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[4px] bg-accent-soft px-1.5 py-px text-[12px] font-medium text-accent">
      <Database className="h-3 w-3" strokeWidth={2} aria-hidden />
      {detail || 'Crustdata record'}
    </span>
  );
};

/** Text used wherever a field is missing from the source. Never replaced with a guess. */
export const Unavailable: React.FC<{ children?: React.ReactNode }> = ({ children = 'Not available' }) => (
  <span className="text-ink-3 italic">{children}</span>
);

export const Avatar: React.FC<{ name: string; src?: string; size?: number; square?: boolean }> = ({
  name,
  src,
  size = 40,
  square = true,
}) => {
  const [failed, setFailed] = useState(false);
  const radius = square ? Math.round(size * 0.22) : size / 2;
  const style = { width: size, height: size, borderRadius: radius };
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`Profile photo of ${name}`}
        style={style}
        className="shrink-0 border border-line object-cover"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      style={{ ...style, fontSize: Math.round(size * 0.36) }}
      className="flex shrink-0 items-center justify-center border border-line bg-surface-2 font-semibold text-ink-2"
      aria-hidden
    >
      {initials(name) || '?'}
    </div>
  );
};

/** Outbound link to a URL taken from the source record. Opens in a new tab. */
export const OutLink: React.FC<{
  href: string;
  children: React.ReactNode;
  variant?: 'button' | 'inline';
  title?: string;
}> = ({ href, children, variant = 'inline', title }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={title}
    className={variant === 'button' ? 'btn btn-secondary' : 'link inline-flex items-center gap-0.5'}
  >
    {children}
    <ArrowUpRight className={variant === 'button' ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={1.75} aria-hidden />
  </a>
);

export const PageHeader: React.FC<{
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-semibold leading-tight text-ink">{title}</h1>
      {description && <p className="mt-1.5 text-[15px] text-ink-2">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Notice: React.FC<{ tone?: 'error' | 'info'; children: React.ReactNode; action?: React.ReactNode }> = ({
  tone = 'error',
  children,
  action,
}) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex flex-col gap-2 rounded-lg px-4 py-3 text-[14px] sm:flex-row sm:items-center sm:justify-between ${
      tone === 'error' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-ink-2'
    }`}
  >
    <div>{children}</div>
    {action}
  </div>
);
