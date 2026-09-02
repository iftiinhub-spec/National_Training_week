import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, ChevronDownIcon, UserCircleIcon } from '@icons';
import { useAuth } from '../../context/AuthContext';
import { firstNameOf } from '../../utils/firstName';

const roleLabels = {
  admin: 'Administrator',
  moderator: 'Moderator',
  trainer: 'Trainer',
  participant: 'Participant',
};

// One profile control for every portal header: avatar, first name, role, and a
// menu holding the two account actions. Borderless by design so it reads as
// part of the header rather than as a button sitting on top of it.
const HeaderProfileMenu = ({ profilePath, fallbackName, menuLabel }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const photo = user?.profilePhoto
    ? (user.profilePhoto.startsWith('http') ? user.profilePhoto : `/${user.profilePhoto.replace(/^\//, '')}`)
    : null;
  const role = roleLabels[user?.role] || fallbackName;

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={menuLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a6b3c] text-sm font-bold text-white">
          {photo
            ? <img src={photo} alt="" className="h-full w-full object-cover" />
            : firstNameOf(user?.fullName, fallbackName).charAt(0).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-bold text-slate-950">{firstNameOf(user?.fullName, fallbackName)}</span>
          <span className="block truncate text-xs text-slate-500">{role}</span>
        </span>
        <ChevronDownIcon aria-hidden="true" className={`hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <Link role="menuitem" to={profilePath} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-black hover:bg-slate-100">
            <UserCircleIcon className="h-5 w-5" /> My Profile
          </Link>
          <button role="menuitem" type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderProfileMenu;
