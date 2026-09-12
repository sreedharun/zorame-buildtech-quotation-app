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

interface PaymentStatusBadgeProps {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PaymentStatusBadge({ status = 'Unpaid', size = 'md' }: PaymentStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Fully Paid':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />,
        };
      case 'Partially Paid':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />,
        };
      case 'Unpaid':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3 text-slate-400' : 'w-3.5 h-3.5 text-slate-400'} />,
        };
    }
  };

  const { bg, icon } = getBadgeStyle();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10.5px] gap-1 font-semibold',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
    lg: 'px-3 py-1.5 text-sm gap-2 font-bold',
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
