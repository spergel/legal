export interface Price {
  amount: number;
  type: string;
  currency: string;
  details: string | null;
}

export interface Organizer {
  name: string | null;
  type: string | null;
}

export interface Venue {
  name: string | null;
  address: string | null;
  type: string | null;
}

export interface Contact {
  email: string | null;
  phone: string | null;
  name: string | null;
}

export interface EventMetadata {
  source_name: string | null;
  source_url: string | null;
  source_event_id: string | null;
  organizer: Organizer | null;
  venue: Venue | null;
  speakers: unknown[]; // Define more specifically if structure is known
  contact: Contact | null;
  accessibility_info: string | null;
  last_modified_source: string | null;
  cle_credits: string | null;
}

export interface Event {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  communityId: string | null;
  locationId: string | null;
  description: string | null;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  image: string | null;
  tags: string[];
  category: string[];
  price: Price | null;
  capacity: number | null;
  registrationRequired: boolean | null;
  metadata: EventMetadata | null;
  // Optional: Add fields from linked data if you plan to merge them
  // location?: Location;
  // community?: Community;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip?: string | null; // Optional as not all locations have it
  type: string; // e.g., "Online", "Offline"
  communityId: string | null;
}

export interface CommunityLocation { // Used within Community object
  address?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip?: string | null;
}

export interface Community {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  category: string[];
  location: CommunityLocation | null;
  // Optional: Add fields for events if you plan to list them here
  // events?: Event[];
}

// For the top-level structure of the JSON files
export interface AllEventsCombinedData {
  last_updated_utc: string;
  total_events_combined: number;
  events: Event[];
}

export interface LocationsData {
  locations: Location[];
}

export interface CommunitiesData {
  communities: Community[];
} 