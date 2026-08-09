import React from 'react';

const PublicPageHeader = ({ eyebrow, title, description, children }) => (
  <header className="public-page-hero">
    <div className="absolute inset-0 pointer-events-none opacity-10 bg-grid-pattern" />
    <div className="relative z-10 mx-auto max-w-4xl px-4">
      {eyebrow && <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.2em] text-white/75">{eyebrow}</p>}
      <h1 className="text-4xl font-bold leading-tight tracking-[-.03em] text-white sm:text-5xl">{title}</h1>
      {description && <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{description}</p>}
      {children}
    </div>
  </header>
);

export default PublicPageHeader;
