'use client';

import { useState, FormEvent } from 'react';

export default function EmailSignupForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('Please enter your email address.');
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
        setMessage(data.message || 'Successfully subscribed to legal event updates!');
        setEmail(''); // Clear input on success
      } else {
        setError(data.error || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="flex items-center">
        <input 
          type="email" 
          id="email-signup"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email for legal event updates"
          className="bg-amber-50 text-amber-900 border border-amber-200 rounded-l-md py-3 px-4 flex-grow focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-300 disabled:opacity-50"
          disabled={isLoading}
          aria-label="Email address for legal event updates"
        />
        <button 
          type="submit" 
          className="bg-amber-800 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-r-md transition-colors duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
      {message && <p className="text-green-700 mt-3 text-sm">{message}</p>}
      {error && <p className="text-red-700 mt-3 text-sm">{error}</p>}
    </form>
  );
} 