import EventsCarousel from '@/components/EventsCarousel';
import FeaturedEventsCarousel from '@/components/FeaturedEventsCarousel';
import AdBanner from '@/components/AdBanner';

export default function Home() {
  return (
    <div>
      {/* Homepage Top Ad Banner */}
      <div className="container mx-auto px-4 py-4">
        <AdBanner position="homepage-top" size="banner" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventsCarousel />
          </div>
          <div className="lg:col-span-1">
            {/* Sidebar Ad */}
            <div className="mb-8">
              <AdBanner position="homepage-sidebar" size="sidebar" />
            </div>
          </div>
        </div>
      </div>      
      <div className="container mx-auto px-4 py-8">
        <FeaturedEventsCarousel />
      </div>
    </div>
  )
}
