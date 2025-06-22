'use client';

import { useState, FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailSignupForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Successfully subscribed to legal event updates!');
        setEmail(''); // Clear input on success
      } else {
        toast.error(data.error || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
      toast.error('An unexpected error occurred. Please try again later.');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-6">
        <Mail className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Stay Updated
        </h3>
        <p className="text-gray-600">
          Get notified about new legal events and opportunities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={isLoading}
          icon={<Mail className="w-4 h-4" />}
          helperText="We'll never share your email with anyone else"
        />
        
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
          icon={<Send className="w-4 h-4" />}
        >
          {isLoading ? 'Subscribing...' : 'Subscribe to Updates'}
        </Button>
      </form>
    </div>
  );
} 