'use client'

import { Calendar, MapPin, Star, Users } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative p-6 rounded-lg border transition-all duration-300 ${
        isHovered 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-50 to-indigo-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`inline-flex p-3 rounded-lg mb-4 transition-colors duration-300 ${
        isHovered ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
      }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={() => {
            onAction()
            toast.success('Feature coming soon!')
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
            isHovered
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

export function FeaturesSection() {
  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need for legal events
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover, track, and stay connected with the legal community in NYC
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Event Discovery"
            description="Find upcoming legal events, conferences, and networking opportunities across NYC."
            actionText="Browse Events"
          />
          
          <FeatureCard
            icon={<MapPin className="w-6 h-6" />}
            title="Location Details"
            description="Get detailed venue information, directions, and accessibility details for each event."
            actionText="View Map"
          />
          
          <FeatureCard
            icon={<Star className="w-6 h-6" />}
            title="Save Favorites"
            description="Star events you're interested in and build your personal calendar of must-attend events."
            actionText="Star Events"
          />
          
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Community"
            description="Connect with legal professionals and organizations hosting events in your area."
            actionText="Join Community"
          />
        </div>
      </div>
    </div>
  )
} 