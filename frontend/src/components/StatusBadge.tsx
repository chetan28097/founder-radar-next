import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { TransitionStatus } from '../types';

interface StatusBadgeProps {
  status: TransitionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-emerald-950/40 border-emerald-500/30 text-emerald-400 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Verified: Sequential career timeline confirmed with documented dates"
        >
          <CheckCircle2 className={isSm ? 'w-3 h-3 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />
          <span>Verified Transition</span>
        </span>
      );

    case 'unverified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-amber-950/40 border-amber-500/30 text-amber-400 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Unverified: Active founder role, but transition dates require verification"
        >
          <AlertCircle className={isSm ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
          <span>Timeline Unverified</span>
        </span>
      );

    case 'insufficient_evidence':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-slate-900/60 border-slate-700/40 text-slate-400 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Insufficient Evidence: Incomplete employment history or missing timestamps"
        >
          <HelpCircle className={isSm ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />
          <span>Insufficient Evidence</span>
        </span>
      );
  }
};
