import React from 'react';
import { MapPin, Building2, Bookmark, BookmarkCheck, ArrowRight, Mail } from 'lucide-react';
import { FounderProfile } from '../types';
import { StatusBadge } from './StatusBadge';

interface FounderCardProps {
  profile: FounderProfile;
  isSaved?: boolean;
  onOpenDossier: (profileId: string) => void;
  onSave: (profile: FounderProfile) => void;
  onDraftOutreach?: (profile: FounderProfile) => void;
}

export const FounderCard: React.FC<FounderCardProps> = ({
  profile,
  isSaved = false,
  onOpenDossier,
  onSave,
  onDraftOutreach,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const pastCompany = profile.past_jobs.length > 0 ? profile.past_jobs[0].company : null;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 border border-white/5 flex flex-col justify-between group">
      <div>
        {/* Header: Avatar, Name, Title, and Transition Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-semibold text-indigo-300 shrink-0">
                {getInitials(profile.name)}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                {profile.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {profile.current_title || 'Founder'}
                {profile.current_company && ` at ${profile.current_company}`}
              </p>
            </div>
          </div>
          <StatusBadge status={profile.transition_status} size="sm" />
        </div>

        {/* Location & Past Employment Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-slate-400">
          {profile.location && profile.location !== 'Location Unknown' && (
            <span className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-md px-2 py-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{profile.location}</span>
            </span>
          )}
          {pastCompany && (
            <span className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-md px-2 py-0.5">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>Ex-{pastCompany}</span>
            </span>
          )}
        </div>

        {/* Transition trajectory summary */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 bg-white/[0.015] p-2.5 rounded-lg border border-white/5">
          {profile.transition_summary || 'Professional profile records active leadership in current venture.'}
        </p>

        {/* Match tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {profile.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-slate-300 font-mono"
            >
              {tag}
            </span>
          ))}
          {profile.data_completeness > 0.7 && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 font-mono">
              High Completeness
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={() => onSave(profile)}
          className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            isSaved
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40'
              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
          }`}
          title={isSaved ? 'Saved to Watchlist' : 'Save to Watchlist'}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onDraftOutreach && (
            <button
              onClick={() => onDraftOutreach(profile)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 transition-colors flex items-center gap-1.5"
              title="Draft Outreach"
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Outreach</span>
            </button>
          )}

          <button
            onClick={() => onOpenDossier(profile.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 shadow-sm shadow-indigo-600/30"
          >
            <span>Dossier</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
