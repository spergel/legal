'use client';

import { useState, useEffect } from 'react';
import { getAllEvents, getAllCommunities } from '@/lib/data-loader';
import { Event, Community } from '@/types';

export default function CalendarSubscribeWidget() {
  const [tags, setTags] = useState<string[]>([]);
  const [orgs, setOrgs] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    async function fetchData() {
      const events = await getAllEvents();
      const allTags = Array.from(new Set(events.flatMap(e => e.tags || [])));
      setTags(allTags);
      const comms = await getAllCommunities();
      setCommunities(comms);
      setOrgs(comms.map(c => c.id));
    }
    fetchData();
  }, []);

  function handleTagChange(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }
  function handleOrgChange(org: string) {
    setSelectedOrgs(prev => prev.includes(org) ? prev.filter(o => o !== org) : [...prev, org]);
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const tagParam = selectedTags.length ? `tag=${selectedTags.join(',')}` : '';
  const orgParam = selectedOrgs.length ? `org=${selectedOrgs.join(',')}` : '';
  const paramStr = [tagParam, orgParam].filter(Boolean).join('&');
  const icsUrl = `${baseUrl}/api/events/ics${paramStr ? '?' + paramStr : ''}`;
  const rssUrl = `${baseUrl}/api/rss${paramStr ? '?' + paramStr : ''}`;

  return (
    <div className="bg-[#f6ecd9] border border-[#c8b08a] rounded-lg p-6 mb-8 shadow">
      <h2 className="text-2xl font-bold mb-2 text-[#5b4636]">Subscribe to Custom Calendar</h2>
      <p className="mb-4 text-[#5b4636]">Select tags and/or organizations to generate a custom calendar or RSS feed. Copy the link to use in Google Calendar, Apple Calendar, Outlook, or your favorite RSS reader.</p>
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <h3 className="font-semibold mb-1 text-[#5b4636]">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <label key={tag} className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                  className="accent-[#bfa980]"
                />
                <span className="text-sm text-[#5b4636]">{tag}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-1 text-[#5b4636]">Organizations</h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {communities.map(org => (
              <label key={org.id} className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrgs.includes(org.id)}
                  onChange={() => handleOrgChange(org.id)}
                  className="accent-[#bfa980]"
                />
                <span className="text-sm text-[#5b4636]">{org.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center gap-2">
          <input type="text" value={icsUrl} readOnly className="w-full px-2 py-1 border border-[#c8b08a] rounded bg-[#f6ecd9] text-[#5b4636]" />
          <button onClick={() => navigator.clipboard.writeText(icsUrl)} className="bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] px-3 py-1 rounded font-semibold">Copy ICS</button>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={rssUrl} readOnly className="w-full px-2 py-1 border border-[#c8b08a] rounded bg-[#f6ecd9] text-[#5b4636]" />
          <button onClick={() => navigator.clipboard.writeText(rssUrl)} className="bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] px-3 py-1 rounded font-semibold">Copy RSS</button>
        </div>
      </div>
      <div className="text-xs text-[#5b4636] mt-2">
        <p>To subscribe in Google Calendar: Go to "Other calendars" &rarr; "From URL" and paste the ICS link above.</p>
        <p>For Apple Calendar/Outlook: Use "Add Calendar by URL" and paste the ICS link.</p>
        <p>For RSS readers: Use the RSS link above.</p>
      </div>
    </div>
  );
} 