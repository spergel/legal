import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Byte Hub NYC',
  description: 'Learn about Byte Hub NYC and our mission to connect young tech enthusiasts in New York City with events and communities.',
};

export default function AboutPage() {
  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-purple-400 mb-6">About Byte Hub NYC</h1>
      
      <div className="space-y-6 text-gray-300 leading-relaxed prose prose-invert max-w-none links:text-purple-400 hover:links:text-purple-300">
        <p>
          Welcome to Byte Hub NYC! Our mission is to be the go-to platform for young, aspiring technologists (ages 13-17) in New York City to discover exciting opportunities in the tech world. 
          We believe that early exposure to technology, mentorship, and community can spark a lifelong passion and pave the way for future innovators.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-100 !mt-10 !mb-4">What We Offer</h2>
        <ul>
          <li>
            <strong>Curated Event Listings:</strong> We bring together a wide range of tech-related events, including workshops, coding bootcamps, hackathons, webinars, tech talks, and museum exhibits specifically relevant to young minds in NYC.
          </li>
          <li>
            <strong>Community Directory:</strong> Discover local coding clubs, maker spaces, robotics teams, and other tech-focused communities where you can connect with peers, learn new skills, and collaborate on projects.
          </li>
          <li>
            <strong>A Hub for Exploration:</strong> Whether you're just starting your tech journey or looking to dive deeper into a specific area like AI, game development, web design, or cybersecurity, Byte Hub NYC aims to provide the resources you need.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-100 !mt-10 !mb-4">Our Vision</h2>
        <p>
          We envision a vibrant New York City where every young person interested in technology has easy access to the resources, communities, and events that can help them learn, grow, and succeed. 
          Byte Hub NYC is more than just a directory; it&apos;s a stepping stone towards building a stronger, more inclusive tech future for the next generation.
        </p>

        <h2 className="text-2xl font-semibold text-gray-100 !mt-10 !mb-4">Get Involved</h2>
        <p>
          Are you organizing an event or running a community that would be a great fit for our audience? We&apos;d love to hear from you! 
          While our listings are currently curated through automated processes, we are always looking for ways to expand our reach.
        </p>
        <p>
          For any inquiries, suggestions, or just to say hello, feel free to reach out. (Contact method TBD - perhaps a link to an email or a future contact form).
        </p>

        <p className="mt-8">
          Ready to dive in? Explore our <Link href="/events">events</Link> or discover <Link href="/resources">legal resources & organizations</Link> now!
        </p>
      </div>
    </div>
  );
} 