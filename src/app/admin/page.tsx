'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import NewsletterDashboard from '@/components/NewsletterDashboard';
import AdManagementDashboard from '@/components/AdManagementDashboard';
import { Mail, Settings, BarChart3, DollarSign } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('events');

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
    redirect('/');
  }

  const tabs = [
    { key: 'events', label: 'Event Management', icon: BarChart3 },
    { key: 'newsletter', label: 'Newsletter', icon: Mail },
    { key: 'ads', label: 'Ad Management', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="w-6 h-6 text-gray-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              Logged in as {session.user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'events' && <AdminDashboard />}
          {activeTab === 'newsletter' && <NewsletterDashboard />}
          {activeTab === 'ads' && <AdManagementDashboard />}
        </div>
      </div>
    </div>
  );
} 