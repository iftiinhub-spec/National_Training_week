import React from 'react';

const SIZES = {
  xs: 'h-3.5 w-3.5 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
};

/**
 * Inline spinner for buttons that are waiting on a request. It inherits the
 * button's text colour, so it reads correctly on filled, outlined and ghost
 * buttons in both themes without any per-call-site styling.
 */
export default function ButtonSpinner({ size = 'sm', className = '' }) {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent align-[-0.125em] ${SIZES[size] || SIZES.sm} ${className}`}
    />
  );
}

export { ButtonSpinner };
