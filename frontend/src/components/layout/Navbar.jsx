import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isModerator, isParticipant, isTrainer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home',               path: '/' },
    { name: 'About',              path: '/about' },
    { name: 'Program',            path: '/program' },
    { name: 'Past Editions',      path: '/past-editions' },
    { name: 'Trainings',          path: '/trainings' },
    { name: 'Recordings',         path: '/recordings' },
    { name: 'Verify Certificate', path: '/verify-certificate' },
    { name: 'Contact',            path: '/contact' },
  ];
  const primaryLinks = navLinks.filter((link) => ['/', '/about', '/program', '/trainings', '/contact'].includes(link.path));
  const moreLinks = navLinks.filter((link) => ['/past-editions', '/recordings', '/verify-certificate'].includes(link.path));

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isModerator) return '/moderator';
    if (isTrainer) return '/trainer';
    return '/portal';
  };
  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isModerator) return 'Moderator Portal';
    if (isTrainer) return 'Trainer Portal';
    return 'My Portal';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[88px] items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="National Training Week Logo"
              className="h-20 w-auto object-contain transition-transform group-hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {primaryLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-2 text-[13px] font-bold transition-colors capitalize ${
                    isActive
                      ? 'text-[#1da156]'
                      : 'text-black hover:text-[#1da156]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#1da156] rounded-full" />
                  )}
                </Link>
              );
            })}
            <div className="relative" onMouseLeave={() => setMoreMenuOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMoreMenuOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape') { setMoreMenuOpen(false); event.currentTarget.querySelector('button')?.focus(); } }}>
              <button type="button" onClick={() => setMoreMenuOpen((open) => !open)} aria-expanded={moreMenuOpen} aria-haspopup="menu" className={`relative flex items-center gap-1 px-3.5 py-2 text-[13px] font-bold transition-colors ${moreLinks.some((link) => location.pathname === link.path) ? 'text-[#1da156]' : 'text-black hover:text-[#1da156]'}`}>
                More <ChevronDownIcon className={`h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                {moreLinks.some((link) => location.pathname === link.path) && <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-[#1da156]" />}
              </button>
              {moreMenuOpen && <div role="menu" className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">{moreLinks.map((link) => <Link key={link.path} to={link.path} role="menuitem" onClick={() => setMoreMenuOpen(false)} className={`block px-4 py-3 text-sm font-semibold transition-colors ${location.pathname === link.path ? 'bg-emerald-50 text-[#1da156]' : 'text-slate-700 hover:bg-slate-50 hover:text-[#1da156]'}`}>{link.name}</Link>)}</div>}
            </div>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden xl:flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 hover:border-[#1da156] bg-white transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1da156] text-white flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-semibold max-w-[110px] truncate text-black">
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-white text-[#1da156] border border-[#1da156] font-black">
                    {user?.role}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-black/10 py-2 z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-black/10">
                      <p className="text-xs text-black/60">Signed in as</p>
                      <p className="text-sm font-bold text-black truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-white hover:text-[#1da156]"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      {getDashboardLabel()}
                    </Link>
                    {isParticipant && (
                      <Link
                        to="/portal/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-white hover:text-[#1da156]"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:text-[#1da156] border-t border-black/10 cursor-pointer"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-black hover:text-[#1da156] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[#1da156] hover:bg-black text-white shadow-xs transition-all"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 xl:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-black hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-h-[calc(100vh-88px)] overflow-y-auto bg-white border-t border-black/10 shadow-xl px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                location.pathname === link.path
                  ? 'bg-white text-[#1da156] border-l-4 border-[#1da156]'
                  : 'text-black hover:bg-white hover:text-[#1da156]'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t border-black/10">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-lg font-bold bg-[#1da156] text-white"
                >
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-center px-4 py-3 rounded-lg font-medium text-black border border-black/20 hover:bg-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="text-center px-4 py-3 rounded-lg font-semibold border border-black/20 text-black">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-center px-4 py-3 rounded-lg font-bold bg-[#1da156] text-white">
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
