'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui';
import { LogIn, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthNavProps {
  session: any;
}

export default function AuthNav({ session }: AuthNavProps) {
  const handleSignOut = () => {
    signOut();
    toast.success('Signed out successfully');
  };

  const handleSignIn = () => {
    signIn('google');
  };

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <img 
              src={session.user.image} 
              alt="avatar" 
              className="w-8 h-8 rounded-full border-2 border-amber-200 shadow-sm" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
          )}
          <span className="text-gray-700 font-medium text-sm hidden sm:block">
            {session.user.name || session.user.email}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          icon={<LogOut className="w-4 h-4" />}
        >
          Sign out
        </Button>
      </div>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      icon={<LogIn className="w-4 h-4" />}
    >
      Sign in
    </Button>
  );
} 