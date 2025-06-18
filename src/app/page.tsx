import Link from 'next/link';
import EmailSignupForm from '@/components/EmailSignupForm';
import EventsCarousel from '@/components/EventsCarousel';
import OtherEventCalendars from '@/components/OtherEventCalendars';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EventsCarousel />
        </div>
        <div>
          <EmailSignupForm />
        </div>
      </div>
      <div className="mt-12">
        <OtherEventCalendars />
      </div>
    </div>
  )
}
