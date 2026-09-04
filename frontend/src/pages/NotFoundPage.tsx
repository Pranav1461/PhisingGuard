import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Glowing shield icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[60px]" aria-hidden="true" />
        <div className="relative w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-white/40" />
        </div>
      </div>

      {/* 404 number */}
      <h1 className="text-7xl sm:text-8xl font-bold tracking-tighter text-white/10 select-none" aria-hidden="true">
        404
      </h1>

      {/* Message */}
      <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-white tracking-tight">
        Page not found
      </h2>
      <p className="mt-3 text-sm sm:text-base text-white/40 leading-relaxed max-w-md">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="btn btn-solid h-[44px] px-6 text-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <Link
          to="/check"
          className="btn btn-ghost h-[44px] px-6 text-sm"
        >
          <Search className="w-4 h-4 mr-2 opacity-60" />
          Check a URL
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
