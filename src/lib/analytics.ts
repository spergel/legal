// Analytics utility functions for tracking user interactions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

// Google Analytics 4 Events
export const trackGAEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Facebook Pixel Events
export const trackPixelEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Event-specific tracking functions
export const trackEventView = (eventName: string, eventId: string) => {
  trackGAEvent('view_item', 'Event', eventName, undefined);
  trackPixelEvent('ViewContent', {
    content_name: eventName,
    content_ids: [eventId],
    content_type: 'event',
  });
};

export const trackEventClick = (eventName: string, eventId: string, source: string) => {
  trackGAEvent('click', 'Event', `${eventName} - ${source}`, undefined);
  trackPixelEvent('Lead', {
    content_name: eventName,
    content_ids: [eventId],
    content_type: 'event',
    source: source,
  });
};

export const trackEventBookmark = (eventName: string, eventId: string) => {
  trackGAEvent('add_to_wishlist', 'Event', eventName, undefined);
  trackPixelEvent('AddToWishlist', {
    content_name: eventName,
    content_ids: [eventId],
    content_type: 'event',
  });
};

export const trackEventSubmission = (eventName: string) => {
  trackGAEvent('submit', 'Event_Submission', eventName, undefined);
  trackPixelEvent('CompleteRegistration', {
    content_name: eventName,
    content_type: 'event_submission',
  });
};

export const trackNewsletterSignup = (source: string) => {
  trackGAEvent('sign_up', 'Newsletter', source, undefined);
  trackPixelEvent('CompleteRegistration', {
    content_name: 'Newsletter Signup',
    content_type: 'newsletter',
    source: source,
  });
};

export const trackCalendarExport = (format: 'ics' | 'rss', eventCount: number) => {
  trackGAEvent('download', 'Calendar_Export', format, eventCount);
  trackPixelEvent('Lead', {
    content_name: `Calendar Export - ${format.toUpperCase()}`,
    content_type: 'calendar_export',
    value: eventCount,
  });
};

export const trackPageView = (page: string) => {
  trackGAEvent('page_view', 'Navigation', page, undefined);
  trackPixelEvent('PageView', {
    page_title: page,
  });
};

// UTM Parameter tracking
export const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
  };
};

// Enhanced tracking with UTM parameters
export const trackEventWithUTM = (action: string, category: string, label?: string, value?: number) => {
  const utmParams = getUTMParams();
  const hasUTM = Object.values(utmParams).some(param => param !== null);
  
  if (hasUTM) {
    trackGAEvent(action, category, `${label} - UTM: ${JSON.stringify(utmParams)}`, value);
  } else {
    trackGAEvent(action, category, label, value);
  }
};
