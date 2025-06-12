'use client';

import { getEventById, getLocationById, getCommunityById, formatDate } from '@/lib/data-loader';
import { Event, Location, Community } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface EventDialogProps {
  eventId: string;
  onClose: () => void;
}

export default function EventDialog({ eventId, onClose }: EventDialogProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [formattedStartDate, setFormattedStartDate] = useState<string>('');
  const [formattedEndDate, setFormattedEndDate] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const eventData = await getEventById(eventId);
      if (!eventData) return;
      
      setEvent(eventData);
      
      if (eventData.locationId) {
        const locationData = await getLocationById(eventData.locationId);
        setLocation(locationData || null);
      }
      
      if (eventData.communityId) {
        const communityData = await getCommunityById(eventData.communityId);
        setCommunity(communityData || null);
      }

      const startDate = await formatDate(eventData.startDate);
      const endDate = await formatDate(eventData.endDate);
      setFormattedStartDate(startDate);
      setFormattedEndDate(endDate);
    }

    loadData();
  }, [eventId]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-amber-50 p-6 sm:p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-amber-200">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 break-words">{event.name}</h1>
          <button 
            onClick={onClose}
            className="text-amber-800 hover:text-amber-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            {event.image && (
              <img src={event.image} alt={event.name} className="w-full h-auto max-h-96 object-cover rounded-lg mb-6 shadow-md" />
            )}
            <h2 className="text-2xl font-semibold text-amber-900 mb-3">Event Details</h2>
            {event.description ? (
              <div 
                className="prose prose-amber max-w-none text-amber-900"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : (
              <p className="text-amber-800">No detailed description available.</p>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Date & Time</h3>
              <p className="text-amber-800">
                <strong>Starts:</strong> {formattedStartDate}
              </p>
              <p className="text-amber-800">
                <strong>Ends:</strong> {formattedEndDate}
              </p>
            </div>

            {event.metadata?.cle_credits && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-3">CLE Credits</h3>
                <p className="text-amber-800">{event.metadata.cle_credits}</p>
              </div>
            )}

            {(location || event.metadata?.venue?.name) && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Location</h3>
                <p className="text-amber-800 font-semibold">{location?.name || event.metadata?.venue?.name}</p>
                {location?.address && <p className="text-amber-800">{location.address}</p>}
                {(location?.city || location?.state || location?.zip) && 
                  <p className="text-amber-800">
                    {location.city}{location.city && (location.state || location.zip) ? ', ' : ''}
                    {location.state} {location.zip}
                  </p>
                }
                {location?.type && <p className="text-amber-700 text-sm">Type: {location.type}</p>}
                {event.metadata?.venue?.type && !location?.type && <p className="text-amber-700 text-sm">Type: {event.metadata.venue.type}</p>}
              </div>
            )}

            {community && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Hosted By</h3>
                <Link href={`/resources/${community.id}`} className="text-amber-800 hover:text-amber-700 font-medium">
                  {community.name}
                </Link>
                {community.url && 
                  <a href={community.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-amber-800 hover:text-amber-700 mt-1">
                    Visit Organization Site &rarr;
                  </a>
                }
              </div>
            )}
            
            {event.price && (event.price.type?.toLowerCase() === 'free' || event.price.amount === 0) && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Price</h3>
                <p className="text-2xl font-bold text-green-700">FREE</p>
              </div>
            )}
            {event.price && event.price.type?.toLowerCase() !== 'free' && event.price.amount > 0 && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Price</h3>
                <p className="text-2xl font-bold text-amber-800">{event.price.currency}{event.price.amount.toFixed(2)}</p>
                {event.price.details && <p className="text-amber-700 text-sm">{event.price.details}</p>}
              </div>
            )}

            {event.metadata?.source_url && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Registration</h3>
                <a href={event.metadata.source_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                  Register Now &rarr;
                </a>
              </div>
            )}

            {event.tags && event.tags.length > 0 && (
              <div className="bg-amber-100 p-4 rounded-lg shadow border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Practice Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="bg-amber-200 text-amber-900 text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 