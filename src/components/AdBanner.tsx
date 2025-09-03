'use client';

import { useState, useEffect } from 'react';
import { trackGAEvent, trackPixelEvent } from '@/lib/analytics';

interface AdBannerProps {
  position: 'homepage-top' | 'homepage-sidebar' | 'events-sidebar' | 'newsletter';
  size: 'banner' | 'sidebar' | 'newsletter';
  className?: string;
}

interface AdData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  advertiser: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
}

export default function AdBanner({ position, size, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from your ad management system
    // For now, we'll use mock data
    const mockAd: AdData = {
      id: 'ad-001',
      title: 'Featured Legal Event',
      description: 'Join us for exclusive CLE opportunities',
      imageUrl: '/placeholder-ad.jpg',
      linkUrl: 'https://example.com/event',
      advertiser: 'Legal Events Partner',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      impressions: 0,
      clicks: 0,
    };

    // Simulate API call
    setTimeout(() => {
      setAd(mockAd);
      setIsLoading(false);
    }, 500);
  }, [position]);

  const handleAdClick = () => {
    if (!ad) return;

    // Track ad click
    trackGAEvent('click', 'Advertisement', `${ad.title} - ${position}`, undefined);
    trackPixelEvent('Lead', {
      content_name: ad.title,
      content_ids: [ad.id],
      content_type: 'advertisement',
      source: position,
    });

    // In production, you'd also send this to your ad tracking API
    console.log(`Ad clicked: ${ad.id} at position ${position}`);
  };

  const handleAdImpression = () => {
    if (!ad) return;

    // Track ad impression
    trackGAEvent('view', 'Advertisement', `${ad.title} - ${position}`, undefined);
    trackPixelEvent('ViewContent', {
      content_name: ad.title,
      content_ids: [ad.id],
      content_type: 'advertisement',
      source: position,
    });

    // In production, you'd also send this to your ad tracking API
    console.log(`Ad impression: ${ad.id} at position ${position}`);
  };

  useEffect(() => {
    if (ad) {
      handleAdImpression();
    }
  }, [ad]);

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${getSizeClasses(size)} ${className}`}>
        <div className="h-full w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !ad) {
    return null; // Don't show anything if no ad available
  }

  return (
    <div className={`ad-banner ${getSizeClasses(size)} ${className}`}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="block w-full h-full hover:opacity-90 transition-opacity"
      >
        <div className="relative w-full h-full">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = '/placeholder-ad.jpg';
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
            <div className="text-xs font-semibold">{ad.title}</div>
            <div className="text-xs opacity-75">{ad.description}</div>
          </div>
          <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded font-semibold">
            AD
          </div>
        </div>
      </a>
    </div>
  );
}

function getSizeClasses(size: string): string {
  switch (size) {
    case 'banner':
      return 'w-full h-32 md:h-40';
    case 'sidebar':
      return 'w-full h-64';
    case 'newsletter':
      return 'w-full h-48';
    default:
      return 'w-full h-32';
  }
}
