'use client';

import { Event, EventType, PracticeArea, OrganizationType, SpecialtyGroup } from '@/types';
import { Badge } from './ui/Badge';
import { Calendar, Users, Award, Building } from 'lucide-react';

interface CategorizationStatsProps {
  events: Event[];
  className?: string;
}

interface CategoryStats {
  eventTypes: Record<string, number>;
  practiceAreas: Record<string, number>;
  organizationTypes: Record<string, number>;
  specialtyGroups: Record<string, number>;
  cleEvents: number;
  eventsWithCredits: number;
  totalEvents: number;
}

export default function CategorizationStats({ events, className = '' }: CategorizationStatsProps) {
  if (!events || events.length === 0) {
    return null;
  }

  // Calculate statistics
  const stats: CategoryStats = {
    eventTypes: {},
    practiceAreas: {},
    organizationTypes: {},
    specialtyGroups: {},
    cleEvents: 0,
    eventsWithCredits: 0,
    totalEvents: events.length,
  };

  events.forEach(event => {
    // Count CLE events
    if (event.hasCLE) {
      stats.eventTypes['CLE'] = (stats.eventTypes['CLE'] || 0) + 1;
    } else {
      stats.eventTypes['Non-CLE'] = (stats.eventTypes['Non-CLE'] || 0) + 1;
    }

    // TODO: Count practice areas after restoring category field
    // Simplified for now - just count by community
    if (event.communityText) {
      stats.practiceAreas[event.communityText] = (stats.practiceAreas[event.communityText] || 0) + 1;
    }
    // Count CLE events (simplified)
    if (event.hasCLE) {
      stats.cleEvents++;
    }

    // Count events with credits
    if (event.cleCredits && event.cleCredits > 0) {
      stats.eventsWithCredits++;
    }
  });

  // Get top categories
  const getTopCategories = (categoryCounts: Record<string, number>, limit: number = 3) => {
    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const topEventTypes = getTopCategories(stats.eventTypes);
  const topPracticeAreas = getTopCategories(stats.practiceAreas);
  const topOrganizationTypes = getTopCategories(stats.organizationTypes);
  const topSpecialtyGroups = getTopCategories(stats.specialtyGroups);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-600" />
        Event Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Events */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{stats.totalEvents}</div>
          <div className="text-sm text-blue-700">Total Events</div>
        </div>

        {/* CLE Events */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{stats.cleEvents}</div>
          <div className="text-sm text-green-700">CLE Events</div>
        </div>

        {/* Events with Credits */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{stats.eventsWithCredits}</div>
          <div className="text-sm text-purple-700">With Credits</div>
        </div>

        {/* Organizations */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Building className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{Object.keys(stats.organizationTypes).length}</div>
          <div className="text-sm text-orange-700">Organizations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Event Types */}
        {topEventTypes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              Top Event Types
            </h4>
            <div className="space-y-2">
              {topEventTypes.map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {type}
                  </Badge>
                  <span className="text-sm text-gray-600">{count} events</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Practice Areas */}
        {topPracticeAreas.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-600" />
              Top Practice Areas
            </h4>
            <div className="space-y-2">
              {topPracticeAreas.map(([area, count]) => (
                <div key={area} className="flex justify-between items-center">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {area}
                  </Badge>
                  <span className="text-sm text-gray-600">{count} events</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Organizations */}
        {topOrganizationTypes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-600" />
              Top Organizations
            </h4>
            <div className="space-y-2">
              {topOrganizationTypes.map(([org, count]) => (
                <div key={org} className="flex justify-between items-center">
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {org}
                  </Badge>
                  <span className="text-sm text-gray-600">{count} events</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Specialty Groups */}
        {topSpecialtyGroups.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              Top Specialty Groups
            </h4>
            <div className="space-y-2">
              {topSpecialtyGroups.map(([group, count]) => (
                <div key={group} className="flex justify-between items-center">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {group}
                  </Badge>
                  <span className="text-sm text-gray-600">{count} events</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 