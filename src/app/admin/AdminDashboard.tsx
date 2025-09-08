'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminEvents } from './hooks/useAdminEvents';
import { useBulkOperations } from './hooks/useBulkOperations';
import PendingEventsTab from './components/PendingEventsTab';
import AllEventsTab from './components/AllEventsTab';
import CleanupTab from './components/CleanupTab';
import EventDialog from './components/EventDialog';
import { Event } from './types';

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState('pending');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const {
    pending,
    allEvents,
    isLoading,
    cleanupStats,
    isCleanupLoading,
    cleanupResult,
    fetchEvents,
    fetchCleanupStats,
    handleCleanup,
  } = useAdminEvents();

  const {
    selectedEvents,
    setSelectedEvents,
    bulkOperations,
    isBulkProcessing,
    handleSelectEvent,
    handleSelectAll,
    executeBulkOperation,
  } = useBulkOperations();

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    const viewEvent = searchParams.get('viewEvent');
    
    if (tab) {
      setCurrentTab(tab);
    }
    
    if (viewEvent) {
      const event = [...pending, ...allEvents].find(e => e.id === viewEvent);
      if (event) {
        setViewingEvent(event);
      }
    }
  }, [searchParams, pending, allEvents]);

  // Load cleanup stats when needed
  useEffect(() => {
    if (currentTab === 'cleanup' || currentTab === 'stats') {
      fetchCleanupStats();
    }
  }, [currentTab, fetchCleanupStats]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedEvents(new Set()); // Clear selection when changing tabs
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseDialog = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('viewEvent');
    router.replace(`/admin?${params.toString()}`);
    setViewingEvent(null);
    setEditingEvent(null);
  };

  const getCurrentTabEvents = (): Event[] => {
    switch (currentTab) {
      case 'pending': return pending;
      case 'all': return allEvents;
      case 'cancelled': return allEvents.filter(e => e.status === 'cancelled');
      case 'featured': return allEvents.filter(e => e.status === 'featured');
      default: return [];
    }
  };

  const handleBulkOperation = (operation: string) => {
    executeBulkOperation(operation as any, getCurrentTabEvents);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5b4636]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-[#c8b08a]">
        <button 
          onClick={() => handleTabChange('pending')}
          className={`pb-2 px-4 ${currentTab === 'pending' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Pending Events ({pending.length})
        </button>
        <button 
          onClick={() => handleTabChange('all')}
          className={`pb-2 px-4 ${currentTab === 'all' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          All Events ({allEvents.length})
        </button>
        <button 
          onClick={() => handleTabChange('cancelled')}
          className={`pb-2 px-4 ${currentTab === 'cancelled' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Cancelled Events ({allEvents.filter(e => e.status === 'cancelled').length})
        </button>
        <button 
          onClick={() => handleTabChange('featured')}
          className={`pb-2 px-4 ${currentTab === 'featured' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Featured Events ({allEvents.filter(e => e.status === 'featured').length})
        </button>
        <button 
          onClick={() => handleTabChange('cleanup')}
          className={`pb-2 px-4 ${currentTab === 'cleanup' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Cleanup
        </button>
      </div>

      {/* Tab Content */}
      {currentTab === 'pending' && (
        <PendingEventsTab
          pending={pending}
          selectedEvents={selectedEvents}
          isBulkProcessing={isBulkProcessing}
          onSelectEvent={handleSelectEvent}
          onSelectAll={handleSelectAll}
          onBulkOperation={handleBulkOperation}
          onEditEvent={handleEditEvent}
          onRefresh={fetchEvents}
        />
      )}

      {currentTab === 'all' && (
        <AllEventsTab
          allEvents={allEvents}
          selectedEvents={selectedEvents}
          isBulkProcessing={isBulkProcessing}
          onSelectEvent={handleSelectEvent}
          onSelectAll={handleSelectAll}
          onBulkOperation={handleBulkOperation}
          onRefresh={fetchEvents}
        />
      )}

      {currentTab === 'cancelled' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Cancelled Events</h2>
          <p className="text-[#5b4636]">Implementation similar to above...</p>
        </div>
      )}

      {currentTab === 'featured' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Events</h2>
          <p className="text-[#5b4636]">Implementation similar to above...</p>
        </div>
      )}

      {currentTab === 'cleanup' && (
        <CleanupTab
          cleanupStats={cleanupStats}
          isCleanupLoading={isCleanupLoading}
          cleanupResult={cleanupResult}
          onCleanup={handleCleanup}
        />
      )}

      {/* Bulk Operations Status */}
      {bulkOperations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Recent Operations</h3>
          {bulkOperations.slice(-3).map((op, index) => (
            <div key={index} className="text-sm">
              {op.type} - {op.status} {op.message && `(${op.message})`}
            </div>
          ))}
        </div>
      )}

      {/* Event Dialog */}
      <EventDialog
        event={editingEvent || viewingEvent}
        isOpen={!!(editingEvent || viewingEvent)}
        onClose={handleCloseDialog}
      />
    </div>
  );
}