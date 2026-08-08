import React, { useState } from 'react';
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="National Training Week Logo"
              className="h-30 w-auto object-contain group-hover:scale-105 transition-transform mt-3"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
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
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-black hover:bg-white transition-colors"
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-black/10 shadow-xl px-4 pt-3 pb-6 space-y-1">
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
