'use client';

import { useEffect, useState } from 'react';
import { Event } from '@/types';
import { formatDate } from '@/lib/data-loader';

interface EventDialogProps {
  eventId: string;
  onClose: () => void;
}

export default function EventDialog({ eventId, onClose }: EventDialogProps) {
  const [eventData, setEventData] = useState<Event | null>(null);
  const [formattedStartDate, setFormattedStartDate] = useState<string>('');
  const [formattedEndDate, setFormattedEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }
        const data = await response.json();
        setEventData(data);

        // Format dates - data.startDate and data.endDate are already ISO strings from the API
        const startDate = await formatDate(data.startDate);
        const endDate = data.endDate ? await formatDate(data.endDate) : null;
        setFormattedStartDate(startDate);
        setFormattedEndDate(endDate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <p className="text-center text-red-600">{error || 'Event not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-amber-900">{eventData.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-amber-800">
                <span className="font-semibold">Date:</span> {formattedStartDate}
                {formattedEndDate && <> - {formattedEndDate}</>}
              </p>
              <p className="text-amber-800">
                <span className="font-semibold">Location:</span> {eventData.locationName || 'Online/TBD'}
              </p>
              {eventData.cleCredits && (
                <p className="text-amber-800">
                  <span className="font-semibold">CLE Credits:</span> {eventData.cleCredits}
                </p>
              )}
              {eventData.community && (
                <p className="text-amber-800">
                  <span className="font-semibold">Community:</span> {eventData.community.name}
                </p>
              )}
            </div>

            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: eventData.description || '' }} />
            </div>

            {eventData.url && (
              <div className="mt-6">
                <a
                  href={eventData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  View Event Website
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 