'use client';

import { useState, useEffect, useMemo } from 'react';
import FilterBar, { FilterOption } from './FilterBar';
import { Event, EventType, PracticeArea, OrganizationType, SpecialtyGroup, Community } from '@/types';
import AdvancedFilterDialog from './AdvancedFilterDialog';
import { Star } from 'lucide-react';

interface EventWithFormattedDates extends Event {
  formattedStartDate: string;
  formattedEndDate: string | null;
}

interface EventsFilterProps {
  events: (Event & { formattedStartDate: string; formattedEndDate: string | null; })[];
  onFilteredEvents: (events: (Event & { formattedStartDate: string; formattedEndDate: string | null; })[]) => void;
  className?: string;
  showStarredOnly?: boolean;
  communities: Community[];
}

// Helper arrays from types
const allEventTypes: EventType[] = ['CLE', 'Networking', 'Annual Dinner', 'Pro Bono', 'Board Meeting', 'Gala', 'Pride Event', 'Screening', 'Event', 'Dinner/Gala'];
const allPracticeAreas: PracticeArea[] = ['Intellectual Property', 'Criminal Law', 'Immigration', 'Civil Rights', 'Employment Law', 'Family Law', 'Real Estate', 'Bankruptcy', 'Entertainment Law', 'International Law', 'Litigation', 'Mediation', 'Disability Law', 'Water', 'Environmental'];
const allOrganizationTypes: OrganizationType[] = ['Bar Association', 'Legal Events', 'CLE Provider', 'Law School', 'Legal Organization'];
const allSpecialtyGroups: SpecialtyGroup[] = ['Asian American', 'Hispanic', 'LGBTQ+', 'Women in Law', 'Young Lawyers', 'Solo/Small Firm'];

export default function EventsFilter({ events, onFilteredEvents, className = '', showStarredOnly = false, communities }: EventsFilterProps) {
  const [filters, setFilters] = useState({
    starred: 'all',
    date: 'all',
    cle: 'all',
    communityId: 'all',
    eventTypes: [] as string[],
    practiceAreas: [] as string[],
    organizationTypes: [] as string[],
    specialtyGroups: [] as string[],
    startDate: '',
    endDate: '',
  });

  const [isAdvancedDialogOpen, setAdvancedDialogOpen] = useState(false);
  const [starredEventIds, setStarredEventIds] = useState<string[]>([]);
  const [isLoadingStarred, setIsLoadingStarred] = useState(false);

  // Add logging to debug the events data
  useEffect(() => {
    console.log('EventsFilter received events:', events);
    console.log('Events array length:', events?.length || 0);
    if (events && events.length > 0) {
      console.log('First event sample:', events[0]);
    }
  }, [events]);

  // Load starred events for filtering
  useEffect(() => {
    setIsLoadingStarred(true);
    fetch('/api/user/starred-events')
      .then(res => res.json())
      .then(data => {
        try {
          if (data.events && Array.isArray(data.events)) {
            setStarredEventIds(data.events.map((event: Event) => event.id));
          } else {
            setStarredEventIds([]);
          }
        } catch (error) {
          console.error('Error processing starred events:', error);
          setStarredEventIds([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching starred events:', error);
        setStarredEventIds([]);
      })
      .finally(() => setIsLoadingStarred(false));
  }, []);

  // Define options for all filters
  const dateOptions: FilterOption[] = [
    { id: 'date-all', label: 'All Dates', value: 'all' },
    { id: 'date-today', label: 'Today', value: 'today' },
    { id: 'date-tomorrow', label: 'Tomorrow', value: 'tomorrow' },
    { id: 'date-this-week', label: 'This Week', value: 'this-week' },
    { id: 'date-this-month', label: 'This Month', value: 'this-month' },
  ];

  const cleOptions: FilterOption[] = [
    { id: 'cle-all', label: 'All', value: 'all' },
    { id: 'cle-only', label: 'CLE Events Only', value: 'cle' },
    { id: 'cle-credits', label: 'CLE with Credits', value: 'cle-with-credits' },
    { id: 'cle-not', label: 'Not CLE Events', value: 'not-cle' },
  ];

  // Derive available options for advanced filters from events
  const eventTypes = useMemo(() => allEventTypes.filter(type => (events || []).some(event => event.eventType === type || (event.category || []).includes(type))), [events]);
  const practiceAreas = useMemo(() => allPracticeAreas.filter(area => (events || []).some(event => (event.category || []).includes(area))), [events]);
  const organizationTypes = useMemo(() => allOrganizationTypes.filter(type => (events || []).some(event => (event.category || []).includes(type))), [events]);
  const specialtyGroups = useMemo(() => allSpecialtyGroups.filter(group => (events || []).some(event => (event.category || []).includes(group))), [events]);

  const starredOptions: FilterOption[] = [
    { id: 'all-events', label: 'All Events', value: 'all' },
    { id: 'starred-events', label: 'Starred Events Only', value: 'starred', icon: <Star className="w-4 h-4 text-amber-500" /> },
  ];
  
  const communityOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [
        { id: 'community-all', value: 'all', label: 'All Communities' },
        { id: 'community-uni', value: 'cat-University', label: 'All University Events' },
        { id: 'community-bar', value: 'cat-Bar Association', label: 'All Bar Association Events' },
    ];
    (communities || []).forEach(c => {
        options.push({ id: c.id, value: c.id, label: c.name });
    });
    return options;
  }, [communities]);

  const filterConfig = [
    { id: 'communityId', label: 'Community', options: communityOptions },
    { id: 'date', label: 'Date', options: dateOptions },
    { id: 'cle', label: 'CLE', options: cleOptions },
    { id: 'starred', label: 'Starred', options: starredOptions },
  ];

  const handleFilterChange = (filterKey: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: value };
      // If a preset date is chosen, clear custom dates
      if (filterKey === 'date' && value !== 'all') {
        newFilters.startDate = '';
        newFilters.endDate = '';
      }
      // If a custom date is entered, clear the preset
      if ((filterKey === 'startDate' || filterKey === 'endDate') && value !== '') {
        newFilters.date = 'all';
      }
      return newFilters;
    });
  };

  useEffect(() => {
    let filteredEvents = [...events];

    // Apply date filters
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      filteredEvents = filteredEvents.filter(event => {
        if (!event.startDate) return false;
        const eventDate = new Date(event.startDate);
        return eventDate >= start && eventDate <= end;
      });
    } else if (filters.date !== 'all') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      filteredEvents = filteredEvents.filter(event => {
        if (!event || !event.startDate) return false;
            
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

    // Apply CLE filter
    if (filters.cle !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        const isCle = event.eventType === 'CLE' || (event.category || []).includes('CLE');
        if (filters.cle === 'cle') return isCle;
        if (filters.cle === 'cle-with-credits') return event.cleCredits && event.cleCredits > 0;
        if (filters.cle === 'not-cle') return !isCle;
        return true;
      });
    }
    
    // Apply starred filter
    if (showStarredOnly || filters.starred === 'starred') {
      filteredEvents = filteredEvents.filter(event => event && event.id && starredEventIds.includes(event.id));
    }
    
    // Apply community filter
    if (filters.communityId && filters.communityId !== 'all') {
      if (filters.communityId.startsWith('cat-')) {
        const category = filters.communityId.replace('cat-', '');
        const communityIds = (communities || []).filter(c => (c.category || []).includes(category)).map(c => c.id);
        filteredEvents = filteredEvents.filter(event => event.communityId && communityIds.includes(event.communityId));
      } else {
        filteredEvents = filteredEvents.filter(event => event.communityId === filters.communityId);
      }
    }
    
    // Apply advanced multi-select filters
    if (filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.eventTypes.some(type => 
          event.eventType === type || (event.category || []).includes(type)
        )
      );
    }
    if (filters.practiceAreas.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.practiceAreas.some(area => (event.category || []).includes(area))
      );
    }
    if (filters.organizationTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.organizationTypes.some(type => (event.category || []).includes(type))
      );
    }
    if (filters.specialtyGroups.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.specialtyGroups.some(group => (event.category || []).includes(group))
      );
    }

    onFilteredEvents(filteredEvents);
  }, [filters, events, onFilteredEvents, starredEventIds, showStarredOnly, communities]);

  if (isLoadingStarred && (showStarredOnly || filters.starred === 'starred')) {
    return <div className="text-center py-4">Loading starred events...</div>;
  }

  return (
    <>
      <FilterBar
        title="Filter Events"
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        className={className}
        currentFilters={filters}
      >
        <button
          onClick={() => setAdvancedDialogOpen(true)}
          className="ml-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Advanced Filters
        </button>
      </FilterBar>
      <AdvancedFilterDialog
        isOpen={isAdvancedDialogOpen}
        onClose={() => setAdvancedDialogOpen(false)}
        availableFilters={{ dateOptions, cleOptions, eventTypes, practiceAreas, organizationTypes, specialtyGroups }}
        appliedFilters={filters}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
