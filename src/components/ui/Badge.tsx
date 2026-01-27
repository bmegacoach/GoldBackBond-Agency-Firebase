import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-success-50 text-success-700 border border-success-200 shadow-sm shadow-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200 shadow-sm shadow-warning-100',
    error: 'bg-danger-50 text-danger-700 border border-danger-200 shadow-sm shadow-danger-100',
    info: 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm shadow-primary-100',
    gold: 'bg-gold-50 text-gold-700 border border-gold-200 shadow-sm shadow-gold-100',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
