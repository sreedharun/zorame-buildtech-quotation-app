import React from 'react';
import { QuotationStatus } from '@/lib/types';
import { CheckCircle2, Clock, Send, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: QuotationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
        };
      case 'Sent':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
          icon: <Send className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
        };
      case 'Draft':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
        };
    }
  };

  const { bg, icon } = getBadgeStyle();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${bg} ${sizeClasses[size]}`}
    >
      {icon}
      <span>{status}</span>
    </span>
  );
}
