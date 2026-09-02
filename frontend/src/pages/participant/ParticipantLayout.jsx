import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import HeaderProfileMenu from '../../components/common/HeaderProfileMenu';
import SidebarToggle from '../../components/common/SidebarToggle';
import { useSidebarCollapse } from '../../utils/useSidebarCollapse';
import {
  Squares2X2Icon, AcademicCapIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon,
  ChatBubbleLeftEllipsisIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, DocumentTextIcon,
} from '@icons';

const ParticipantLayout = () => {
  const { logout } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const location = useLocation();
  const items = [
    { name: 'Home', desktopName: 'Portal Home', path: '/portal', icon: Squares2X2Icon },
    { name: 'Trainings', desktopName: 'My Trainings', path: '/portal/trainings', icon: AcademicCapIcon },
    { name: 'Materials', desktopName: 'Learning Materials', path: '/portal/materials', icon: DocumentTextIcon },
    { name: 'Attendance', desktopName: 'Attendance Records', path: '/portal/attendance', icon: ClipboardDocumentCheckIcon },
    { name: 'Certificates', desktopName: 'My Certificates', path: '/portal/certificates', icon: CheckBadgeIcon },
    { name: 'Feedback', desktopName: 'Training Evaluations', path: '/portal/feedback', icon: ChatBubbleLeftEllipsisIcon },
  ];
  const active = (path) => location.pathname === path;

  return <div className="min-h-screen bg-slate-100 lg:flex">
    <aside className={`sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 text-slate-950 lg:flex ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="flex h-20 shrink-0 items-center justify-center -mx-4 -mt-4 border-b border-slate-200 px-3"><img src="/logo.png" alt="National Training Week" className="sidebar-logo h-16 max-w-full w-auto object-contain" /></div>
      <nav aria-label="Participant navigation" className="admin-sidebar-nav mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        <div><p className="sidebar-group-label mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Learning portal</p><div className="space-y-1">{items.map((item) => { const Icon = item.icon; return <Link key={item.path} to={item.path} title={item.desktopName} className={`sidebar-link flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${active(item.path) ? 'bg-emerald-50 text-[#1a6b3c]' : 'text-black hover:bg-slate-100'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active(item.path) ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><Icon className="h-5 w-5" /></span><span className="sidebar-label truncate">{item.desktopName}</span></Link>; })}</div></div>
        <div><p className="sidebar-group-label mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Account</p><Link to="/portal/profile" title="My Profile" className={`sidebar-link flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${active('/portal/profile') ? 'bg-emerald-50 text-[#1a6b3c]' : 'text-black hover:bg-slate-100'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active('/portal/profile') ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><UserCircleIcon className="h-5 w-5" /></span><span className="sidebar-label truncate">My Profile</span></Link></div>
      </nav>
      <div className="mt-4 border-t border-black pt-4"><button onClick={logout} title="Sign Out" className="sidebar-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600"><ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" /><span className="sidebar-label">Sign Out</span></button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><Link to="/portal" className="flex items-center lg:hidden" aria-label="Participant portal home"><img src="/logo.png" alt="" className="h-12 w-auto" /></Link><SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} className="hidden lg:inline-flex" /><div className="hidden lg:block"><p className="text-sm font-bold text-slate-950">Learning Portal</p><p className="text-xs text-slate-500">National Training Week</p></div></div><div className="flex min-w-0 items-center gap-2"><ThemeToggle /><HeaderProfileMenu profilePath="/portal/profile" fallbackName="Participant" menuLabel="Open participant account menu" /></div></header>
      <main className="min-w-0 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8 xl:p-10"><div className="mx-auto w-full max-w-[90rem]"><Outlet /></div></main>
    </div>

    <nav aria-label="Participant mobile navigation" className="participant-bottom-nav border-t border-slate-200 bg-white/95 pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur-md lg:hidden"><div className="participant-bottom-nav-grid">{items.map((item) => { const Icon = item.icon; const isActive = active(item.path); return <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 text-[11px] font-bold leading-tight transition-colors ${isActive ? 'text-[#1da156]' : 'text-black'}`}><span className="flex h-8 w-10 items-center justify-center"><Icon className="h-6 w-6" /></span><span className="w-full whitespace-nowrap text-center">{item.name}</span></Link>; })}</div></nav>
  </div>;
};

export default ParticipantLayout;
