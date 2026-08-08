import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Squares2X2Icon,
  AcademicCapIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

export const ParticipantLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Portal Home', path: '/portal', icon: Squares2X2Icon },
    { name: 'My Registered Trainings', path: '/portal/trainings', icon: AcademicCapIcon },
    { name: 'Attendance Records', path: '/portal/attendance', icon: ClipboardDocumentCheckIcon },
    { name: 'My Certificates', path: '/portal/certificates', icon: CheckBadgeIcon },
    { name: 'Training Evaluations', path: '/portal/feedback', icon: ChatBubbleLeftEllipsisIcon },
    { name: 'My Profile', path: '/portal/profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Participant Portal Vertical Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 p-4 space-y-6">
        <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200/80">
          <div className="w-10 h-10 rounded-lg bg-[#1a6b3c] text-white flex items-center justify-center font-bold text-base">
            {user?.fullName?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-slate-900 text-sm truncate">{user?.fullName}</h4>
            <span className="text-[11px] font-semibold text-[#1a6b3c] block">Participant Portal</span>
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
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

    </div>
  );
};

export default ParticipantLayout;
