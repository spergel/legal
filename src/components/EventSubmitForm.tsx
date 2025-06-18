'use client';

import { useState } from 'react';

interface EventSubmitFormProps {
  user: any;
}

export default function EventSubmitForm({ user }: EventSubmitFormProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    tags: '',
    organization: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    let imageUrl = form.image;
    try {
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }
      const res = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image: imageUrl }),
      });
      if (!res.ok) throw new Error('Event submission failed');
      setSuccess(true);
      setForm({ name: '', description: '', startDate: '', endDate: '', location: '', tags: '', organization: '', image: '' });
      setImageFile(null);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Event Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-[#c8b08a] rounded"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          required
          className="w-full px-3 py-2 border border-[#c8b08a] rounded"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Start Date & Time</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-[#c8b08a] rounded"
          />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-[#c8b08a] rounded"
          />
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Location</label>
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="w-full px-3 py-2 border border-[#c8b08a] rounded"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Tags (comma separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          className="w-full px-3 py-2 border border-[#c8b08a] rounded"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Organization</label>
        <input
          type="text"
          value={form.organization}
          onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
          className="w-full px-3 py-2 border border-[#c8b08a] rounded"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Event Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="block"
        />
        {imageFile && <span className="text-xs text-[#5b4636]">{imageFile.name}</span>}
      </div>
      {error && <div className="text-red-600 font-semibold">{error}</div>}
      {success && <div className="text-green-700 font-semibold">Event submitted for review!</div>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] font-semibold"
      >
        {loading ? 'Submitting...' : 'Submit Event'}
      </button>
    </form>
  );
} 