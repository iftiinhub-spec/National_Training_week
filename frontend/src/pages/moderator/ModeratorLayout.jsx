import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import HeaderProfileMenu from '../../components/common/HeaderProfileMenu';
import SidebarToggle from '../../components/common/SidebarToggle';
import { useSidebarCollapse } from '../../utils/useSidebarCollapse';
import { Squares2X2Icon, AcademicCapIcon, ArrowLeftOnRectangleIcon, Bars3Icon, UserCircleIcon, XMarkIcon } from '@icons';

export const ModeratorLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const navGroups = [
    { label: 'Overview', items: [{ name: 'Dashboard', path: '/moderator', icon: Squares2X2Icon }] },
    { label: 'Session operations', items: [{ name: 'Assigned Sessions', path: '/moderator/trainings', icon: AcademicCapIcon }] },
    { label: 'Account', items: [{ name: 'My Profile', path: '/moderator/profile', icon: UserCircleIcon }] },
  ];

  return <div className="min-h-screen bg-slate-100 lg:flex">
    {sidebarOpen && <button type="button" aria-label="Close moderator menu" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,18rem)] flex-col border-r border-slate-200 bg-white p-4 text-slate-950 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none ${collapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-4 flex items-center justify-between px-1 lg:hidden"><span className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Moderator menu</span><button type="button" onClick={() => setSidebarOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close moderator menu"><XMarkIcon className="h-6 w-6" /></button></div>
      <div className="flex h-20 shrink-0 items-center justify-center -mx-4 lg:-mt-4 border-b border-slate-200 px-3"><img src="/logo.png" alt="National Training Week" className="sidebar-logo h-16 max-w-full w-auto object-contain" /></div>
      <nav className="admin-sidebar-nav mt-4 flex-1 space-y-5 overflow-y-auto pr-1">{navGroups.map((group) => <div key={group.label}><p className="sidebar-group-label mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{group.label}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = location.pathname === item.path; return <Link key={item.path} to={item.path} title={item.name} className={`sidebar-link flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-emerald-50 text-[#1a6b3c]' : 'text-black hover:bg-slate-100'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><Icon className="h-5 w-5" /></span><span className="sidebar-label truncate">{item.name}</span></Link>; })}</div></div>)}</nav>
      <div className="mt-4 border-t border-black pt-4"><button onClick={logout} title="Sign Out" className="sidebar-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600"><ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" /><span className="sidebar-label">Sign Out</span></button></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden" aria-label="Open moderator menu"><Bars3Icon className="h-6 w-6" /></button><SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} className="hidden lg:inline-flex" /><div className="hidden sm:block"><p className="text-sm font-bold text-slate-950">Moderator Workspace</p><p className="text-xs text-slate-500">Session operations</p></div></div><div className="flex min-w-0 items-center gap-2"><ThemeToggle /><HeaderProfileMenu profilePath="/moderator/profile" fallbackName="Moderator" menuLabel="Open moderator account menu" /></div></header>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10"><div className="mx-auto w-full max-w-[90rem]"><Outlet /></div></main>
    </div>
  </div>;
};

export default ModeratorLayout;
