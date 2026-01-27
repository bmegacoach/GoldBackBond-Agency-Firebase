import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  className = '',
  icon,
  ...props
}: InputProps) {
  return (
    <div className="w-full group">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 transition-colors group-focus-within:text-primary-600">
          {label}
        </label>
      )}
      <div className="relative transition-all duration-300">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-xl border border-slate-200 bg-slate-50/50 
            ${icon ? 'pl-10' : 'px-4'} py-2.5 text-sm text-slate-900 
            placeholder-slate-400
            transition-all duration-200 
            focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none
            hover:border-slate-300
            ${error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10' : ''} 
            ${className}
          `}
          {...props}
        />
        {/* Animated bottom border highlight (optional, keeping it clean for now) */}
      </div>
      {error && (
        <p className="mt-1.5 ml-1 text-sm text-danger-600 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
