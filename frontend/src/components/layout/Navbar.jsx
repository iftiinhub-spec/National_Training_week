import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicCapIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isModerator, isParticipant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Program', path: '/program' },
    { name: 'Trainings', path: '/trainings' },
    { name: 'Recordings', path: '/recordings' },
    { name: 'Verify Certificate', path: '/verify-certificate' },
    { name: 'Contact Us', path: '/contact' },
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Placeholder (Per spec: Hormuud University identity with green/blue, no fake logo copy) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#155289] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              HU
            </div>
            <div>
              <span className="block font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                HORMUUD <span className="text-[#1a6b3c]">UNIVERSITY</span>
              </span>
              <span className="block text-xs font-semibold text-[#155289] uppercase tracking-wider">
                National Training Week
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-[#1a6b3c] font-semibold'
                      : 'text-slate-700 hover:text-[#1a6b3c] hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Buttons / User Dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-white transition-all shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a6b3c] text-white flex items-center justify-center font-bold text-sm">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#1a6b3c] font-bold">
                    {user?.role}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1a6b3c]"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      {getDashboardLabel()}
                    </Link>

                    {isParticipant && (
                      <Link
                        to="/portal/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#1a6b3c]"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 text-left border-t border-slate-100"
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
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#1a6b3c] hover:bg-emerald-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1a6b3c] hover:bg-[#124d2a] text-white shadow-xs hover:shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                location.pathname === link.path
                  ? 'bg-emerald-50 text-[#1a6b3c] font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
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
                  className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-bold bg-[#1a6b3c] text-white"
                >
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-medium text-rose-600 border border-rose-200 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-base font-semibold border border-slate-300 text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-base font-semibold bg-[#1a6b3c] text-white"
                >
                  Sign Up
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
