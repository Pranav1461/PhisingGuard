import React from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const mode = searchParams.get('mode');

  // Hide navbar and footer in login simulation (target/victim mode)
  const isLoginSimulation = Boolean(sessionId && mode === 'login');

  return (
    <div className="min-h-screen flex flex-col bg-black text-white antialiased">
      {/* Noise grain overlay */}
      <div className="grain" aria-hidden="true" />

      {!isLoginSimulation && <Navbar />}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Outlet />
      </main>
      {!isLoginSimulation && <Footer />}
    </div>
  );
};
