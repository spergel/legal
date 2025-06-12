import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)] px-4">
      <h1 className="text-8xl font-bold text-purple-400 mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-100 mb-6">Page Not Found</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        Oops! The page you&apos;re looking for doesn&apos;t seem to exist. It might have been moved, deleted, or maybe you just mistyped the URL.
      </p>
      <Link 
        href="/"
        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
      >
        Go Back to Homepage
      </Link>
    </div>
  );
} 