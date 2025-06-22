'use client';

import { useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
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
  children?: React.ReactNode;
  currentFilters: Record<string, any>;
}

export default function FilterBar({ title, filters, onFilterChange, className = '', children, currentFilters }: FilterBarProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const getSelectedDisplay = (filterId: string): { label: string, icon?: React.ReactNode } => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return { label: filterId };

    const selectedValue = currentFilters[filterId];
    if (selectedValue === 'all' || !selectedValue || selectedValue.length === 0) {
      return { label: filter.label };
    }
    
    if (Array.isArray(selectedValue)) {
        if (selectedValue.length === 1) return { label: selectedValue[0] };
        return { label: `${filter.label} (${selectedValue.length})` };
    }
    
    const selectedOption = filter.options.find(o => o.value === selectedValue);
    return selectedOption ? { label: selectedOption.label, icon: selectedOption.icon } : { label: filter.label };
  };

  return (
    <div className={`bg-amber-50 rounded-lg shadow p-4 border border-amber-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {filters.map((filter) => {
            const display = getSelectedDisplay(filter.id);
            return (
              <div key={filter.id} className="relative">
                <button
                  onClick={() => setExpandedFilter(expandedFilter === filter.id ? null : filter.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900 transition-colors border border-amber-200"
                >
                  {display.icon && <span className="flex-shrink-0">{display.icon}</span>}
                  <span>{display.label}</span>
                  <svg
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${expandedFilter === filter.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedFilter === filter.id && (
                  <div className="absolute z-10 mt-2 w-56 bg-amber-50 rounded-lg shadow-lg py-2 border border-amber-200">
                    {filter.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onFilterChange(filter.id, option.value);
                          setExpandedFilter(null);
                        }}
                        className="w-full text-left px-4 py-2 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-2"
                      >
                        {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
} 