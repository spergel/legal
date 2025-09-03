import { Metadata } from 'next';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Advertising Opportunities | Legal Events NYC',
  description: 'Advertise your legal services, CLE programs, and events to our engaged legal community.',
};

export default function AdsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advertising Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Reach New York's legal community with targeted advertising on our platform. 
            We offer multiple ad formats and positions to maximize your visibility.
          </p>
        </div>

        {/* Ad Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Homepage Banner */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Homepage Banner (728x90)
            </h2>
            <p className="text-gray-600 mb-4">
              Premium placement at the top of our homepage. Perfect for major announcements, 
              CLE programs, and high-visibility campaigns.
            </p>
            <div className="mb-4">
              <AdBanner position="homepage-top" size="banner" />
            </div>
            <div className="text-sm text-gray-500">
              <strong>Features:</strong> High visibility, responsive design, click tracking
            </div>
          </div>

          {/* Sidebar Ad */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Sidebar Advertisement (300x600)
            </h2>
            <p className="text-gray-600 mb-4">
              Prominent sidebar placement visible on all pages. Ideal for ongoing campaigns 
              and brand awareness.
            </p>
            <div className="mb-4">
              <AdBanner position="events-sidebar" size="sidebar" />
            </div>
            <div className="text-sm text-gray-500">
              <strong>Features:</strong> Persistent visibility, targeted placement, engagement tracking
            </div>
          </div>
        </div>

        {/* Newsletter Ad */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Newsletter Advertisement (300x250)
          </h2>
          <p className="text-gray-600 mb-4">
            Reach our email subscribers with newsletter placements. Great for CLE programs, 
            events, and service announcements.
          </p>
          <div className="mb-4 max-w-xs">
            <AdBanner position="newsletter" size="newsletter" />
          </div>
          <div className="text-sm text-gray-500">
            <strong>Features:</strong> Email distribution, subscriber targeting, click tracking
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Ready to Advertise?
          </h2>
          <p className="text-lg text-blue-800 mb-6">
            Contact us to discuss advertising opportunities and pricing.
          </p>
          <div className="space-y-2 text-blue-700">
            <p><strong>Email:</strong> lawyerevents@gmail.com</p>
            <p><strong>Subject:</strong> Advertising Inquiry</p>
          </div>
          <div className="mt-6 text-sm text-blue-600">
            <p>We offer flexible pricing and can customize campaigns to meet your needs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
