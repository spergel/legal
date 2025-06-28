'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Plus, Edit3, Send, Trash2, Eye, Calendar, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import NewsletterEditor from './NewsletterEditor';
import EmailServiceSetup from './EmailServiceSetup';

import { Newsletter, SubscriberStats } from '@/types/newsletter';

export default function NewsletterDashboard() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats>({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchNewsletters();
    fetchSubscriberStats();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletter');
      const data = await response.json();
      
      if (response.ok) {
        setNewsletters(data.newsletters);
      } else {
        toast.error('Failed to fetch newsletters');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error loading newsletters');
    } finally {
      setIsLoading(false);
    }
  };

  const [serviceType, setServiceType] = useState<string>('Database');

  const fetchSubscriberStats = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers/stats');
      const data = await response.json();
      
      if (response.ok) {
        setSubscriberStats(data);
        setServiceType(data.serviceType || 'Database');
      }
    } catch (error) {
      console.error('Subscriber stats error:', error);
    }
  };

  const handleEdit = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setSelectedNewsletter(null);
    setShowEditor(true);
  };

  const handleSave = (newsletter: Newsletter) => {
    setShowEditor(false);
    fetchNewsletters();
    setSelectedNewsletter(null);
  };

  const handleSend = async (id: string) => {
    fetchNewsletters();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) {
      return;
    }

    try {
      const response = await fetch(`/api/newsletter/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Newsletter deleted');
        fetchNewsletters();
      } else {
        toast.error('Failed to delete newsletter');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting newsletter');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'SENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showEditor) {
    return (
      <NewsletterEditor
        newsletter={selectedNewsletter || undefined}
        onSave={handleSave}
        onSend={handleSend}
        onClose={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <EmailServiceSetup 
        isConfigured={serviceType === 'Mailchimp'}
        serviceType={serviceType}
      />
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Management</h1>
            <p className="text-gray-600 mt-1">Create and manage your legal events newsletters</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                serviceType === 'Mailchimp' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                📧 {serviceType === 'Mailchimp' ? '🚀 Mailchimp Connected' : '💾 Database Mode'}
              </span>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Newsletter
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{subscriberStats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Newsletters Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {newsletters.filter(n => n.status === 'SENT').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Edit3 className="w-8 h-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft Newsletters</p>
                <p className="text-2xl font-bold text-gray-900">
                  {newsletters.filter(n => n.status === 'DRAFT').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletters List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Newsletters</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading newsletters...</p>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No newsletters created yet</p>
            <Button
              onClick={handleCreate}
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Your First Newsletter
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Newsletter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newsletters.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {newsletter.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {newsletter.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(newsletter.status)}`}>
                        {newsletter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {newsletter.recipients || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.createdAt ? new Date(newsletter.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(newsletter)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {newsletter.status !== 'SENT' && newsletter.id && (
                          <button
                            onClick={() => handleDelete(newsletter.id!)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 