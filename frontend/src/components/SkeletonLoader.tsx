import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-5 border border-white/5 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80" />
          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-slate-800" />
            <div className="w-48 h-3 rounded bg-slate-800/60" />
          </div>
        </div>
        <div className="w-24 h-6 rounded-full bg-slate-800/60" />
      </div>

      <div className="space-y-2 pt-2">
        <div className="w-full h-3 rounded bg-slate-800/40" />
        <div className="w-3/4 h-3 rounded bg-slate-800/40" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="w-20 h-6 rounded bg-slate-800/50" />
        <div className="w-24 h-6 rounded bg-slate-800/50" />
        <div className="w-16 h-6 rounded bg-slate-800/50" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="w-28 h-3 rounded bg-slate-800/40" />
        <div className="flex gap-2">
          <div className="w-20 h-8 rounded-lg bg-slate-800" />
          <div className="w-20 h-8 rounded-lg bg-slate-800" />
        </div>
      </div>
    </div>
  );
};
