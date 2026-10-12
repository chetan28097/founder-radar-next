import React from 'react';
import { Search, Bookmark, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'watchlist' | 'error';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'search',
  title,
  description,
  actionText,
  onAction,
  children,
}) => {
  const Icon = type === 'error' ? AlertCircle : type === 'watchlist' ? Bookmark : Search;
  return (
    <div className="panel px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md text-center">
        <Icon
          className={`mx-auto mb-3 h-6 w-6 ${type === 'error' ? 'text-danger' : 'text-ink-3'}`}
          strokeWidth={1.75}
          aria-hidden
        />
        <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-[14px] text-ink-2">{description}</p>
        {actionText && onAction && (
          <button onClick={onAction} className="btn btn-secondary mt-5">
            {actionText}
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
