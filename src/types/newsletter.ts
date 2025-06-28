export interface Newsletter {
  id?: string;
  title: string;
  subject: string;
  content: string;
  status: string;
  createdBy?: string;
  createdAt?: string;
  scheduledAt?: string;
  sentAt?: string;
  recipients?: number;
  opens?: number;
  clicks?: number;
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
} 