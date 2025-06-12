'use client';

import { useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  title: string;
  filters: {
    id: string;
    label: string;
    options: FilterOption[];
  }[];
  onFilterChange: (filterId: string, value: string) => void;
  className?: string;
}

export default function FilterBar({ title, filters, onFilterChange, className = '' }: FilterBarProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  return (
    <div className={`bg-amber-50 rounded-lg shadow p-4 border border-amber-200 ${className}`}>
      <div className="flex flex-wrap gap-4">
        {filters.map((filter) => (
          <div key={filter.id} className="relative">
            <button
              onClick={() => setExpandedFilter(expandedFilter === filter.id ? null : filter.id)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900 transition-colors border border-amber-200"
            >
              <span>{filter.label}</span>
              <svg
                className={`w-4 h-4 transition-transform ${expandedFilter === filter.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedFilter === filter.id && (
              <div className="absolute z-10 mt-2 w-48 bg-amber-50 rounded-lg shadow-lg py-2 border border-amber-200">
                {filter.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onFilterChange(filter.id, option.value);
                      setExpandedFilter(null);
                    }}
                    className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 