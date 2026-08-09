import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const PublicEmptyState = ({ title, description, action }) => (
  <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-black/20 bg-white px-6 py-16 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1da156]/10 text-[#1da156]">
      <CalendarDaysIcon className="h-6 w-6" />
    </div>
    <h2 className="mt-5 text-xl font-bold text-black">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/60">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default PublicEmptyState;
