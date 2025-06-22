'use client';

import { useState, useRef, useEffect } from 'react';
import EventsList from './EventsList';
import { Community, Event } from '@/types';

export default function EventsClientPage({
  events,
  communities,
  showStarredOnly = false,
}: {
  events: any[];
  communities: Community[];
  showStarredOnly?: boolean;
}) {
  // Ensure events is always an array
  const safeEvents = events || [];

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <EventsList events={safeEvents} communities={communities} showStarredOnly={showStarredOnly} />
    </div>
  );
} 