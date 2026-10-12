import React from 'react';
import { TransitionStatus } from '../types';

interface StatusBadgeProps {
  status: TransitionStatus;
  size?: 'sm' | 'md';
}

/*
  The backend keys stay verified / unverified / insufficient_evidence.
  Labels describe what the record contains rather than claiming independent verification.
*/
const STATUS: Record<TransitionStatus, { label: string; title: string; className: string }> = {
  verified: {
    label: 'Dates on record',
    title: 'The record has an end date for a past role and a start date for the current founder role.',
    className: 'bg-ok-soft text-ok',
  },
  unverified: {
    label: 'Dates incomplete',
    title: 'Founder title is present, but some dates needed to place the transition are missing.',
    className: 'bg-warn-soft text-warn',
  },
  insufficient_evidence: {
    label: 'Not enough data',
    title: 'The record does not contain enough dated history to describe a transition.',
    className: 'bg-muted-soft text-ink-2',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = STATUS[status] ?? STATUS.insufficient_evidence;
  return (
    <span
      title={s.title}
      className={`inline-flex items-center rounded-[4px] font-medium whitespace-nowrap ${s.className} ${
        size === 'sm' ? 'px-1.5 py-px text-[12px]' : 'px-2 py-0.5 text-[13px]'
      }`}
    >
      {s.label}
    </span>
  );
};
