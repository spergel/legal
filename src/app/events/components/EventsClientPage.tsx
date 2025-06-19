'use client';

import { useState, useRef, useEffect } from 'react';
import EventsList from './EventsList';

export default function EventsClientPage({ events }: { events: any[] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [calendarHover, setCalendarHover] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure events is always an array
  const safeEvents = events || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const icsUrl = `${baseUrl}/api/events/ics`;

  const handleDownloadICS = () => {
    window.open(icsUrl, '_blank');
  };

  const handleCopyICS = async () => {
    await navigator.clipboard.writeText(icsUrl);
    alert('ICS link copied to clipboard!');
  };

  const handleOpenGoogleCalendar = () => {
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;
    window.open(googleUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Floating Calendar Button with Dropdown */}
      <div className="fixed top-1/3 right-8 z-50 flex flex-col gap-4 items-end">
        <div className="relative group" ref={dropdownRef}>
          <button
            aria-label="Add to calendar"
            className={`bg-white border border-[#e2c799] hover:bg-[#e2c799] text-[#bfa980] rounded-full shadow-lg p-3 transition-colors flex items-center justify-center focus:outline-none`}
            style={{ width: 56, height: 56 }}
            onClick={() => setShowDropdown(v => !v)}
            onMouseEnter={() => setCalendarHover(true)}
            onMouseLeave={() => setCalendarHover(false)}
          >
            {/* Calendar SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill={calendarHover ? '#bfa980' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="#bfa980" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75v-1.5A2.25 2.25 0 0110.5 3h3a2.25 2.25 0 012.25 2.25v1.5" />
              <rect x="3.75" y="6.75" width="16.5" height="13.5" rx="2.25" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h7.5" />
            </svg>
          </button>
          {/* Tooltip for calendar FAB */}
          <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Add to calendar
          </span>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#c8b08a] rounded-lg shadow-lg z-50 flex flex-col">
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 hover:bg-[#f6ecd9] text-[#5b4636] text-left rounded-t-lg"
                onClick={() => setShowDropdown(false)}
              >
                Add to Google Calendar
              </a>
              <button
                onClick={handleDownloadICS}
                className="px-4 py-3 hover:bg-[#f6ecd9] text-[#5b4636] text-left border-t border-[#c8b08a]"
              >
                Download for Apple/Outlook
              </button>
              <button
                onClick={handleCopyICS}
                className="px-4 py-3 hover:bg-[#f6ecd9] text-[#5b4636] text-left border-t border-[#c8b08a] rounded-b-lg"
              >
                Copy ICS Link
              </button>
            </div>
          )}
        </div>
      </div>

      <EventsList events={safeEvents} />
    </div>
  );
} 