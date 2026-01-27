import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Base styles are handled by CSS classes where possible, but we compose them here
  const baseStyles = 'inline-flex items-center justify-center font-heading font-medium rounded-xl transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 hover:to-primary-700 border-0',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 hover:to-gold-700 border-0',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md',
    outline: 'border border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-300 bg-transparent',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300 bg-transparent',
    success: 'bg-gradient-to-r from-success-600 to-success-500 text-white shadow-lg shadow-success-600/20 hover:to-success-600',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-500 text-white shadow-lg shadow-danger-600/20 hover:to-danger-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-400 text-white shadow-lg shadow-warning-500/20 hover:to-warning-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin -ml-1 mr-2" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
