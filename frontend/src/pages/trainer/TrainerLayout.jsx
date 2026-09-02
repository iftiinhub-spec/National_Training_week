import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, ChatBubbleLeftRightIcon, CheckBadgeIcon, DocumentTextIcon, Squares2X2Icon, UserCircleIcon } from '@icons';
import ThemeToggle from '../../components/common/ThemeToggle';
import HeaderProfileMenu from '../../components/common/HeaderProfileMenu';
import SidebarToggle from '../../components/common/SidebarToggle';
import { useSidebarCollapse } from '../../utils/useSidebarCollapse';
import { useAuth } from '../../context/AuthContext';

export default function TrainerLayout() {
  const { logout } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const location = useLocation();
  const items = [
    { name: 'Dashboard', path: '/trainer', icon: Squares2X2Icon },
    { name: 'My Sessions', path: '/trainer/sessions', icon: AcademicCapIcon },
    { name: 'Materials', path: '/trainer/materials', icon: DocumentTextIcon },
    { name: 'Feedback', path: '/trainer/feedback', icon: ChatBubbleLeftRightIcon },
    { name: 'Certificates', path: '/trainer/certificates', icon: CheckBadgeIcon },
  ];
  const active = (path) => path === '/trainer' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItem = (item) => { const Icon = item.icon; const isActive = active(item.path); return <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} title={item.name} className={`sidebar-link flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-50 text-[#1a6b3c]' : 'text-black hover:bg-slate-100'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><Icon className="h-5 w-5" /></span><span className="sidebar-label truncate">{item.name}</span></Link>; };

  return <div className="min-h-screen bg-slate-100 md:flex">
    <aside className={`sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 text-slate-950 md:flex ${collapsed ? 'sidebar-collapsed-md' : ''}`}>
      <div className="flex h-20 shrink-0 items-center justify-center -mx-4 -mt-4 border-b border-slate-200 px-3"><img src="/logo.png" alt="National Training Week" className="sidebar-logo h-16 max-w-full object-contain" /></div>
      <nav aria-label="Trainer navigation" className="admin-sidebar-nav mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        <div><p className="sidebar-group-label mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Trainer workspace</p><div className="space-y-1">{items.map(navItem)}</div></div>
        <div><p className="sidebar-group-label mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Account</p>{navItem({ name: 'My Profile', path: '/trainer/profile', icon: UserCircleIcon })}</div>
      </nav>
      <div className="mt-4 border-t border-black pt-4"><button type="button" onClick={logout} title="Sign Out" className="sidebar-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600"><ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" /><span className="sidebar-label">Sign Out</span></button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><Link to="/trainer" className="flex items-center md:hidden" aria-label="Trainer dashboard"><img src="/logo.png" alt="" className="h-12 w-auto" /></Link><SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} className="hidden md:inline-flex" /><div className="hidden md:block"><p className="text-sm font-bold text-slate-950">Trainer Portal</p><p className="text-xs text-slate-500">National Training Week</p></div></div>
        <div className="flex min-w-0 items-center gap-2"><ThemeToggle /><HeaderProfileMenu profilePath="/trainer/profile" fallbackName="Trainer" menuLabel="Open trainer account menu" /></div>
      </header>
      <main className="min-w-0 p-4 pb-28 sm:p-6 sm:pb-28 md:pb-6 lg:p-8 xl:p-10"><div className="mx-auto w-full max-w-[90rem]"><Outlet /></div></main>
    </div>

    <nav aria-label="Trainer mobile navigation" className="participant-bottom-nav border-t border-slate-200 bg-white/95 pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur-md md:hidden"><div className="participant-bottom-nav-grid snap-x snap-mandatory px-1">{[items[0], items[1], items[2], items[3], { name: 'Profile', path: '/trainer/profile', icon: UserCircleIcon }].map((item) => { const Icon = item.icon; const isActive = active(item.path); return <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} className={`flex min-h-16 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition-colors ${isActive ? 'bg-emerald-50 text-[#1da156]' : 'text-black hover:bg-slate-50'}`}><Icon className="h-6 w-6 shrink-0" /><span className="whitespace-nowrap text-center">{item.name}</span></Link>; })}</div></nav>
  </div>;
}

