import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isModerator, isParticipant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect hero pages (transparent navbar on top)
  const isHeroPage = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home',               path: '/' },
    { name: 'About',              path: '/about' },
    { name: 'Program',            path: '/program' },
    { name: 'Trainings',          path: '/trainings' },
    { name: 'Recordings',         path: '/recordings' },
    { name: 'Verify Certificate', path: '/verify-certificate' },
    { name: 'Contact',            path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isModerator) return '/moderator';
    return '/portal';
  };
  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isModerator) return 'Moderator Portal';
    return 'My Portal';
  };

  // Transparent when on hero page and not scrolled; solid white otherwise
  const transparent = isHeroPage && !scrolled && !mobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/98 backdrop-blur-md shadow-sm border-b border-slate-200/70'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#155289] flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform">
              NTW
            </div>
            <span className={`font-extrabold text-base leading-tight transition-colors ${transparent ? 'text-white' : 'text-slate-900'}`}>
              National <span className="text-[#1a6b3c]">Training Week</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-2 text-[13px] font-semibold tracking-wide uppercase transition-colors ${
                    transparent
                      ? isActive
                        ? 'text-emerald-300'
                        : 'text-white/80 hover:text-white'
                      : isActive
                      ? 'text-[#1a6b3c]'
                      : 'text-slate-600 hover:text-[#1a6b3c]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#1a6b3c] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    transparent
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#1a6b3c] text-white flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className={`text-sm font-semibold max-w-[100px] truncate ${transparent ? 'text-white' : 'text-slate-800'}`}>
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#1a6b3c] font-black">
                    {user?.role}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#1a6b3c]"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      {getDashboardLabel()}
                    </Link>
                    {isParticipant && (
                      <Link
                        to="/portal/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#1a6b3c]"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100"
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
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    transparent ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:text-[#1a6b3c]'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#1a6b3c] hover:bg-[#124d2a] text-white shadow transition-all"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              transparent ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-xl px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors ${
                location.pathname === link.path
                  ? 'bg-emerald-50 text-[#1a6b3c] border-l-4 border-[#1a6b3c]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#1a6b3c]'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-lg font-bold bg-[#1a6b3c] text-white"
                >
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-center px-4 py-3 rounded-lg font-medium text-rose-600 border border-rose-200 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="text-center px-4 py-3 rounded-lg font-semibold border border-slate-300 text-slate-700">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-center px-4 py-3 rounded-lg font-bold bg-[#1a6b3c] text-white">
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
