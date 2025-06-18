'use client';

import { signIn, signOut } from 'next-auth/react';

interface AuthNavProps {
  session: any;
}

export default function AuthNav({ session }: AuthNavProps) {
  if (session?.user) {
    return (
      <div className="flex items-center gap-2 ml-4">
        {session.user.image && (
          <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border border-[#c8b08a]" />
        )}
        <span className="text-[#5b4636] font-medium">{session.user.name || session.user.email}</span>
        <button
          onClick={() => signOut()}
          className="ml-2 px-3 py-1 rounded bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] font-semibold text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => signIn('google')}
      className="ml-4 px-3 py-1 rounded bg-[#e2c799] hover:bg-[#d1b07a] text-[#5b4636] font-semibold text-sm"
    >
      Sign in with Google
    </button>
  );
} 