'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EventDialog from '@/components/EventDialog';
import { useRouter, useSearchParams } from 'next/navigation';

interface AdminDashboardProps {
  pending: any[];
  allEvents: any;
  currentTab: string;
  searchParams: any;
}

interface CleanupStats {
  pastEvents: number;
  oldCancelledEvents: number;
  oldDeniedEvents: number;
}

export default function AdminDashboard({ pending, allEvents, currentTab, searchParams }: AdminDashboardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const selectedEventId = searchParams.viewEvent;

  const handleCloseDialog = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('viewEvent');
    router.replace(`/admin?${params.toString()}`);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsEditing(true);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setEditingEvent(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Load cleanup stats
  useEffect(() => {
    if (currentTab === 'cleanup' || currentTab === 'stats') {
      fetchCleanupStats();
    }
  }, [currentTab]);

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
        // Refresh stats and events
        await fetchCleanupStats();
        // Refresh the page to update event counts
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

  // Filter events based on search term
  const filteredEvents = allEvents.events.filter((event: any) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cancelledEvents = allEvents.events.filter((event: any) => event.status === 'cancelled');
  const featuredEvents = allEvents.events.filter((event: any) => event.status === 'featured');

  return (
    <div className="max-w-6xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-[#c8b08a]">
        <Link 
          href="/admin?tab=pending" 
          className={`pb-2 px-4 ${currentTab === 'pending' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Pending Events ({pending.length})
        </Link>
        <Link 
          href="/admin?tab=all" 
          className={`pb-2 px-4 ${currentTab === 'all' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          All Events ({allEvents.events.length})
        </Link>
        <Link 
          href="/admin?tab=cancelled" 
          className={`pb-2 px-4 ${currentTab === 'cancelled' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Cancelled Events ({cancelledEvents.length})
        </Link>
        <Link 
          href="/admin?tab=featured" 
          className={`pb-2 px-4 ${currentTab === 'featured' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Featured Events ({featuredEvents.length})
        </Link>
        <Link 
          href="/admin?tab=cleanup" 
          className={`pb-2 px-4 ${currentTab === 'cleanup' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Cleanup
        </Link>
        <Link 
          href="/admin?tab=stats" 
          className={`pb-2 px-4 ${currentTab === 'stats' ? 'border-b-2 border-[#5b4636] font-semibold' : ''}`}
        >
          Statistics
        </Link>
      </div>

      {/* Content */}
      {currentTab === 'pending' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Events</h2>
          {pending.length === 0 ? (
            <p className="text-[#5b4636]">No pending events.</p>
          ) : (
            <ul className="space-y-4">
              {pending.map((event: any, idx: number) => (
                <li key={event.id || `pending-${idx}`} className="bg-white border border-[#c8b08a] rounded p-4">
                  <div className="flex gap-4">
                    {event.photo && (
                      <div className="flex-shrink-0">
                        <img 
                          src={event.photo} 
                          alt={event.name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                  <div className="mb-2">
                    <Link 
                      href={`/admin?tab=pending&viewEvent=${event.id}`}
                      className="font-bold text-lg hover:text-[#8b6b4a] transition-colors"
                    >
                      {event.name}
                    </Link>
                  </div>
                  <div className="mb-2 text-sm text-[#5b4636]">{event.description}</div>
                  <div className="mb-2">
                    <span className="font-semibold">Submitted by:</span>{' '}
                    <a href={`mailto:${event.submittedBy}`} className="text-blue-600 hover:underline">
                      {event.submittedBy}
                    </a>
                  </div>
                  <div className="flex gap-4">
                    <form method="GET" action="/admin">
                      <input type="hidden" name="tab" value="pending" />
                      <input type="hidden" name="approve" value={idx} />
                      <button type="submit" className="px-3 py-1 rounded bg-green-200 text-green-900 font-semibold">Approve</button>
                    </form>
                    <form method="GET" action="/admin">
                      <input type="hidden" name="tab" value="pending" />
                      <input type="hidden" name="deny" value={idx} />
                      <button type="submit" className="px-3 py-1 rounded bg-red-200 text-red-900 font-semibold">Deny</button>
                    </form>
                    <button 
                      onClick={() => handleEditEvent(event)}
                      className="px-3 py-1 rounded bg-blue-200 text-blue-900 font-semibold"
                    >
                      Edit
                    </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentTab === 'all' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Events</h2>
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search events by name, description, or submitter..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-[#c8b08a] rounded"
            />
          </div>
          <ul className="space-y-4">
            {filteredEvents.map((event: any) => (
              <li key={event.id} className="bg-white border border-[#c8b08a] rounded p-4">
                <div className="flex gap-4">
                  {event.photo && (
                    <div className="flex-shrink-0">
                      <img 
                        src={event.photo} 
                        alt={event.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                <div className="mb-2">
                  <Link 
                    href={`/admin?tab=all&viewEvent=${event.id}`}
                    className="font-bold text-lg hover:text-[#8b6b4a] transition-colors"
                  >
                    {event.name}
                  </Link>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    event.status === 'approved' ? 'bg-green-100 text-green-800' :
                    event.status === 'denied' ? 'bg-red-100 text-red-800' :
                    event.status === 'featured' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <div className="mb-2 text-sm text-[#5b4636]">{event.description}</div>
                <div className="mb-2">
                  <span className="font-semibold">Submitted by:</span>{' '}
                  <a href={`mailto:${event.submittedBy}`} className="text-blue-600 hover:underline">
                    {event.submittedBy}
                  </a>
                </div>
                    <div className="flex gap-4 flex-wrap">
                      {event.status !== 'featured' ? (
                  <form method="GET" action="/admin">
                    <input type="hidden" name="tab" value="all" />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="status" value="featured" />
                    <input type="hidden" name="updateStatus" value="true" />
                    <button type="submit" className="px-3 py-1 rounded bg-blue-200 text-blue-900 font-semibold">Feature</button>
                  </form>
                      ) : (
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="all" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="approved" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-orange-200 text-orange-900 font-semibold">Unfeature</button>
                        </form>
                      )}
                      {event.status !== 'cancelled' ? (
                  <form method="GET" action="/admin">
                    <input type="hidden" name="tab" value="all" />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <input type="hidden" name="updateStatus" value="true" />
                    <button type="submit" className="px-3 py-1 rounded bg-yellow-200 text-yellow-900 font-semibold">Cancel</button>
                  </form>
                      ) : (
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="all" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="approved" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-green-200 text-green-900 font-semibold">Uncancel</button>
                        </form>
                      )}
                  <form method="GET" action="/admin">
                    <input type="hidden" name="tab" value="all" />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="status" value="archived" />
                    <input type="hidden" name="updateStatus" value="true" />
                    <button type="submit" className="px-3 py-1 rounded bg-gray-200 text-gray-900 font-semibold">Archive</button>
                  </form>
                  <button 
                    onClick={() => handleEditEvent(event)}
                    className="px-3 py-1 rounded bg-purple-200 text-purple-900 font-semibold"
                  >
                    Edit
                  </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentTab === 'cancelled' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Cancelled Events</h2>
          {cancelledEvents.length === 0 ? (
            <p className="text-[#5b4636]">No cancelled events.</p>
          ) : (
            <ul className="space-y-4">
              {cancelledEvents.map((event: any) => (
                <li key={event.id} className="bg-white border border-[#c8b08a] rounded p-4">
                  <div className="flex gap-4">
                    {event.photo && (
                      <div className="flex-shrink-0">
                        <img 
                          src={event.photo} 
                          alt={event.name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="mb-2">
                        <Link 
                          href={`/admin?tab=cancelled&viewEvent=${event.id}`}
                          className="font-bold text-lg hover:text-[#8b6b4a] transition-colors"
                        >
                          {event.name}
                        </Link>
                        <span className="ml-2 px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                          cancelled
                        </span>
                      </div>
                      <div className="mb-2 text-sm text-[#5b4636]">{event.description}</div>
                      <div className="mb-2">
                        <span className="font-semibold">Submitted by:</span>{' '}
                        <a href={`mailto:${event.submittedBy}`} className="text-blue-600 hover:underline">
                          {event.submittedBy}
                        </a>
                      </div>
                      <div className="flex gap-4">
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="cancelled" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="approved" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-green-200 text-green-900 font-semibold">Uncancel</button>
                        </form>
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="cancelled" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="featured" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-blue-200 text-blue-900 font-semibold">Feature</button>
                        </form>
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="px-3 py-1 rounded bg-purple-200 text-purple-900 font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentTab === 'featured' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Events</h2>
          {featuredEvents.length === 0 ? (
            <p className="text-[#5b4636]">No featured events.</p>
          ) : (
            <ul className="space-y-4">
              {featuredEvents.map((event: any) => (
                <li key={event.id} className="bg-white border border-[#c8b08a] rounded p-4">
                  <div className="flex gap-4">
                    {event.photo && (
                      <div className="flex-shrink-0">
                        <img 
                          src={event.photo} 
                          alt={event.name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="mb-2">
                        <Link 
                          href={`/admin?tab=featured&viewEvent=${event.id}`}
                          className="font-bold text-lg hover:text-[#8b6b4a] transition-colors"
                        >
                          {event.name}
                        </Link>
                        <span className="ml-2 px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                          featured
                        </span>
                      </div>
                      <div className="mb-2 text-sm text-[#5b4636]">{event.description}</div>
                      <div className="mb-2">
                        <span className="font-semibold">Submitted by:</span>{' '}
                        <a href={`mailto:${event.submittedBy}`} className="text-blue-600 hover:underline">
                          {event.submittedBy}
                        </a>
                      </div>
                      <div className="flex gap-4">
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="featured" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="approved" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-orange-200 text-orange-900 font-semibold">Unfeature</button>
                        </form>
                        <form method="GET" action="/admin">
                          <input type="hidden" name="tab" value="featured" />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <input type="hidden" name="updateStatus" value="true" />
                          <button type="submit" className="px-3 py-1 rounded bg-yellow-200 text-yellow-900 font-semibold">Cancel</button>
                        </form>
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="px-3 py-1 rounded bg-purple-200 text-purple-900 font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentTab === 'cleanup' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Database Cleanup</h2>
          
          {/* Cleanup Statistics */}
          {cleanupStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-[#c8b08a] rounded p-4">
                <h3 className="font-semibold mb-2 text-red-700">Past Events</h3>
                <p className="text-2xl font-bold text-red-600">{cleanupStats.pastEvents}</p>
                <p className="text-sm text-gray-600">Events that ended more than 1 day ago</p>
              </div>
              <div className="bg-white border border-[#c8b08a] rounded p-4">
                <h3 className="font-semibold mb-2 text-orange-700">Old Cancelled Events</h3>
                <p className="text-2xl font-bold text-orange-600">{cleanupStats.oldCancelledEvents}</p>
                <p className="text-sm text-gray-600">Cancelled events older than 1 day</p>
              </div>
              <div className="bg-white border border-[#c8b08a] rounded p-4">
                <h3 className="font-semibold mb-2 text-yellow-700">Old Denied Events</h3>
                <p className="text-2xl font-bold text-yellow-600">{cleanupStats.oldDeniedEvents}</p>
                <p className="text-sm text-gray-600">Denied events older than 1 week (will be archived)</p>
              </div>
            </div>
          )}

          {/* Cleanup Actions */}
          <div className="bg-white border border-[#c8b08a] rounded p-6">
            <h3 className="font-semibold mb-4">Cleanup Actions</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ What will be cleaned up:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Events that ended more than 1 day ago (APPROVED, FEATURED, PENDING)</li>
                  <li>• Cancelled events that were cancelled more than 1 day ago</li>
                  <li>• Denied events older than 1 week (will be archived instead of deleted)</li>
                </ul>
              </div>

              {cleanupResult && (
                <div className={`p-4 rounded ${
                  cleanupResult.startsWith('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {cleanupResult}
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={handleCleanup}
                  disabled={isCleanupLoading}
                  className={`px-6 py-3 rounded font-semibold transition-colors ${
                    isCleanupLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isCleanupLoading ? 'Cleaning up...' : '🚮 Run Cleanup'}
                </button>
                
                <button 
                  onClick={fetchCleanupStats}
                  className="px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh Stats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'stats' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#c8b08a] rounded p-4">
              <h3 className="font-semibold mb-2">Event Status</h3>
              <ul className="space-y-2">
                <li key="pending">Pending: {pending.length}</li>
                <li key="approved">Approved: {allEvents.events.filter((e: any) => e.status === 'approved').length}</li>
                <li key="featured">Featured: {featuredEvents.length}</li>
                <li key="cancelled">Cancelled: {cancelledEvents.length}</li>
                <li key="archived">Archived: {allEvents.events.filter((e: any) => e.status === 'archived').length}</li>
              </ul>
            </div>
            <div className="bg-white border border-[#c8b08a] rounded p-4">
              <h3 className="font-semibold mb-2">Recent Activity</h3>
              <p className="text-sm text-[#5b4636]">Coming soon...</p>
            </div>
            <div className="bg-white border border-[#c8b08a] rounded p-4">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-1 rounded bg-blue-200 text-blue-900 font-semibold">Export Events</button>
                <button className="w-full px-3 py-1 rounded bg-green-200 text-green-900 font-semibold">Backup Data</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Dialog */}
      {selectedEventId && (
        <EventDialog 
          eventId={selectedEventId} 
          onClose={handleCloseDialog}
        />
      )}

      {/* Edit Modal */}
      {isEditing && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input 
                  type="text" 
                  defaultValue={editingEvent.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  defaultValue={editingEvent.description}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              
              {/* Photo Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Photo</label>
                
                {/* Current Photo Display */}
                {(editingEvent.photo || photoPreview) && (
                  <div className="mb-4">
                    <img 
                      src={photoPreview || editingEvent.photo} 
                      alt="Event preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
                
                {/* Photo Upload */}
                <div className="space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  
                  {/* Remove Photo Button */}
                  {(editingEvent.photo || photoFile) && (
                    <button 
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1 rounded bg-red-200 text-red-900 font-semibold text-sm"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-600 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 