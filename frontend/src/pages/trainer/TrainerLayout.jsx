import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, ChatBubbleLeftRightIcon, CheckBadgeIcon, DocumentTextIcon, Squares2X2Icon, UserCircleIcon } from '@heroicons/react/24/solid';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

export default function TrainerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profilePhoto = user?.profilePhoto ? (user.profilePhoto.startsWith('http') ? user.profilePhoto : `/${user.profilePhoto.replace(/^\//, '')}`) : null;
  const items = [
    { name: 'Dashboard', path: '/trainer', icon: Squares2X2Icon },
    { name: 'My Sessions', path: '/trainer/sessions', icon: AcademicCapIcon },
    { name: 'Materials', path: '/trainer/materials', icon: DocumentTextIcon },
    { name: 'Feedback', path: '/trainer/feedback', icon: ChatBubbleLeftRightIcon },
    { name: 'Certificates', path: '/trainer/certificates', icon: CheckBadgeIcon },
  ];
  const active = (path) => path === '/trainer' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => { setProfileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const closeMenu = (event) => { if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileMenuOpen(false); };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setProfileMenuOpen(false); };
    document.addEventListener('mousedown', closeMenu); document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('mousedown', closeMenu); document.removeEventListener('keydown', closeOnEscape); };
  }, []);

  const navItem = (item) => { const Icon = item.icon; const isActive = active(item.path); return <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-emerald-50 text-[#1a6b3c]' : 'text-black hover:bg-slate-100'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-[#1a6b3c] text-white' : 'bg-slate-100 text-black'}`}><Icon className="h-5 w-5" /></span>{item.name}</Link>; };

  return <div className="min-h-screen bg-slate-100 md:flex">
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 text-slate-950 md:flex">
      <div className="flex h-24 shrink-0 items-center justify-center border-b border-black px-3"><img src="/logo.png" alt="National Training Week" className="h-20 max-w-full object-contain" /></div>
      <nav aria-label="Trainer navigation" className="admin-sidebar-nav mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        <div><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Trainer workspace</p><div className="space-y-1">{items.map(navItem)}</div></div>
        <div><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Account</p>{navItem({ name: 'My Profile', path: '/trainer/profile', icon: UserCircleIcon })}</div>
      </nav>
      <div className="mt-4 border-t border-black pt-4"><button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><ArrowLeftOnRectangleIcon className="h-5 w-5" />Sign Out</button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <Link to="/trainer" className="flex items-center md:hidden" aria-label="Trainer dashboard"><img src="/logo.png" alt="" className="h-12 w-auto" /></Link><div className="hidden md:block"><p className="text-sm font-bold text-slate-950">Trainer Portal</p><p className="text-xs text-slate-500">National Training Week</p></div>
        <div className="flex min-w-0 items-center gap-2"><ThemeToggle /><div ref={profileMenuRef} className="relative min-w-0 sm:min-w-52"><button type="button" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open trainer account menu" aria-expanded={profileMenuOpen} aria-haspopup="menu" className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-[#1a6b3c]/40"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a6b3c] text-sm font-bold text-white">{profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" /> : (user?.fullName || 'T').charAt(0).toUpperCase()}</div><div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-bold text-slate-950">{user?.fullName || 'Trainer'}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div></button>{profileMenuOpen && <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><Link role="menuitem" to="/trainer/profile" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-black hover:bg-slate-100"><UserCircleIcon className="h-5 w-5" /> My Profile</Link><button role="menuitem" type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50"><ArrowLeftOnRectangleIcon className="h-5 w-5" /> Sign Out</button></div>}</div></div>
      </header>
      <main className="min-w-0 p-4 pb-28 sm:p-6 sm:pb-28 md:pb-6 lg:p-8 xl:p-10"><div className="mx-auto w-full max-w-[90rem]"><Outlet /></div></main>
    </div>

    <nav aria-label="Trainer mobile navigation" className="participant-bottom-nav border-t border-slate-200 bg-white/95 pt-1.5 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur-md md:hidden"><div className="participant-bottom-nav-grid snap-x snap-mandatory px-1">{[items[0], items[1], items[2], items[3], { name: 'Profile', path: '/trainer/profile', icon: UserCircleIcon }].map((item) => { const Icon = item.icon; const isActive = active(item.path); return <Link key={item.path} to={item.path} aria-current={isActive ? 'page' : undefined} className={`flex min-h-16 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition-colors ${isActive ? 'bg-emerald-50 text-[#1da156]' : 'text-black hover:bg-slate-50'}`}><Icon className="h-6 w-6 shrink-0" /><span className="whitespace-nowrap text-center">{item.name}</span></Link>; })}</div></nav>
  </div>;
}

