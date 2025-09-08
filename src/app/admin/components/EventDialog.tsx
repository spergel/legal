'use client';

import { useState, useEffect } from 'react';
import { Event } from '../types';

interface EventDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDialog({ event, isOpen, onClose }: EventDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      setPhotoPreview(event.image || null);
    }
  }, [event]);

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

  const handleSave = async () => {
    if (!editedEvent) return;

    try {
      const formData = new FormData();
      formData.append('name', editedEvent.name);
      formData.append('description', editedEvent.description);
      formData.append('status', editedEvent.status);
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await fetch(`/api/events/${editedEvent.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        setIsEditing(false);
        onClose();
        window.location.reload();
      } else {
        alert('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event');
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Event' : 'Event Details'}
          </h2>
          <div className="flex space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                type="text"
                value={editedEvent?.name || ''}
                onChange={(e) => setEditedEvent(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editedEvent?.description || ''}
                onChange={(e) => setEditedEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editedEvent?.status || ''}
                onChange={(e) => setEditedEvent(prev => prev ? { ...prev, status: e.target.value } : null)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="featured">Featured</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Photo</label>
              {photoPreview && (
                <div className="mb-2">
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded border" />
                  <button
                    onClick={handleRemovePhoto}
                    className="mt-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {event.image && (
              <div>
                <img src={event.image} alt={event.name} className="w-full h-48 object-cover rounded border" />
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <p className="text-gray-600 mt-2">{event.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span> {event.status}
              </div>
              <div>
                <span className="font-medium">Submitted by:</span> {event.submittedBy}
              </div>
              {event.startDate && (
                <div>
                  <span className="font-medium">Start Date:</span> {new Date(event.startDate).toLocaleDateString()}
                </div>
              )}
              {event.endDate && (
                <div>
                  <span className="font-medium">End Date:</span> {new Date(event.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
