import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export function Select({
  label,
  error,
  options,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full group">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 transition-colors group-focus-within:text-primary-600">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 
            text-sm text-slate-900 appearance-none
            transition-all duration-200 
            focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none
            hover:border-slate-300 cursor-pointer
            ${error ? 'border-danger-300' : ''} 
            ${className}
          `}
          {...props}
        >
          <option value="" disabled className="text-slate-400">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 ml-1 text-sm text-danger-600 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
