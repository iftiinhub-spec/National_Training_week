import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ntw_sidebar_collapsed';

// Desktop sidebar collapse state, remembered between visits. Only affects wide
// screens; below the layout breakpoint the sidebar keeps its own drawer or
// bottom-nav behaviour and ignores this entirely.
export const useSidebarCollapse = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this session.
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((current) => !current), []);

  return { collapsed, toggleCollapsed };
};
