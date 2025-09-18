'use client';

import { Event, EventType, PracticeArea, OrganizationType, SpecialtyGroup } from '@/types';
import { Badge } from './ui/Badge';

interface EventCategoriesProps {
  event: Event;
  className?: string;
  showTags?: boolean;
  maxCategories?: number;
}

// Color mapping for different category types
const categoryColors: Record<string, string> = {
  // Event Types
  'CLE': 'bg-blue-100 text-blue-800 border-blue-200',
  'Networking': 'bg-green-100 text-green-800 border-green-200',
  'Annual Dinner': 'bg-purple-100 text-purple-800 border-purple-200',
  'Pro Bono': 'bg-orange-100 text-orange-800 border-orange-200',
  'Board Meeting': 'bg-gray-100 text-gray-800 border-gray-200',
  'Gala': 'bg-pink-100 text-pink-800 border-pink-200',
  'Pride Event': 'bg-rainbow-100 text-rainbow-800 border-rainbow-200',
  'Screening': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Event': 'bg-slate-100 text-slate-800 border-slate-200',
  'Dinner/Gala': 'bg-purple-100 text-purple-800 border-purple-200',
  
  // Practice Areas
  'Intellectual Property': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Criminal Law': 'bg-red-100 text-red-800 border-red-200',
  'Immigration': 'bg-teal-100 text-teal-800 border-teal-200',
  'Civil Rights': 'bg-blue-100 text-blue-800 border-blue-200',
  'Employment Law': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Family Law': 'bg-pink-100 text-pink-800 border-pink-200',
  'Real Estate': 'bg-amber-100 text-amber-800 border-amber-200',
  'Bankruptcy': 'bg-red-100 text-red-800 border-red-200',
  'Entertainment Law': 'bg-purple-100 text-purple-800 border-purple-200',
  'International Law': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Litigation': 'bg-orange-100 text-orange-800 border-orange-200',
  'Mediation': 'bg-green-100 text-green-800 border-green-200',
  'Disability Law': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Water': 'bg-blue-100 text-blue-800 border-blue-200',
  'Environmental': 'bg-green-100 text-green-800 border-green-200',
  
  // Organization Types
  'Bar Association': 'bg-blue-100 text-blue-800 border-blue-200',
  'Legal Events': 'bg-slate-100 text-slate-800 border-slate-200',
  'CLE Provider': 'bg-blue-100 text-blue-800 border-blue-200',
  'Law School': 'bg-purple-100 text-purple-800 border-purple-200',
  'Legal Organization': 'bg-gray-100 text-gray-800 border-gray-200',
  
  // Specialty Groups
  'Asian American': 'bg-red-100 text-red-800 border-red-200',
  'Hispanic': 'bg-orange-100 text-orange-800 border-orange-200',
  'LGBTQ+': 'bg-rainbow-100 text-rainbow-800 border-rainbow-200',
  'Women in Law': 'bg-pink-100 text-pink-800 border-pink-200',
  'Young Lawyers': 'bg-green-100 text-green-800 border-green-200',
  'Solo/Small Firm': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  
  // Default
  'default': 'bg-gray-100 text-gray-800 border-gray-200',
};

// Priority order for displaying categories
const categoryPriority = [
  // Event Types (highest priority)
  'CLE', 'Networking', 'Annual Dinner', 'Pro Bono', 'Board Meeting', 'Gala', 'Pride Event', 'Screening', 'Event', 'Dinner/Gala',
  // Practice Areas
  'Intellectual Property', 'Criminal Law', 'Immigration', 'Civil Rights', 'Employment Law', 'Family Law', 'Real Estate', 'Bankruptcy', 'Entertainment Law', 'International Law', 'Litigation', 'Mediation', 'Disability Law', 'Water', 'Environmental',
  // Organization Types
  'Bar Association', 'Legal Events', 'CLE Provider', 'Law School', 'Legal Organization',
  // Specialty Groups
  'Asian American', 'Hispanic', 'LGBTQ+', 'Women in Law', 'Young Lawyers', 'Solo/Small Firm',
];

export default function EventCategories({ 
  event, 
  className = '', 
  showTags = false, 
  maxCategories = 5 
}: EventCategoriesProps) {
  // Collect all categories for display
  const allCategories: string[] = [];
  
  // Add event categories
  if (event.category && event.category.length > 0) {
    allCategories.push(...event.category);
  }
  
  // Add event type if present
  if (event.eventType && !allCategories.includes(event.eventType)) {
    allCategories.push(event.eventType);
  }
  
  // Add community if not already in categories
  if (event.communityText && !allCategories.includes(event.communityText)) {
    allCategories.push(event.communityText);
  }
  
  // Sort categories by priority
  const sortedCategories = allCategories.sort((a, b) => {
    const priorityA = categoryPriority.indexOf(a);
    const priorityB = categoryPriority.indexOf(b);
    
    // If both have priority, sort by priority
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }
    
    // If only one has priority, prioritize it
    if (priorityA !== -1) return -1;
    if (priorityB !== -1) return 1;
    
    // If neither has priority, sort alphabetically
    return a.localeCompare(b);
  });
  
  const displayCategories = sortedCategories.slice(0, maxCategories);
  const remainingCount = Math.max(0, sortedCategories.length - maxCategories);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* CLE Badge (if present) */}
      {event.hasCLE && (
        <Badge 
          className={`${categoryColors['CLE'] || categoryColors.default} font-semibold`}
        >
          CLE
        </Badge>
      )}
      
      {/* CLE Credits Badge (if present) */}
      {event.cleCredits && event.cleCredits > 0 && (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
          {event.cleCredits} CLE Credits
        </Badge>
      )}
      
      {/* Category Badges */}
      {displayCategories.map((category, index) => (
        <Badge 
          key={`${category}-${index}`}
          className={`${categoryColors[category] || categoryColors.default} text-xs`}
        >
          {category}
        </Badge>
      ))}
      
      {/* Show remaining count if there are more categories */}
      {remainingCount > 0 && (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
          +{remainingCount} more
        </Badge>
      )}
      
      {/* Tags (if showTags is enabled) */}
      {showTags && event.tags && event.tags.length > 0 && event.tags.map((tag, index) => (
        <Badge 
          key={`tag-${tag}-${index}`}
          className="bg-gray-50 text-gray-600 border-gray-200 text-xs font-normal"
        >
          #{tag}
        </Badge>
      ))}
    </div>
  );
} 