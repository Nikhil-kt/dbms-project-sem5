import React from 'react';
import { LendingStatus, ReturnCondition, ProjectStatus } from '@/types/database';

interface BadgeProps {
  status?: LendingStatus | ReturnCondition | ProjectStatus | string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
}

export function StatusBadge({ status, variant, children }: BadgeProps) {
  const content = children || status;

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    switch (variant) {
      case 'success':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'primary':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'info':
        colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (status) {
    switch (status) {
      case 'Approved':
      case 'Completed':
      case 'Good':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Pending':
      case 'Planning':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Issued':
      case 'Ongoing':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Partially Returned':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'Returned':
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'Rejected':
      case 'Damaged':
      case 'Lost':
      case 'Cancelled':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {content}
    </span>
  );
}

