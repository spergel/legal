'use server';

import fs from 'fs';
import path from 'path';
import { AllEventsCombinedData, Event, LocationsData, Location, CommunitiesData, Community } from '@/types';

const dataDir = path.join(process.cwd(), 'public', 'data');

// Cache loaded data to avoid reading files multiple times during a single build/request
let eventsCache: AllEventsCombinedData | null = null;
let locationsCache: LocationsData | null = null;
let communitiesCache: CommunitiesData | null = null;

async function loadAllEvents(): Promise<AllEventsCombinedData> {
  if (eventsCache) {
    return eventsCache;
  }
  try {
    const filePath = path.join(dataDir, 'all_events_combined.json');
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    eventsCache = JSON.parse(fileContents) as AllEventsCombinedData;
    // Basic validation (optional but good practice)
    if (!eventsCache || typeof eventsCache.total_events_combined !== 'number' || !Array.isArray(eventsCache.events)) {
        console.error('Invalid structure in all_events_combined.json');
        throw new Error('Invalid event data structure');
    }
    return eventsCache;
  } catch (error) {
    console.error('Failed to load or parse all_events_combined.json:', error);
    // Return a default structure or re-throw, depending on desired error handling
    return { last_updated_utc: '', total_events_combined: 0, events: [] };
  }
}

// Helper function to check if an event is upcoming
function isUpcomingEvent(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.startDate);
  return eventDate >= now;
}

export async function getAllEvents(): Promise<Event[]> {
  const events = await loadAllEvents();
  return events.events.filter(isUpcomingEvent).sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await getAllEvents();
  return events.find(event => event.id === id);
}

async function loadAllLocations(): Promise<LocationsData> {
  if (locationsCache) {
    return locationsCache;
  }
  try {
    const filePath = path.join(dataDir, 'locations.json');
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    locationsCache = JSON.parse(fileContents) as LocationsData;
    if (!locationsCache || !Array.isArray(locationsCache.locations)) {
        console.error('Invalid structure in locations.json');
        throw new Error('Invalid location data structure');
    }
    return locationsCache;
  } catch (error) {
    console.error('Failed to load or parse locations.json:', error);
    return { locations: [] };
  }
}

export async function getAllLocations(): Promise<Location[]> {
  const data = await loadAllLocations();
  return data.locations;
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  const locations = await getAllLocations();
  return locations.find(loc => loc.id === id);
}

async function loadAllCommunities(): Promise<CommunitiesData> {
  if (communitiesCache) {
    return communitiesCache;
  }
  try {
    const filePath = path.join(dataDir, 'communities.json');
    const fileContents = await fs.promises.readFile(filePath, 'utf8');
    communitiesCache = JSON.parse(fileContents) as CommunitiesData;
    if (!communitiesCache || !Array.isArray(communitiesCache.communities)) {
        console.error('Invalid structure in communities.json');
        throw new Error('Invalid community data structure');
    }
    return communitiesCache;
  } catch (error) {
    console.error('Failed to load or parse communities.json:', error);
    return { communities: [] };
  }
}

export async function getAllCommunities(): Promise<Community[]> {
  const data = await loadAllCommunities();
  return data.communities;
}

export async function getCommunityById(id: string): Promise<Community | undefined> {
  const communities = await getAllCommunities();
  return communities.find(com => com.id === id);
}

// Helper function to format date strings (example)
export async function formatDate(dateString: string): Promise<string> {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.warn(`Invalid date string for formatting: ${dateString}`);
    return 'Date not available';
  }
} 