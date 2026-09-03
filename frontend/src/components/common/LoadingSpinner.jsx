import React from 'react';

const LOGO_HEIGHT = { sm: 'h-8', md: 'h-12', lg: 'h-16' };

/**
 * Full-page loading state. The brand mark replaces the old text label, and the label is kept as
 * screen-reader text so the page still announces what is loading rather than going silent.
 * The logo swaps to its light variant in dark mode through the global `img[src="/logo.png"]` rule.
 */
export const LoadingSpinner = ({ label = 'Loading…', size = 'md' }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center justify-center p-10">
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      className={`${LOGO_HEIGHT[size] || LOGO_HEIGHT.md} w-auto ntw-loader-logo`}
    />
    <span className="ntw-loader-track mt-5 block h-1 w-24 rounded-full">
      <span className="ntw-loader-bar block h-full w-1/3 rounded-full bg-[#1a6b3c]" />
    </span>
    <span className="sr-only">{label}</span>
  </div>
);

export default LoadingSpinner;
