import { useState } from 'react';
import { Event, BulkOperation } from '../types';

export function useBulkOperations() {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = (currentEvents: Event[]) => {
    if (selectedEvents.size === currentEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(currentEvents.map(e => e.id)));
    }
  };

  const getStatusFromOperation = (operation: string): string => {
    const statusMap: Record<string, string> = {
      'approve': 'approved',
      'deny': 'denied',
      'feature': 'featured',
      'unfeature': 'approved',
      'cancel': 'cancelled',
      'uncancel': 'approved',
      'archive': 'archived',
      'delete': 'deleted'
    };
    return statusMap[operation] || 'approved';
  };

  const updateEventStatus = async (eventId: string, operation: string): Promise<void> => {
    const newStatus = getStatusFromOperation(operation);
    console.log(`🔄 Updating event ${eventId} to status: ${newStatus} (from operation: ${operation})`);

    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update event: ${errorData.error || 'Unknown error'}`);
    }

    console.log(`✅ Successfully updated event ${eventId} to ${newStatus}`);
  };

  const executeBulkOperation = async (operation: BulkOperation['type'], getCurrentTabEvents: () => Event[]) => {
    if (selectedEvents.size === 0) {
      alert('Please select events first');
      return;
    }

    const events = getCurrentTabEvents().filter(e => selectedEvents.has(e.id));
    const operationId = Date.now().toString();
    
    const newOperation: BulkOperation = {
      type: operation,
      events,
      status: 'pending',
      timestamp: new Date()
    };

    setBulkOperations((prev: BulkOperation[]) => [...prev, newOperation]);
    setIsBulkProcessing(true);

    try {
      console.log(`🚀 Starting bulk ${operation} for ${events.length} events:`, events.map((e: Event) => e.name));
      
      // Update operation status
      setBulkOperations((prev: BulkOperation[]) => prev.map((op: BulkOperation) => 
        op.timestamp === newOperation.timestamp 
          ? { ...op, status: 'processing' }
          : op
      ));

      // Execute the operation
      const results = await Promise.allSettled(
        events.map(event => updateEventStatus(event.id, operation))
      );

      // Count successes and failures
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk ${operation} completed: ${successful} success, ${failed} failed`);

      // Update operation status
      setBulkOperations((prev: BulkOperation[]) => prev.map((op: BulkOperation) => 
        op.timestamp === newOperation.timestamp 
          ? { 
              ...op, 
              status: failed > 0 ? 'failed' : 'completed',
              message: `Completed: ${successful} success, ${failed} failed`
            }
          : op
      ));

      // Clear selection
      setSelectedEvents(new Set());

    } catch (error) {
      console.error(`❌ Bulk ${operation} failed:`, error);
      setBulkOperations((prev: BulkOperation[]) => prev.map((op: BulkOperation) => 
        op.timestamp === newOperation.timestamp 
          ? { ...op, status: 'failed', message: `Error: ${error}` }
          : op
      ));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return {
    selectedEvents,
    setSelectedEvents,
    bulkOperations,
    isBulkProcessing,
    handleSelectEvent,
    handleSelectAll,
    executeBulkOperation,
  };
}
