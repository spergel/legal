import EventsCarousel from '@/components/EventsCarousel';
import FeaturedEventsCarousel from '@/components/FeaturedEventsCarousel';

export default function Home() {
  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventsCarousel />
          </div>
          <div className="lg:col-span-1">
            {/* Sidebar content - ads will be added via Google Ad Manager */}
            <div className="mb-8">
              <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
                Ad Space - Google Ad Manager
              </div>
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
