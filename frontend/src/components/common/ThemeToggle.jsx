import React from 'react';
import { MoonIcon, SunIcon } from '@icons';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`theme-toggle inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent text-slate-900 transition-colors hover:bg-slate-100 hover:text-[#1da156] focus-visible:ring-2 focus-visible:ring-[#1da156]/50 dark:hover:bg-white/10 ${className}`}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
