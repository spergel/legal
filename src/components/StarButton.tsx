'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StarButtonProps {
  eventId: string;
  className?: string;
}

export default function StarButton({ eventId, className = '' }: StarButtonProps) {
  const { data: session } = useSession();
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial star status
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/events/${eventId}/star`)
        .then(res => res.json())
        .then(data => setIsStarred(data.starred))
        .catch(() => setIsStarred(false));
    }
  }, [eventId, session]);

  const handleStarToggle = async () => {
    if (!session?.user) {
      // Redirect to sign in or show sign in modal
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/star`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsStarred(data.starred);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null; // Don't show star button for non-logged-in users
  }

  return (
    <button
      onClick={handleStarToggle}
      disabled={isLoading}
      className={`transition-colors duration-200 ${
        isStarred 
          ? 'text-yellow-500 hover:text-yellow-600' 
          : 'text-gray-400 hover:text-yellow-500'
      } ${className}`}
      aria-label={isStarred ? 'Unstar event' : 'Star event'}
    >
      {isLoading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg 
          className="w-5 h-5" 
          fill={isStarred ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
          />
        </svg>
      )}
    </button>
  );
} 