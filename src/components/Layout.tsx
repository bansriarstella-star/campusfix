import React from 'react';
import {
  Home,
  LayoutGrid,
  ClipboardList,
  User,
  Briefcase,
  Shield,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AppRoute =
  | 'home'
  | 'services'
  | 'book'
  | 'requests'
  | 'request-detail'
  | 'profile'
  | 'provider'
  | 'admin';

interface LayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function Layout({ currentPath, onNavigate, children }: LayoutProps) {
  const { firebaseUser, isAdmin, isProvider, signInWithGoogle, authBusy } = useAuth();

  const isActive = (prefix: string) => {
    if (prefix === '/') return currentPath === '/';
    return currentPath === prefix || currentPath.startsWith(`${prefix}/`);
  };

  const navLinks: { label: string; path: string }[] = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'My Requests', path: '/requests' },
    { label: 'Profile', path: '/profile' },
  ];

  if (isProvider) {
    navLinks.push({ label: 'Provider', path: '/provider' });
  }
  if (isAdmin) {
    navLinks.push({ label: 'Admin', path: '/admin' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] text-[#0F1F3D]">
      {/* Desktop & Mobile Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="font-display text-lg md:text-xl font-bold tracking-tight text-[#0F1F3D] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
          >
            CampusFix
          </a>

          {/* Zone 2: Clean single-line text navigation (Desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navLinks.map((item) => {
              const active = isActive(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path);
                  }}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? 'text-[#0F1F3D] border-teal-600 font-semibold'
                      : 'text-slate-600 border-transparent hover:text-[#0F1F3D] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center gap-2 shrink-0">
            {!firebaseUser ? (
              <button
                type="button"
                disabled={authBusy}
                onClick={() => signInWithGoogle()}
                className="min-h-[38px] md:min-h-[44px] px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs md:text-sm font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{authBusy ? 'Signing in...' : 'Sign in'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="min-h-[38px] md:min-h-[44px] px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs md:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Book a service
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Role quick-bar on mobile only when authorized */}
      {(isProvider || isAdmin) && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            Workspace:
          </span>
          {isProvider && (
            <button
              type="button"
              onClick={() => onNavigate('/provider')}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
                isActive('/provider')
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-[#0F1F3D] hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Provider Console
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
                isActive('/admin')
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-[#0F1F3D] hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Console
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-12">
        {children}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mb-14 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <p className="leading-relaxed">
            CampusFix is an individual student venture prototype for Entrepreneurship &amp; Innovation at DBS Global University (Dehradun). Not an official university service.
          </p>
          <p className="leading-relaxed sm:text-right shrink-0">
            Payments are arranged directly with providers · No online payment gateway in v1
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar (56px height + 48px top bar <= 15% mobile viewport) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-4 h-14">
          {[
            { label: 'Home', path: '/', Icon: Home },
            { label: 'Services', path: '/services', Icon: LayoutGrid },
            { label: 'Requests', path: '/requests', Icon: ClipboardList },
            { label: 'Profile', path: '/profile', Icon: User },
          ].map(({ label, path, Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => onNavigate(path)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  active ? 'text-teal-700 font-semibold' : 'text-slate-500 hover:text-[#0F1F3D]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                <span className="text-[11px] mt-0.5 whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
