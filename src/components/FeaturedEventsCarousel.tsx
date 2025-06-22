'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { getAllEvents } from '@/lib/data-loader';
import Link from 'next/link';
import EventDialog from './EventDialog';

export default function FeaturedEventsCarousel() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);
        const events = await getAllEvents();
        
        // Filter for featured events only
        const featured = events.filter(event => event.status === 'FEATURED');
        setFeaturedEvents(featured);
      } catch (err) {
        console.error('Error loading featured events:', err);
        setError('Failed to load featured events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredEvents.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredEvents.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredEvents.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl animate-pulse flex items-center justify-center">
        <div className="text-amber-800 text-lg">Loading featured events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (featuredEvents.length === 0) {
    return null; // Don't show anything if no featured events
  }

  const currentEvent = featuredEvents[currentIndex];

  return (
    <div className="relative w-full h-96 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl overflow-hidden shadow-xl">
      {/* Background Image */}
      {currentEvent.image && (
        <div className="absolute inset-0">
          <img 
            src={currentEvent.image} 
            alt={currentEvent.name}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      )}
      
      {/* Content Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-900/80 flex items-center">
        <div className="container mx-auto px-8">
          <div className="max-w-2xl">
            {/* Featured Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                ⭐ Featured Event
              </span>
            </div>
            
            {/* Event Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {currentEvent.name}
            </h2>
            
            {/* Event Details */}
            <div className="text-white/90 mb-6 space-y-2">
              <p className="text-xl">
                📅 {new Date(currentEvent.startDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
              {currentEvent.metadata?.cle_credits && (
                <p className="text-lg">🎓 CLE Credits: {currentEvent.metadata.cle_credits}</p>
              )}
              {currentEvent.price && (currentEvent.price.type?.toLowerCase() === 'free' || currentEvent.price.amount === 0) ? (
                <p className="text-lg text-green-300 font-semibold">💰 FREE</p>
              ) : currentEvent.price && (
                <p className="text-lg">💰 {currentEvent.price.currency}{currentEvent.price.amount.toFixed(2)}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setSelectedEventId(currentEvent.id)}
                className="bg-white text-amber-900 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-amber-100 transition-colors"
              >
                View Details
              </button>
              <Link 
                href="/events" 
                className="bg-amber-100 text-amber-900 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-white transition-colors text-center"
              >
                Browse All Events
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {featuredEvents.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Previous event"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Next event"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {featuredEvents.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {featuredEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Event Dialog */}
      {selectedEventId && (
        <EventDialog 
          eventId={selectedEventId} 
          onClose={() => setSelectedEventId(null)} 
        />
      )}
    </div>
  );
} 