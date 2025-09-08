export interface Event {
  id: string;
  name: string;
  description: string;
  status: string;
  submittedBy: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  communityId?: string;
}

export interface CleanupStats {
  pastEvents: number;
  oldCancelledEvents: number;
  oldDeniedEvents: number;
}

export interface BulkOperation {
  type: 'approve' | 'deny' | 'feature' | 'unfeature' | 'cancel' | 'uncancel' | 'archive' | 'delete';
  events: Event[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  timestamp: Date;
}
