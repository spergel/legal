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
  externalId?: string | null;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  locationName: string;
  url?: string | null;
  cleCredits?: number | null;
  status: string;
  submittedBy: string;
  submittedAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
  notes?: string | null;
  locationId?: string | null;
  location?: Location | null;
  communityId?: string | null;
  community?: Community | null;
  tags?: string[] | null;
  image?: string | null;
  metadata?: EventMetadata | null;
  price?: Record<string, any> | null;
  category?: string[] | null;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null; // Optional: not always present from DB
  type?: string; // Optional: not always present from DB
  communityId?: string | null; // Optional: not always present from DB
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
  url?: string | null;
  description: string | null;
  category?: string[];
  location?: CommunityLocation | null;
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

export type EventStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'FEATURED' | 'CANCELLED' | 'ARCHIVED'; 