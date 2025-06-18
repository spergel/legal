'use client';

import { signIn } from 'next-auth/react';

export default function SignInButton() {
  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg text-center">
      <h1 className="text-2xl font-bold mb-4">Submit an Event</h1>
      <p className="mb-4">You must be signed in to submit an event.</p>
      <button
        onClick={() => signIn('google')}
        className="px-4 py-2 rounded bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] font-semibold"
      >
        Sign in with Google
      </button>
    </div>
  );
} 