import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const styles = {
    // What an administrator set on a session
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    published: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',

    // What the dates say is happening right now (the `phase` sent by the server)
    scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
    registration_open: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    registration_closed: 'bg-amber-50 text-amber-700 border-amber-200',
    live: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold animate-pulse',
    ended: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    running: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    finished: 'bg-indigo-50 text-indigo-700 border-indigo-200',

    // Registration statuses
    pending: 'bg-amber-50 text-amber-800 border-amber-300',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
    rejected: 'bg-rose-50 text-rose-800 border-rose-300',

    // Attendance statuses
    not_marked: 'bg-slate-100 text-slate-600 border-slate-300',
    present: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-semibold',
    absent: 'bg-rose-100 text-rose-800 border-rose-400',
    late: 'bg-amber-100 text-amber-800 border-amber-400',
  };

  const labels = {
    registration_open: 'Registration open',
    registration_closed: 'Registration closed',
    scheduled: 'Registration not open yet',
    live: 'Happening now',
    running: 'Running now',
    ended: 'Finished',
    finished: 'Finished',
    not_marked: 'Not Marked',
    draft: 'Draft',
    published: 'Published',
    completed: 'Finished',
    cancelled: 'Cancelled',
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
  };

  const formattedStatus = status.toLowerCase();
  const styleClass = styles[formattedStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const labelText = labels[formattedStatus] || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {labelText}
    </span>
  );
};

export default StatusBadge;
