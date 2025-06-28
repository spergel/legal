'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { Send, Save, Eye, Calendar, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { Newsletter } from '@/types/newsletter';

interface NewsletterEditorProps {
  newsletter?: Newsletter;
  onSave?: (newsletter: Newsletter) => void;
  onSend?: (id: string) => void;
  onClose?: () => void;
}

export default function NewsletterEditor({ newsletter, onSave, onSend, onClose }: NewsletterEditorProps) {
  const [formData, setFormData] = useState<Newsletter>({
    title: newsletter?.title || '',
    subject: newsletter?.subject || '',
    content: newsletter?.content || '',
    status: newsletter?.status || 'DRAFT',
    scheduledAt: newsletter?.scheduledAt || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof Newsletter, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const url = newsletter?.id ? `/api/newsletter/${newsletter.id}` : '/api/newsletter';
      const method = newsletter?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(newsletter?.id ? 'Newsletter updated!' : 'Newsletter created!');
        onSave?.(data.newsletter);
      } else {
        toast.error(data.error || 'Failed to save newsletter');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields before sending');
      return;
    }

    if (!confirm('Are you sure you want to send this newsletter to all subscribers?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          content: formData.content
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${data.message}!`);
        onSend?.(data.campaignId);
      } else {
        toast.error(data.error || 'Failed to send newsletter');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('An error occurred while sending');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailTemplate = (content: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${formData.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            a { color: #0066cc; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #0066cc;">Legal Events Newsletter</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to legal event updates.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">View in Browser</a></p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {newsletter?.id ? 'Edit Newsletter' : 'Create Newsletter'}
              </h2>
              {newsletter?.status && (
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                  newsletter.status === 'SENT' ? 'bg-green-100 text-green-800' :
                  newsletter.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {newsletter.status}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                icon={<Eye className="w-4 h-4" />}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {showPreview ? (
            <div className="border rounded-lg">
              <div className="border-b p-4 bg-gray-50">
                <h3 className="font-semibold">Email Preview</h3>
                <p className="text-sm text-gray-600">Subject: {formData.subject}</p>
              </div>
              <div className="p-4">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: getEmailTemplate(formData.content) 
                  }} 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Newsletter Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter newsletter title..."
                  required
                />
                <Input
                  label="Email Subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter email subject..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Newsletter Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your newsletter content here... You can use HTML tags for formatting."
                  rows={15}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can use HTML tags for formatting. The content will be wrapped in an email template.
                </p>
              </div>

              <div>
                <Input
                  label="Schedule Send (Optional)"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  helperText="Leave empty to save as draft"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                loading={isLoading}
                icon={<Save className="w-4 h-4" />}
                disabled={newsletter?.status === 'SENT'}
              >
                {newsletter?.id ? 'Update' : 'Save'} Newsletter
              </Button>
              
              <Button
                onClick={handleSend}
                loading={isLoading}
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                disabled={newsletter?.status === 'SENT'}
              >
                Send Newsletter
              </Button>
            </div>

            {newsletter?.sentAt && (
              <div className="text-sm text-gray-600">
                <Mail className="w-4 h-4 inline mr-1" />
                Sent to {newsletter.recipients} subscribers on{' '}
                {new Date(newsletter.sentAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 