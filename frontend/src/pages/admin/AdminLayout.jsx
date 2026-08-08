import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  TagIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  VideoCameraIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: Squares2X2Icon },
    { name: 'Events & Days', path: '/admin/events', icon: CalendarDaysIcon },
    { name: 'Trainings Management', path: '/admin/trainings', icon: AcademicCapIcon },
    { name: 'Trainer Profiles', path: '/admin/trainers', icon: UserGroupIcon },
    { name: 'Moderator Accounts', path: '/admin/moderators', icon: UserGroupIcon },
    { name: 'Participant Registrations', path: '/admin/registrations', icon: ClipboardDocumentCheckIcon },
    { name: 'Attendance Records', path: '/admin/attendance', icon: ClipboardDocumentCheckIcon },
    { name: 'Certificates Management', path: '/admin/certificates', icon: CheckBadgeIcon },
    { name: 'Recordings Library', path: '/admin/recordings', icon: VideoCameraIcon },
    { name: 'Categories', path: '/admin/categories', icon: TagIcon },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: ChartBarIcon },
    { name: 'Contact Messages', path: '/admin/contact-messages', icon: EnvelopeIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-white shrink-0 p-4 space-y-6">
        <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-[#1a6b3c] text-white flex items-center justify-center font-bold text-base">
            A
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-white text-sm truncate">{user?.fullName || 'System Admin'}</h4>
            <span className="text-[11px] font-semibold text-emerald-400 block uppercase">Administrator</span>
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
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#1a6b3c] text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-900">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-slate-900 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
