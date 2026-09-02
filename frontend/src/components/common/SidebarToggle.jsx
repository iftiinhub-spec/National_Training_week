import React from 'react';
import { SidebarIcon } from '@icons';

// Header control for the desktop sidebar. Hidden below the layout's own
// breakpoint, where the sidebar is a drawer or a bottom nav instead.
const SidebarToggle = ({ collapsed, onToggle, className = '' }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    aria-pressed={collapsed}
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    className={`h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-600 transition-colors hover:text-slate-900 ${className}`}
  >
    <SidebarIcon className="h-6 w-6" />
  </button>
);

export default SidebarToggle;
