// Header profile chips show only the first name, so long full names never
// crowd the bar. Falls back to the supplied label when no name is stored.
export const firstNameOf = (fullName, fallback = '') => {
  const first = (fullName || '').trim().split(/\s+/)[0];
  return first || fallback;
};
