'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const handleStarToggle = async (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    e.preventDefault();
    
    if (!session?.user) {
      toast.error('Please sign in to star events');
      return;
    }

    // Optimistic UI update - immediately update the visual state
    const previousState = isStarred;
    setIsStarred(!isStarred);
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
        // Confirm the state matches what the server returned
        setIsStarred(data.starred);
        // Show subtle success feedback (no toast spam)
      } else {
        // Revert on error
        setIsStarred(previousState);
        toast.error('Failed to update star status');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      // Revert on error
      setIsStarred(previousState);
      toast.error('Failed to update star status');
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
      className={`p-2 rounded-full transition-all duration-200 hover:bg-yellow-50 ${
        isStarred 
          ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100' 
          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
      } ${className}`}
      aria-label={isStarred ? 'Unstar event' : 'Star event'}
    >
      <Star 
        className={`w-5 h-5 transition-all duration-200 ${isStarred ? 'fill-current scale-110' : ''} ${isLoading ? 'opacity-70' : ''}`}
      />
    </button>
  );
} 