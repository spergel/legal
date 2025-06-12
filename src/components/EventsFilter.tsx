'use client';

import { useState, useEffect } from 'react';
import FilterBar, { FilterOption } from './FilterBar';
import { Event } from '@/types';

interface EventWithFormattedDates extends Event {
  formattedStartDate: string;
  formattedEndDate: string | null;
}

interface EventsFilterProps {
  events: EventWithFormattedDates[];
  onFilteredEvents: (events: EventWithFormattedDates[]) => void;
  className?: string;
}

export default function EventsFilter({ events, onFilteredEvents, className = '' }: EventsFilterProps) {
  const [filters, setFilters] = useState({
    date: 'all',
    category: 'all',
    price: 'all',
    cle: 'all',
  });

  // Generate filter options from events data
  const dateOptions: FilterOption[] = [
    { id: 'all', label: 'All Dates', value: 'all' },
    { id: 'today', label: 'Today', value: 'today' },
    { id: 'tomorrow', label: 'Tomorrow', value: 'tomorrow' },
    { id: 'this-week', label: 'This Week', value: 'this-week' },
    { id: 'this-month', label: 'This Month', value: 'this-month' },
  ];

  const categoryOptions: FilterOption[] = [
    { id: 'all', label: 'All Categories', value: 'all' },
    ...Array.from(new Set(events.flatMap(event => event.category || [])))
      .map(category => ({
        id: category,
        label: category,
        value: category,
      })),
  ];

  const priceOptions: FilterOption[] = [
    { id: 'all', label: 'All Prices', value: 'all' },
    { id: 'free', label: 'Free', value: 'free' },
    { id: 'paid', label: 'Paid', value: 'paid' },
  ];

  const cleOptions: FilterOption[] = [
    { id: 'all', label: 'All Events', value: 'all' },
    { id: 'cle', label: 'CLE Events Only', value: 'cle' },
  ];

  const filterConfig = [
    {
      id: 'date',
      label: 'Date',
      options: dateOptions,
    },
    {
      id: 'category',
      label: 'Category',
      options: categoryOptions,
    },
    {
      id: 'price',
      label: 'Price',
      options: priceOptions,
    },
    {
      id: 'cle',
      label: 'CLE',
      options: cleOptions,
    },
  ];

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  useEffect(() => {
    let filteredEvents = [...events];

    // Apply date filter
    if (filters.date !== 'all') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        switch (filters.date) {
          case 'today':
            return eventDate.toDateString() === now.toDateString();
          case 'tomorrow':
            return eventDate.toDateString() === tomorrow.toDateString();
          case 'this-week':
            return eventDate >= now && eventDate <= nextWeek;
          case 'this-month':
            return eventDate >= now && eventDate <= nextMonth;
          default:
            return true;
        }
      });
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filteredEvents = filteredEvents.filter(event => 
        event.category?.includes(filters.category)
      );
    }

    // Apply price filter
    if (filters.price !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        if (filters.price === 'free') {
          return !event.price || event.price.type?.toLowerCase() === 'free' || event.price.amount === 0;
        } else if (filters.price === 'paid') {
          return event.price && event.price.type?.toLowerCase() !== 'free' && event.price.amount > 0;
        }
        return true;
      });
    }

    // Apply CLE filter
    if (filters.cle === 'cle') {
      filteredEvents = filteredEvents.filter(event => 
        event.metadata?.cle_credits != null
      );
    }

    onFilteredEvents(filteredEvents);
  }, [events, filters, onFilteredEvents]);

  return (
    <FilterBar
      title="Filter Events"
      filters={filterConfig}
      onFilterChange={handleFilterChange}
      className={className}
    />
  );
} 