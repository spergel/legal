'use client';

import { useState, useEffect } from 'react';
import FilterBar, { FilterOption } from './FilterBar';
import { Community } from '@/types';

interface CommunitiesFilterProps {
  communities: Community[];
  onFilteredCommunities: (communities: Community[]) => void;
  className?: string;
}

export default function CommunitiesFilter({ communities, onFilteredCommunities, className = '' }: CommunitiesFilterProps) {
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
  });

  // Generate filter options from communities data
  const categoryOptions: FilterOption[] = [
    { id: 'all', label: 'All Categories', value: 'all' },
    ...Array.from(new Set(communities.flatMap(community => community.category || [])))
      .map(category => ({
        id: category,
        label: category,
        value: category,
      })),
  ];

  const locationOptions: FilterOption[] = [
    { id: 'all', label: 'All Locations', value: 'all' },
    { id: 'online', label: 'Online', value: 'online' },
    { id: 'nyc', label: 'NYC', value: 'nyc' },
  ];

  const filterConfig = [
    {
      id: 'category',
      label: 'Category',
      options: categoryOptions,
    },
    {
      id: 'location',
      label: 'Location',
      options: locationOptions,
    },
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  useEffect(() => {
    let filteredCommunities = [...communities];

    // Apply category filter
    if (filters.category !== 'all') {
      filteredCommunities = filteredCommunities.filter(community => 
        community.category?.includes(filters.category)
      );
    }

    // Apply location filter
    if (filters.location !== 'all') {
      filteredCommunities = filteredCommunities.filter(community => {
        if (filters.location === 'online') {
          return !community.location;
        } else if (filters.location === 'nyc') {
          return community.location?.city?.toLowerCase() === 'new york';
        }
        return true;
      });
    }

    onFilteredCommunities(filteredCommunities);
  }, [communities, filters, onFilteredCommunities]);

  return (
    <FilterBar
      title="Filter Communities"
      filters={filterConfig}
      onFilterChange={handleFilterChange}
      className={className}
    />
  );
} 