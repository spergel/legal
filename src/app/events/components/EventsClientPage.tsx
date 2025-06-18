'use client';

import { useState, useRef, useEffect } from 'react';
import EventsList from './EventsList';

function getStarSVG(filled: boolean) {
  return filled ? (
    <span className="text-yellow-500">★</span>
  ) : (
    <span className="text-gray-400">☆</span>
  );
}

export default function EventsClientPage({ events }: { events: any[] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [calendarHover, setCalendarHover] = useState(false);
  const [starHover, setStarHover] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedEvents');
    const ids = saved ? JSON.parse(saved) : [];
    setBookmarked(ids);
    setSelectedForExport(ids); // By default, all starred events are selected
  }, [showStarredModal]);

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
  const icsUrl = `${baseUrl}/api/events/ics?id=${selectedForExport.join(',')}`;
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;

  const handleDownloadICS = () => {
    window.open(icsUrl, '_blank');
  };

  const handleCopyICS = async () => {
    await navigator.clipboard.writeText(icsUrl);
    alert('ICS link copied to clipboard!');
  };

  const handleOpenGoogleCalendar = () => {
    window.open(googleUrl, '_blank');
  };

  // Get starred events
  const starredEvents = events.filter(e => bookmarked.includes(e.id));

  // Handle checkbox change
  const handleCheckboxChange = (eventId: string) => {
    setSelectedForExport(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Select/deselect all
  const allSelected = starredEvents.length > 0 && selectedForExport.length === starredEvents.length;
  const handleSelectAll = () => {
    setSelectedForExport(starredEvents.map(e => e.id));
  };
  const handleDeselectAll = () => {
    setSelectedForExport([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Floating Calendar Button with Dropdown and Star FAB */}
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
                href={googleUrl}
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
        {/* Star FAB for Bookmarked Events */}
        <div className="relative group mt-2">
          <button
            aria-label="Manage starred events"
            className={`bg-white border border-yellow-400 hover:bg-yellow-100 text-yellow-500 rounded-full shadow-lg p-3 transition-colors flex items-center justify-center focus:outline-none`}
            style={{ width: 56, height: 56 }}
            onClick={() => setShowStarredModal(true)}
            onMouseEnter={() => setStarHover(true)}
            onMouseLeave={() => setStarHover(false)}
          >
            {/* Outlined Star SVG, filled on hover or if there are starred events */}
            <svg xmlns="http://www.w3.org/2000/svg" fill={(starHover || starredEvents.length) ? '#facc15' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="#facc15" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 011.04 0l2.347 2.382 3.284.478a.75.75 0 01.416 1.28l-2.377 2.32.561 3.273a.75.75 0 01-1.088.791L12 12.347l-2.94 1.546a.75.75 0 01-1.088-.79l.561-3.274-2.377-2.32a.75.75 0 01.416-1.28l3.284-.478 2.347-2.382z" />
            </svg>
          </button>
          {/* Tooltip for star FAB */}
          <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Manage starred events
          </span>
        </div>
      </div>

      {/* Starred Events Modal */}
      {showStarredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white border border-yellow-400 rounded-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-2xl text-yellow-500 hover:text-yellow-700"
              onClick={() => setShowStarredModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-yellow-700">Starred Events</h2>
            {starredEvents.length === 0 ? (
              <p className="text-gray-500 mb-4">You have no starred events.</p>
            ) : (
              <>
                <div className="flex gap-4 mb-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 bg-yellow-100 rounded hover:bg-yellow-200 border border-yellow-300"
                    disabled={allSelected}
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs px-2 py-1 bg-yellow-100 rounded hover:bg-yellow-200 border border-yellow-300"
                    disabled={selectedForExport.length === 0}
                  >
                    Deselect All
                  </button>
                </div>
                <ul className="mb-6 max-h-64 overflow-y-auto">
                  {starredEvents.map(event => (
                    <li key={event.id} className="mb-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedForExport.includes(event.id)}
                        onChange={() => handleCheckboxChange(event.id)}
                        className="accent-yellow-500"
                        id={`starred-event-${event.id}`}
                      />
                      <label htmlFor={`starred-event-${event.id}`} className="flex items-center gap-2 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="#facc15" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#facc15" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 011.04 0l2.347 2.382 3.284.478a.75.75 0 01.416 1.28l-2.377 2.32.561 3.273a.75.75 0 01-1.088.791L12 12.347l-2.94 1.546a.75.75 0 01-1.088-.79l.561-3.274-2.377-2.32a.75.75 0 01.416-1.28l3.284-.478 2.347-2.382z" />
                        </svg>
                        <span className="font-semibold text-amber-900">{event.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{event.formattedStartDate}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-4">
              <button
                onClick={handleOpenGoogleCalendar}
                className="bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] px-4 py-2 rounded font-semibold"
                disabled={selectedForExport.length === 0}
              >
                Add to Google Calendar
              </button>
              <button
                onClick={handleDownloadICS}
                className="bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] px-4 py-2 rounded font-semibold"
                disabled={selectedForExport.length === 0}
              >
                Download ICS
              </button>
              <button
                onClick={handleCopyICS}
                className="bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] px-4 py-2 rounded font-semibold"
                disabled={selectedForExport.length === 0}
              >
                Copy ICS Link
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-4">Events</h1>
      <p className="text-lg mb-4">Coming soon: A calendar of legal events in New York City.</p>
      <EventsList events={events} />
    </div>
  );
} 