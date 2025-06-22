'use client';

import { Community } from '@/types';
import { useState, useEffect, useRef } from 'react';

interface AddToCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
}

// Define community categories
const communityCategories = {
  UNIVERSITY: 'University',
  BAR_ASSOCIATION: 'Bar Association',
  // Add other categories as needed
};

export default function AddToCalendarDialog({ isOpen, onClose, communities }: AddToCalendarDialogProps) {
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<string[]>([]);
  const [cleOnly, setCleOnly] = useState(false);

  const universityCheckboxRef = useRef<HTMLInputElement>(null);
  const barCheckboxRef = useRef<HTMLInputElement>(null);

  const universityCommunities = communities.filter(c => (c.category || []).includes(communityCategories.UNIVERSITY));
  const barCommunities = communities.filter(c => (c.category || []).includes(communityCategories.BAR_ASSOCIATION));

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setSelectedCommunityIds([]);
      setCleOnly(false);
    }
  }, [isOpen]);

  // Handle indeterminate states
  useEffect(() => {
    const universitySelectedCount = universityCommunities.filter(c => selectedCommunityIds.includes(c.id)).length;
    if (universityCheckboxRef.current) {
      if (universitySelectedCount === 0) {
        universityCheckboxRef.current.checked = false;
        universityCheckboxRef.current.indeterminate = false;
      } else if (universitySelectedCount === universityCommunities.length) {
        universityCheckboxRef.current.checked = true;
        universityCheckboxRef.current.indeterminate = false;
      } else {
        universityCheckboxRef.current.checked = false;
        universityCheckboxRef.current.indeterminate = true;
      }
    }

    const barSelectedCount = barCommunities.filter(c => selectedCommunityIds.includes(c.id)).length;
    if (barCheckboxRef.current) {
      if (barSelectedCount === 0) {
        barCheckboxRef.current.checked = false;
        barCheckboxRef.current.indeterminate = false;
      } else if (barSelectedCount === barCommunities.length) {
        barCheckboxRef.current.checked = true;
        barCheckboxRef.current.indeterminate = false;
      } else {
        barCheckboxRef.current.checked = false;
        barCheckboxRef.current.indeterminate = true;
      }
    }
  }, [selectedCommunityIds, universityCommunities, barCommunities]);
  
  const handleGroupToggle = (event: React.ChangeEvent<HTMLInputElement>, groupCommunityIds: string[]) => {
    setSelectedCommunityIds(prevIds => {
      const otherIds = prevIds.filter(id => !groupCommunityIds.includes(id));
      const target = event.target as HTMLInputElement;
      if (target.indeterminate || target.checked) {
        return [...otherIds, ...groupCommunityIds];
      } else {
        return otherIds;
      }
    });
  };

  const handleCommunityToggle = (communityId: string) => {
    setSelectedCommunityIds(prev =>
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };

  // Build ICS URL
  let icsUrl = '/api/events/ics';
  const params = new URLSearchParams();

  if (selectedCommunityIds.length > 0) {
    params.append('id', selectedCommunityIds.join(','));
  }
  
  if (cleOnly) {
    params.append('cle_only', 'true');
  }
  
  const queryString = params.toString();
  if (queryString) {
    icsUrl += `?${queryString}`;
  }

  const handleDownloadICS = () => {
    window.open(icsUrl, '_blank');
  };

  const handleCopyICS = async () => {
    await navigator.clipboard.writeText(window.location.origin + icsUrl);
    alert('ICS link copied to clipboard!');
  };

  const handleOpenGoogleCalendar = () => {
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(window.location.origin + icsUrl)}`;
    window.open(googleUrl, '_blank');
  };
  
  const isUniversityGroupSelected = universityCommunities.length > 0 && universityCommunities.every(c => selectedCommunityIds.includes(c.id));
  const isBarGroupSelected = barCommunities.length > 0 && barCommunities.every(c => selectedCommunityIds.includes(c.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-amber-900">Add to Calendar</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Choose Event Groups</h3>
              <div className="flex flex-col gap-2 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    ref={universityCheckboxRef}
                    onChange={(e) => handleGroupToggle(e, universityCommunities.map(c => c.id))}
                  />
                  <span>All University Events</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    ref={barCheckboxRef}
                    onChange={(e) => handleGroupToggle(e, barCommunities.map(c => c.id))}
                  />
                  <span>All Bar Association Events</span>
                </label>
              </div>

              <h3 className="text-lg font-semibold text-amber-800 my-2">Or Select Individually</h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {(communities || []).map(community => (
                  <label key={community.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCommunityIds.includes(community.id)}
                      onChange={() => handleCommunityToggle(community.id)}
                      className="form-checkbox h-5 w-5 text-amber-600 rounded"
                    />
                    <span>{community.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Options</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={cleOnly}
                  onChange={(e) => setCleOnly(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-amber-600 rounded"
                />
                <span>Include CLE Events Only</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleOpenGoogleCalendar}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add to Google Calendar
            </button>
            <button
              onClick={handleDownloadICS}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Download for Apple/Outlook
            </button>
            <button
              onClick={handleCopyICS}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Copy ICS Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 