import React from 'react';

/** Matches the FounderCard row layout so results do not jump when they load. */
export const SkeletonCard: React.FC = () => (
  <div className="flex items-start gap-4 border-b border-line px-4 py-4 last:border-0 sm:px-5" aria-hidden>
    <div className="skeleton h-11 w-11 shrink-0 rounded-[10px]" />
    <div className="flex-1 space-y-2.5">
      <div className="skeleton h-4 w-48" />
      <div className="skeleton h-3.5 w-72 max-w-full" />
      <div className="skeleton h-3 w-40" />
    </div>
    <div className="skeleton hidden h-8 w-24 sm:block" />
  </div>
);

export const SkeletonBlock: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2.5" aria-hidden>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton h-3.5" style={{ width: `${92 - i * 14}%` }} />
    ))}
  </div>
);
