'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Star, Archive, Trash2, Edit, Eye, RefreshCw } from 'lucide-react';
import { Event } from '../types';

interface PendingEventsTabProps {
  pending: Event[];
  selectedEvents: Set<string>;
  isBulkProcessing: boolean;
  onSelectEvent: (eventId: string) => void;
  onSelectAll: (events: Event[]) => void;
  onBulkOperation: (operation: string) => void;
  onEditEvent: (event: Event) => void;
  onRefresh: () => void;
}

export default function PendingEventsTab({
  pending,
  selectedEvents,
  isBulkProcessing,
  onSelectEvent,
  onSelectAll,
  onBulkOperation,
  onEditEvent,
  onRefresh,
}: PendingEventsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = pending.filter((event: Event) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pending Events ({pending.length})</h2>
        <button
          onClick={onRefresh}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search events by name, description, or submitter..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-[#c8b08a] rounded"
        />
      </div>
      
      {/* Select All Checkbox */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <span className="font-medium">Select All Filtered Events</span>
        <input
          type="checkbox"
          checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
          onChange={() => onSelectAll(filteredEvents)}
          className="w-6 h-6 text-blue-600 rounded"
        />
      </div>

      {/* Bulk Actions */}
      {selectedEvents.size > 0 && (
        <div className="flex space-x-2 mb-4 p-3 bg-blue-50 rounded-lg">
          <button
            onClick={() => onBulkOperation('approve')}
            disabled={isBulkProcessing}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Approve All</span>
          </button>
          <button
            onClick={() => onBulkOperation('deny')}
            disabled={isBulkProcessing}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Deny All</span>
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {filteredEvents.map((event: Event) => (
          <div key={event.id} className="bg-white border border-[#c8b08a] rounded p-4">
            <div className="flex gap-4">
              {event.image && (
                <div className="flex-shrink-0">
                  <img 
                    src={event.image} 
                    alt={event.name}
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#5b4636] mb-2">{event.name}</h3>
                <p className="text-gray-600 mb-2 line-clamp-3">{event.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>Submitted by: {event.submittedBy}</span>
                  <span>Status: {event.status}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditEvent(event)}
                      className="px-3 py-1 rounded bg-blue-200 text-blue-900 font-semibold hover:bg-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                    <Link 
                      href={`/admin?tab=pending&viewEvent=${event.id}`}
                      className="px-3 py-1 rounded bg-indigo-200 text-indigo-900 font-semibold hover:bg-indigo-300 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                  
                  {/* Checkbox on the right side */}
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => onSelectEvent(event.id)}
                      className="w-6 h-6 text-blue-600 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
