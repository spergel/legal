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

  // Add logging to debug the events data
  useEffect(() => {
    console.log('EventsFilter received events:', events);
    console.log('Events array length:', events?.length || 0);
    if (events && events.length > 0) {
      console.log('First event sample:', events[0]);
    }
  }, [events]);

  // Generate filter options from events data
  const dateOptions: FilterOption[] = [
    { id: 'all', label: 'All Dates', value: 'all' },
    { id: 'today', label: 'Today', value: 'today' },
    { id: 'tomorrow', label: 'Tomorrow', value: 'tomorrow' },
    { id: 'this-week', label: 'This Week', value: 'this-week' },
    { id: 'this-month', label: 'This Month', value: 'this-month' },
  ];

  // Safely extract categories from events
  const categories = (events || [])
    .flatMap(event => {
      try {
        // Ensure event and category exist before accessing
        if (!event || !event.category) return [];
        return Array.isArray(event.category) ? event.category : [];
      } catch (error) {
        console.error('Error extracting category from event:', error, event);
        return [];
      }
    })
    .filter(Boolean);
  
  const categoryOptions: FilterOption[] = [
    { id: 'all', label: 'All Categories', value: 'all' },
    ...Array.from(new Set(categories))
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
    try {
      console.log('Applying filters to events:', events?.length || 0);
      
      // Ensure events is an array
      if (!Array.isArray(events)) {
        console.warn('Events is not an array, using empty array');
        onFilteredEvents([]);
        return;
      }

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
          try {
            if (!event || !event.startDate) {
              console.warn('Event missing startDate:', event);
              return false;
            }
            
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
          } catch (error) {
            console.error('Error filtering event by date:', error, event);
            return false;
          }
        });
      }

      // Apply category filter
      if (filters.category !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
          try {
            return event && event.category && Array.isArray(event.category) && event.category.includes(filters.category);
          } catch (error) {
            console.error('Error filtering event by category:', error, event);
            return false;
          }
        });
      }

      // Apply price filter
      if (filters.price !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
          try {
            if (!event || !event.price) {
              return filters.price === 'free';
            }
            
            // Handle price as Record<string, any>
            const priceType = event.price.type || event.price.priceType || '';
            const priceAmount = event.price.amount || event.price.priceAmount || 0;
            
            if (filters.price === 'free') {
              return !priceType || priceType.toLowerCase() === 'free' || priceAmount === 0;
            } else if (filters.price === 'paid') {
              return priceType && priceType.toLowerCase() !== 'free' && priceAmount > 0;
            }
            return true;
          } catch (error) {
            console.error('Error filtering event by price:', error, event);
            return false;
          }
        });
      }

      // Apply CLE filter
      if (filters.cle === 'cle') {
        filteredEvents = filteredEvents.filter(event => {
          try {
            return event && event.metadata && event.metadata.cle_credits != null;
          } catch (error) {
            console.error('Error filtering event by CLE:', error, event);
            return false;
          }
        });
      }

      console.log('Filtered events count:', filteredEvents.length);
      onFilteredEvents(filteredEvents);
    } catch (error) {
      console.error('Error in EventsFilter useEffect:', error);
      onFilteredEvents([]);
    }
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