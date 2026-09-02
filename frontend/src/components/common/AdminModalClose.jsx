import React from 'react';
import { XMarkIcon } from '@icons';

const AdminModalClose = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950"
    aria-label="Close dialog"
  >
    <XMarkIcon className="h-5 w-5" />
  </button>
);

export default AdminModalClose;
