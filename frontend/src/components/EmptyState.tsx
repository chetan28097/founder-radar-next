import React from 'react';
import { Search, Compass, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'watchlist' | 'error';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'search',
  title,
  description,
  actionText,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-10 h-10 text-rose-400" />;
      case 'watchlist':
        return <Compass className="w-10 h-10 text-indigo-400" />;
      case 'search':
      default:
        return <Search className="w-10 h-10 text-slate-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-10 text-center max-w-lg mx-auto border border-white/5 my-8">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
