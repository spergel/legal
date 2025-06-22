'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { formatEventDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Globe, Award, Tag, Building, Image as ImageIcon } from 'lucide-react';

interface EventSubmitFormProps {
  user: any;
}

export default function EventSubmitForm({ user }: EventSubmitFormProps) {
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [cleCredits, setCleCredits] = useState('');
  const [tags, setTags] = useState('');
  const [organization, setOrganization] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Reset times when all-day is checked/unchecked
  useEffect(() => {
    if (isAllDay) {
      setStartTime('');
      setEndTime('');
    }
  }, [isAllDay]);

  // Reset multi-day fields when toggled
  useEffect(() => {
    if (!isMultiDay) {
      setStartDate('');
      setEndDate('');
    } else {
      setDate('');
    }
  }, [isMultiDay]);

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Construct final start and end dates
      let finalStartDate: Date;
      let finalEndDate: Date;

      if (isMultiDay) {
        finalStartDate = new Date(`${startDate}T${startTime || '00:00'}`);
        finalEndDate = new Date(`${endDate}T${endTime || startTime || '23:59'}`);
      } else {
        finalStartDate = new Date(`${date}T${startTime || '00:00'}`);
        finalEndDate = new Date(`${date}T${endTime || startTime || '23:59'}`);
      }

      if (isNaN(finalStartDate.getTime()) || isNaN(finalEndDate.getTime())) {
        throw new Error('Invalid date or time provided.');
      }
      
      const eventData = {
        name,
        description,
        startDate: finalStartDate.toISOString(),
        endDate: finalEndDate.toISOString(),
        location,
        url,
        cleCredits,
        tags,
        organization,
        image: imageFile ? await handleImageUpload(imageFile) : image,
      };
      
      const res = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Event submission failed');
      }

      setSuccess(true);
      toast.success('Event submitted successfully!');
      
      // Reset form fields
      setName('');
      setDescription('');
      setDate('');
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setUrl('');
      setCleCredits('');
      setTags('');
      setOrganization('');
      setImage('');
      setImageFile(null);
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Event Details
        </h2>
        
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Enter event name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              rows={4} 
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your event..."
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Date & Time
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 font-medium text-gray-700">
              <input 
                type="checkbox" 
                checked={isMultiDay} 
                onChange={() => setIsMultiDay(p => !p)} 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Multi-day event
            </label>
            <label className="flex items-center gap-2 font-medium text-gray-700">
              <input 
                type="checkbox" 
                checked={isAllDay} 
                onChange={() => setIsAllDay(p => !p)} 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              All-day event
            </label>
          </div>

          {isMultiDay ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          ) : (
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          )}

          {!isAllDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location & Details
        </h3>
        
        <div className="space-y-4">
          <Input
            label="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g., Online or Venue Name"
            icon={<MapPin className="w-4 h-4" />}
          />

          <Input
            label="Event Website URL"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/event"
            icon={<Globe className="w-4 h-4" />}
          />

          <Input
            label="CLE Credits"
            value={cleCredits}
            onChange={e => setCleCredits(e.target.value)}
            placeholder="e.g., 2.0 CLE credits"
            icon={<Award className="w-4 h-4" />}
          />

          <Input
            label="Tags"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g., networking, CLE, pro bono"
            icon={<Tag className="w-4 h-4" />}
            helperText="Separate tags with commas"
          />

          <Input
            label="Organization"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
            placeholder="Your organization name"
            icon={<Building className="w-4 h-4" />}
          />

          <Input
            label="Event Image URL"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            icon={<ImageIcon className="w-4 h-4" />}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          size="lg"
          icon={<Calendar className="w-4 h-4" />}
        >
          {loading ? 'Submitting...' : 'Submit Event'}
        </Button>
      </div>
    </form>
  );
} 