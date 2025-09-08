import { useState, useEffect } from 'react';
import { Event, CleanupStats } from '../types';

export function useAdminEvents() {
  const [pending, setPending] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const [pendingResponse, allResponse] = await Promise.all([
        fetch('/api/events/pending'),
        fetch('/api/events/all')
      ]);
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPending(pendingData.events || []);
      }
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllEvents(allData.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const response = await fetch('/api/admin/cleanup');
      if (response.ok) {
        const stats = await response.json();
        setCleanupStats(stats);
      }
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete old events? This action cannot be undone.')) {
      return;
    }

    setIsCleanupLoading(true);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCleanupResult(`✅ ${result.message}`);
        await fetchCleanupStats();
        window.location.reload();
      } else {
        setCleanupResult(`❌ Cleanup failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      setCleanupResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    pending,
    allEvents,
    isLoading,
    cleanupStats,
    isCleanupLoading,
    cleanupResult,
    fetchEvents,
    fetchCleanupStats,
    handleCleanup,
  };
}
