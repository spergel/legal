import Link from 'next/link';
import EmailSignupForm from '@/components/EmailSignupForm';
import EventsCarousel from '@/components/EventsCarousel';
import OtherEventCalendars from '@/components/OtherEventCalendars';

export default function HomePage() {
  return (
    <div className="text-center">
      <section className="py-12 rounded-lg shadow-xl bg-[#fdf6e3] border border-[#e2cfa3]">
        <h1 className="text-5xl font-bold mb-6 text-[#5b4636] drop-shadow-sm">
          NYC Legal Events
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-[#7c6846]">
          Discover upcoming legal events, CLE programs, and professional opportunities for lawyers, law students, and legal professionals in New York City.
        </p>
        <div className="space-x-4">
          <Link href="/events" className="bg-[#bfa76a] hover:bg-[#a68b4c] text-[#5b4636] font-bold py-3 px-6 rounded-lg text-lg transition duration-300 border border-[#a68b4c] shadow">
            Browse Events
          </Link>
          <Link href="/resources" className="bg-[#e2cfa3] hover:bg-[#bfa76a] text-[#5b4636] font-bold py-3 px-6 rounded-lg text-lg transition duration-300 border border-[#bfa76a] shadow">
            Legal Resources
          </Link>
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">Why Use NYC Legal Events?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-700 mb-3">Curated for Legal Professionals</h3>
            <p className="text-gray-700">
              Events and resources specifically selected for lawyers, law students, and legal professionals in NYC.
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-700 mb-3">Stay Informed</h3>
            <p className="text-gray-700">
              Get the latest on CLE programs, bar association events, networking, and more. Sign up for our weekly digest!
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-700 mb-3">Advance Your Career</h3>
            <p className="text-gray-700">
              Connect with the NYC legal community, earn CLE credits, and discover new professional opportunities.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <EventsCarousel />
      </section>

      <OtherEventCalendars />

      <section className="py-12 bg-gray-800 rounded-lg shadow-xl mt-12">
        <h2 className="text-3xl font-semibold text-yellow-300 mb-6">Stay in the Loop!</h2>
        <p className="text-gray-200 mb-6 max-w-xl mx-auto">
          Sign up for our weekly newsletter to get the latest legal events and community news delivered to your inbox.
        </p>
        <EmailSignupForm />
      </section>
    </div>
  );
}
