'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setIsUnsubscribed(true);
        toast.success('Successfully unsubscribed');
      } else {
        toast.error(data.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('An error occurred while unsubscribing');
    } finally {
      setIsLoading(false);
    }
  };

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Successfully Unsubscribed
            </h2>
            <p className="text-gray-600 mb-6">
              You have been successfully unsubscribed from our newsletter. 
              You will no longer receive legal event updates.
            </p>
            <div className="space-y-4">
              <a
                href="/"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Homepage
              </a>
              <p className="text-sm text-gray-500">
                Changed your mind? You can always{' '}
                <a href="/" className="text-blue-600 hover:underline">
                  subscribe again
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Unsubscribe from Newsletter
          </h2>
          <p className="text-gray-600 mb-6">
            We're sorry to see you go! Enter your email address below to unsubscribe 
            from our legal events newsletter.
          </p>
        </div>

        <form onSubmit={handleUnsubscribe} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            icon={<Mail className="w-4 h-4" />}
          />

          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
          </Button>

          <div className="text-center">
            <a
              href="/"
              className="text-sm text-blue-600 hover:underline"
            >
              Cancel and return to homepage
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UnsubscribeForm />
    </Suspense>
  );
} 