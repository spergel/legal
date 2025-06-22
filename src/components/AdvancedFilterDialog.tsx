'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface AdvancedFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableFilters: {
    dateOptions: FilterOption[];
    cleOptions: FilterOption[];
    eventTypes: string[];
    practiceAreas: string[];
    organizationTypes: string[];
    specialtyGroups: string[];
  };
  appliedFilters: {
    date: string;
    cle: string;
    eventTypes: string[];
    practiceAreas: string[];
    organizationTypes: string[];
    specialtyGroups: string[];
    startDate: string;
    endDate: string;
  };
  onFilterChange: (filterKey: string, value: any) => void;
}

export default function AdvancedFilterDialog({
  isOpen,
  onClose,
  availableFilters,
  appliedFilters,
  onFilterChange,
}: AdvancedFilterDialogProps) {
  if (!isOpen) return null;

  const handleClear = () => {
    // A bit of a hack, but it resets all filters by calling the change handler for each one
    onFilterChange('date', 'all');
    onFilterChange('cle', 'all');
    onFilterChange('eventTypes', []);
    onFilterChange('practiceAreas', []);
    onFilterChange('organizationTypes', []);
    onFilterChange('specialtyGroups', []);
    onFilterChange('startDate', '');
    onFilterChange('endDate', '');
  };

  const renderRadioSection = (title: string, category: 'date' | 'cle', options: FilterOption[]) => (
    <div key={title}>
      <h4 className="text-lg font-semibold text-amber-800 mb-2">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-2 rounded-md">
        {options.map(option => (
          <label key={option.id} className="flex items-center space-x-2">
            <input
              type="radio"
              name={category}
              checked={appliedFilters[category] === option.value}
              onChange={() => onFilterChange(category, option.value)}
              className="form-radio h-4 w-4 text-amber-600"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderCheckboxSection = (title: string, category: 'eventTypes' | 'practiceAreas' | 'organizationTypes' | 'specialtyGroups', options: string[]) => (
    <div key={title}>
      <h4 className="text-lg font-semibold text-amber-800 mb-2">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(appliedFilters[category] as string[]).includes(option)}
              onChange={() => {
                const currentValues = appliedFilters[category] as string[];
                const newValues = currentValues.includes(option)
                  ? currentValues.filter(v => v !== option)
                  : [...currentValues, option];
                onFilterChange(category, newValues);
              }}
              className="form-checkbox h-5 w-5 text-amber-600 rounded"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
  
  const renderDateRangeSection = () => (
    <div>
      <h4 className="text-lg font-semibold text-amber-800 mb-2">Custom Date Range</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-2 rounded-md">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={appliedFilters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            id="endDate"
            value={appliedFilters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-amber-900">Advanced Filters</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close dialog">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            {renderRadioSection('Date', 'date', availableFilters.dateOptions)}
            {renderDateRangeSection()}
            {renderRadioSection('CLE Status', 'cle', availableFilters.cleOptions)}
            {renderCheckboxSection('Event Types', 'eventTypes', availableFilters.eventTypes)}
            {renderCheckboxSection('Practice Areas', 'practiceAreas', availableFilters.practiceAreas)}
            {renderCheckboxSection('Organization Types', 'organizationTypes', availableFilters.organizationTypes)}
            {renderCheckboxSection('Specialty Groups', 'specialtyGroups', availableFilters.specialtyGroups)}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={handleClear} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Clear Filters
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 