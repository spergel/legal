import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import EventSubmitForm from '@/components/EventSubmitForm';
import SignInButton from '@/components/SignInButton';

export default async function SubmitPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <SignInButton />;
  }
  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Submit an Event</h1>
      <EventSubmitForm user={session.user} />
    </div>
  );
} 