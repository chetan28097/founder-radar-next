import React from 'react';
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import { FounderProfile } from '../types';
import { StatusBadge } from './StatusBadge';
import { Avatar, OutLink } from './ui';
import { paths } from '../lib/router';
import { isKnownLocation, monthYear } from '../lib/format';

interface FounderCardProps {
  profile: FounderProfile;
  isSaved?: boolean;
  onSave: (profile: FounderProfile) => void;
}

export const FounderCard: React.FC<FounderCardProps> = ({ profile, isSaved = false, onSave }) => {
  const previous = profile.past_jobs
    .map((j) => j.company)
    .filter((c, i, all) => c && c !== 'Previous Company' && all.indexOf(c) === i)
    .slice(0, 3);
  const since = monthYear(profile.company?.start_date);

  return (
    <article className="group flex flex-col gap-3 border-b border-line px-4 py-4 transition-colors last:border-0 hover:bg-surface-2/60 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <Avatar name={profile.name} src={profile.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <a href={paths.profile(profile.id)} className="text-[16px] font-semibold text-ink hover:text-accent">
              {profile.name}
            </a>
            {profile.founder_status && <StatusBadge status={profile.transition_status} size="sm" />}
          </div>
          <p className="mt-0.5 text-[14px] text-ink-2">
            {profile.current_title || <span className="text-ink-3">No current title</span>}
            {profile.current_company && (
              <>
                <span className="text-ink-3"> at </span>
                <span className="font-medium text-ink">{profile.current_company}</span>
              </>
            )}
            {since && <span className="tabular text-ink-3"> since {since}</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
            {isKnownLocation(profile.location) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                {profile.location}
              </span>
            )}
            {previous.length > 0 && (
              <span>
                Previously <span className="text-ink-2">{previous.join(', ')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-[58px] sm:pl-0">
        {profile.linkedin_url && (
          <OutLink href={profile.linkedin_url} variant="button" title={`${profile.name} on LinkedIn`}>
            LinkedIn
          </OutLink>
        )}
        <button
          onClick={() => onSave(profile)}
          className={`btn ${isSaved ? 'btn-secondary text-accent' : 'btn-secondary'}`}
          aria-label={isSaved ? `${profile.name} is saved` : `Save ${profile.name}`}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          ) : (
            <Bookmark className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
          <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        <a href={paths.profile(profile.id)} className="btn btn-primary">
          Dossier
        </a>
      </div>
    </article>
  );
};
