'use client';

import { CleanupStats } from '../types';

interface CleanupTabProps {
  cleanupStats: CleanupStats | null;
  isCleanupLoading: boolean;
  cleanupResult: string | null;
  onCleanup: () => void;
}

export default function CleanupTab({
  cleanupStats,
  isCleanupLoading,
  cleanupResult,
  onCleanup,
}: CleanupTabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Database Cleanup</h2>
      
      {cleanupStats && (
        <div className="bg-white border border-[#c8b08a] rounded p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">Cleanup Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{cleanupStats.pastEvents}</div>
              <div className="text-sm text-gray-600">Past Events</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{cleanupStats.oldCancelledEvents}</div>
              <div className="text-sm text-gray-600">Old Cancelled Events</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-600">{cleanupStats.oldDeniedEvents}</div>
              <div className="text-sm text-gray-600">Old Denied Events</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#c8b08a] rounded p-4">
        <h3 className="text-lg font-semibold mb-3">Cleanup Actions</h3>
        <p className="text-gray-600 mb-4">
          This will permanently delete old events that are no longer relevant. 
          This action cannot be undone.
        </p>
        
        <button
          onClick={onCleanup}
          disabled={isCleanupLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isCleanupLoading ? 'Cleaning up...' : 'Clean Up Old Events'}
        </button>
        
        {cleanupResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm">{cleanupResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
