import EventsCarousel from '@/components/EventsCarousel';
import FeaturedEventsCarousel from '@/components/FeaturedEventsCarousel';

export default function Home() {
  return (
    <div>
      {/* Featured Events Carousel */}
      
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventsCarousel />
          </div>
        </div>
      </div>      
      <div className="container mx-auto px-4 py-8">
        <FeaturedEventsCarousel />
      </div>
    </div>
  )
}
