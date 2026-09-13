import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Search, Cpu, PlayCircle, ShieldAlert, BadgeAlert } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Check Website', path: '/check', icon: Search },
  { name: 'Learn', path: '/learn', icon: BookOpen },
  { name: 'Patterns', path: '/patterns', icon: Cpu },
  { name: 'Simulator', path: '/simulator', icon: PlayCircle },
  { name: 'Fraud', path: '/fraud-detection', icon: BadgeAlert },
];

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close on resize ≥901
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const handler = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-[280ms] ${
          menuOpen
            ? 'opacity-100 visible backdrop-blur-[24px] bg-black/42'
            : 'opacity-0 invisible'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 100%)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <NavLink
              to="/"
              className="flex items-center gap-2.5 group relative z-[80]"
              aria-label="PhishGuard"
            >
              <div className="p-[5px] rounded-md bg-white/10 border border-white/10 group-hover:border-white/20 transition-colors">
                <ShieldAlert className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-semibold text-[15.5px] tracking-[-0.03em] text-white flex items-center gap-1">
                PhishGuard
                <span className="text-[10px] font-mono font-medium tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60 uppercase border border-white/10">
                  Academic
                </span>
              </span>
            </NavLink>

            {/* ── Desktop Nav (liquid-metal pills) ── */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-pill ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2 opacity-70" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* ── Desktop CTA ── */}
            <NavLink
              to="/check"
              className="hidden lg:inline-flex btn btn-solid text-[13px] h-[40px] px-4 relative z-[80]"
            >
              Check a URL
            </NavLink>

            {/* ── Mobile burger ── */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden relative z-[60] w-[44px] h-[44px] flex flex-col items-center justify-center gap-[5.5px] rounded-lg border border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15 transition-colors p-2.5"
              aria-controls="site-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`block w-[22px] h-[2px] bg-white rounded-[1px] transition-all duration-[250ms] ${menuOpen ? 'translate-y-[7.5px] rotate-45' : ''}`} />
              <span className={`block w-[22px] h-[2px] bg-white rounded-[1px] transition-all duration-[200ms] ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-[22px] h-[2px] bg-white rounded-[1px] transition-all duration-[250ms] ${menuOpen ? '-translate-y-[7.5px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile nav drawer ── */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 z-[45] transition-all duration-280 ${
            menuOpen
              ? 'opacity-100 visible translate-y-0'
              : 'opacity-0 invisible -translate-y-2'
          }`}
          id="site-nav"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 100%)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-4 py-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-lg text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 opacity-70" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <NavLink
              to="/check"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-3 btn btn-solid h-[42px] px-5 text-sm"
            >
              Check a URL
            </NavLink>
          </div>
        </div>
      </header>
    </>
  );
};
