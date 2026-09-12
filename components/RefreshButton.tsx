'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  isRefreshing?: boolean;
  tooltip?: string;
  className?: string;
  showText?: boolean;
}

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  tooltip = 'Sync latest changes from cloud',
  className = '',
  showText = true,
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onRefresh()}
      disabled={isRefreshing}
      title={tooltip}
      aria-label="Refresh data"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      <RefreshCw
        className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
          isRefreshing ? 'animate-spin text-sky-600' : 'hover:text-slate-700'
        }`}
      />
      {showText && (
        <span className="hidden sm:inline font-medium">
          {isRefreshing ? 'Syncing...' : 'Refresh'}
        </span>
      )}
    </button>
  );
}
