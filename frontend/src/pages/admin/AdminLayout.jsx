import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
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
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/solid';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profilePhoto = user?.profilePhoto ? (user.profilePhoto.startsWith('http') ? user.profilePhoto : `/${user.profilePhoto.replace(/^\//, '')}`) : null;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navGroups = [
    {
      label: 'Overview',
      items: [{ name: 'Dashboard', path: '/admin', icon: Squares2X2Icon }],
    },
    {
      label: 'Program',
      items: [
        { name: 'Events & Days', path: '/admin/events', icon: CalendarDaysIcon },
        { name: 'Categories', path: '/admin/categories', icon: TagIcon },
        { name: 'Training Sessions', path: '/admin/trainings', icon: AcademicCapIcon },
        { name: 'Recording Library', path: '/admin/recordings', icon: VideoCameraIcon },
        { name: 'Sponsors & Partners', path: '/admin/sponsors', icon: BuildingOffice2Icon },
      ],
    },
    {
      label: 'People',
      items: [
        { name: 'Trainer Profiles', path: '/admin/trainers', icon: UserGroupIcon },
        { name: 'Moderator Accounts', path: '/admin/moderators', icon: UserGroupIcon },
        { name: 'Registrations', path: '/admin/registrations', icon: ClipboardDocumentCheckIcon },
      ],
    },
    {
      label: 'Operations',
      items: [
        { name: 'Attendance', path: '/admin/attendance', icon: ClipboardDocumentCheckIcon },
        { name: 'Certificates', path: '/admin/certificates', icon: CheckBadgeIcon },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: ChartBarIcon },
        { name: 'Contact Messages', path: '/admin/contact-messages', icon: EnvelopeIcon },
        { name: 'FAQ Management', path: '/admin/faqs', icon: QuestionMarkCircleIcon },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'My Profile', path: '/admin/profile', icon: UserCircleIcon },
        { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon },
      ],
    },
  ];

  return (
    <div className="admin-shell min-h-screen bg-slate-100 lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close administration menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,18rem)] flex-col border-r border-slate-200 bg-white p-4 text-slate-950 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center justify-between px-1 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Admin menu</span>
          <button type="button" onClick={() => setSidebarOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close administration menu">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex h-24 shrink-0 items-center justify-center border-b border-black px-3">
          <img src="/logo.png" alt="National Training Week" className="h-20 max-w-full w-auto object-contain" />
        </div>

        <nav className="admin-sidebar-nav mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{group.label}</p>
              <div className="space-y-1">{group.items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-[#1a6b3c] shadow-xs'
                    : 'text-black hover:bg-slate-100'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><Icon className="h-5 w-5" /></span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
              })}</div>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-black pt-4">
          <button
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-label="Open administration menu"
              aria-expanded={sidebarOpen}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-950">Management Portal</p>
              <p className="text-xs text-slate-500">National Training Week</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/admin/profile" aria-label="Open administrator profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-[#1a6b3c]/40 hover:bg-emerald-50 sm:min-w-52">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a6b3c] text-sm font-bold text-white">
              {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" /> : (user?.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{user?.fullName || 'System Admin'}</p>
              {user?.email && <p className="hidden truncate text-xs text-slate-500 sm:block">{user.email}</p>}
            </div>
          </Link>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="mx-auto w-full max-w-[90rem]">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
