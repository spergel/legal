'use client';

import Link from 'next/link';
import { Event, Community } from '@/types';
import { useState, useEffect, useRef, useMemo } from 'react';
import EventDialog from '@/components/EventDialog';
import EventsFilter from '@/components/EventsFilter';
import StarButton from '@/components/StarButton';
import AddToCalendarDialog from '@/components/AddToCalendarDialog';
import EventCategories from '@/components/EventCategories';
import { Button, Badge } from '@/components/ui';
import { formatEventDate, formatEventTime, truncateText } from '@/lib/utils';
import { Calendar, MapPin, Clock, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface EventsListProps {
  events: (Event & {
    formattedStartDate: string;
    formattedEndDate: string | null;
  })[];
  communities: Community[];
  showStarredOnly?: boolean;
}

// Helper to get a snippet of the description
function getDescriptionSnippet(htmlDescription: string | null | undefined, maxLength: number = 100): string {
  if (!htmlDescription) return 'No description available.';
  // Strip HTML tags (basic version)
  const text = htmlDescription.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function EventsList({ events: initialEvents, communities, showStarredOnly = false }: EventsListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState(initialEvents || []);
  const [starredEventIds, setStarredEventIds] = useState<string[]>([]);
  const [isLoadingStarred, setIsLoadingStarred] = useState(false);
  const [isAddToCalendarOpen, setIsAddToCalendarOpen] = useState(false);

  // Add logging to debug the events data
  useEffect(() => {
    console.log('EventsList received initialEvents:', initialEvents);
    console.log('Initial events array length:', initialEvents?.length || 0);
    if (initialEvents && initialEvents.length > 0) {
      console.log('First event sample:', initialEvents[0]);
    }
  }, [initialEvents]);

  // Update filtered events when initialEvents changes
  useEffect(() => {
    try {
      console.log('Updating filtered events from initialEvents:', initialEvents?.length || 0);
      setFilteredEvents(initialEvents || []);
    } catch (error) {
      console.error('Error updating filtered events:', error);
      setFilteredEvents([]);
    }
  }, [initialEvents]);

  // Load starred events for filtering
  useEffect(() => {
    if (showStarredOnly) {
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
    }
  }, [showStarredOnly]);

  // Apply all filters to get the final list of events
  const eventsToShow = (filteredEvents || []).filter(event => {
    // Starred filter
    if (showStarredOnly && !(event && event.id && starredEventIds.includes(event.id))) {
      return false;
    }
    return true; // If no source filters, show all
  });

  // Export URLs for calendar
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const icsUrl = `${baseUrl}/api/events/ics`;

  const handleDownloadICS = () => {
    window.open(icsUrl, '_blank');
    toast.success('Calendar download started!');
  };

  const handleCopyICS = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      toast.success('ICS link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenGoogleCalendar = () => {
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;
    window.open(googleUrl, '_blank');
    toast.success('Opening Google Calendar...');
  };

  if (showStarredOnly && isLoadingStarred) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading starred events...</p>
        </div>
      </div>
    );
  }

  if (!initialEvents || initialEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No events found at the moment. Check back soon!</p>
      </div>
    );
  }

  if (showStarredOnly && eventsToShow.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No starred events found. Star some events to see them here!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-800 flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          {showStarredOnly ? 'Starred Events' : 'Events'}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsAddToCalendarOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Export Calendar
          </Button>
        </div>
      </div>
      
      <EventsFilter 
        events={initialEvents}
        onFilteredEvents={setFilteredEvents}
        className="mb-8"
        showStarredOnly={showStarredOnly}
        communities={communities}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsToShow.map((event) => {
          try {
            // Ensure event has required properties
            if (!event || !event.id || !event.name) {
              console.warn('Skipping invalid event:', event);
              return null;
            }

            return (
              <div
                key={event.id}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer hover:border-amber-300"
                onClick={() => setSelectedEventId(event.id)}
              >
                <div className="p-6 relative">
                  {/* Star button */}
                  <div className="absolute top-4 right-4 z-10">
                    <StarButton eventId={event.id} />
                  </div>
                  
                  {/* Event Categories */}
                  <div className="mb-3">
                    <EventCategories 
                      event={event} 
                      showTags={false} 
                      maxCategories={3}
                    />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2" title={event.name}>
                    {truncateText(event.name, 60)}
                  </h2>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{event.formattedStartDate || 'Date not available'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{event.locationText || 'Online/TBD'}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 line-clamp-3">
                    {getDescriptionSnippet(event.description, 120)}
                  </p>
                </div>
              </div>
            );
          } catch (error) {
            console.error('Error rendering event:', error, event);
            return null;
          }
        })}
      </div>

      {/* Dialogs */}
      {selectedEventId && (
        <EventDialog
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      <AddToCalendarDialog
        isOpen={isAddToCalendarOpen}
        onClose={() => setIsAddToCalendarOpen(false)}
        communities={communities}
      />
    </div>
  );
} 