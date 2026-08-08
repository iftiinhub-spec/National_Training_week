import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Squares2X2Icon,
  AcademicCapIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const ModeratorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Moderator Dashboard', path: '/moderator', icon: Squares2X2Icon },
    { name: 'Assigned Sessions', path: '/moderator/trainings', icon: AcademicCapIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 p-4 space-y-6">
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
            M
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-white text-sm truncate">{user?.fullName}</h4>
            <span className="text-[11px] font-semibold text-blue-400 block uppercase">Session Moderator</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#1a6b3c] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

    </div>
  );
};

export default ModeratorLayout;
