import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Calendar, Users, MapPin, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Legal Events NYC',
  description: 'Learn about Legal Events NYC and our mission to connect legal professionals in New York City with events and opportunities.',
};

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Calendar className="w-10 h-10 text-amber-600" />
            About Legal Events NYC
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting legal professionals in New York City with events, opportunities, and communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-600" />
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We're building the premier platform for legal professionals to discover, share, and connect through events. 
              From CLE seminars to networking mixers, we aggregate events from across NYC's legal community.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-amber-600" />
              What We Do
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We automatically collect events from law schools, bar associations, and legal organizations, 
              making it easy to find relevant opportunities in your area of practice.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Event Discovery</h3>
              <p className="text-gray-600 text-sm">Find events by date, location, and practice area</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Save Favorites</h3>
              <p className="text-gray-600 text-sm">Star events you're interested in for easy access</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 text-sm">Connect with other legal professionals</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/events">
            <Button size="lg" icon={<Calendar className="w-5 h-5" />}>
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 