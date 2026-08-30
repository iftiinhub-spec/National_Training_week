const PRESENTATION = {
  draft: { label: 'Draft', badge: 'border-slate-200 bg-slate-100 text-slate-700', control: 'border-slate-300 bg-white text-slate-700' },
  published: { label: 'Published', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', control: 'border-emerald-200 bg-emerald-50 text-[#1a6b3c]' },
  cancelled: { label: 'Cancelled', badge: 'border-rose-200 bg-rose-50 text-rose-700', control: 'border-rose-200 bg-rose-50 text-rose-700' },
  completed: { label: 'Finished', badge: 'border-slate-300 bg-slate-100 text-slate-700', control: 'border-slate-300 bg-slate-100 text-slate-700' },
  scheduled: { label: 'Scheduled', badge: 'border-sky-200 bg-sky-50 text-sky-700' },
  registration_open: { label: 'Registration open', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  registration_closed: { label: 'Registration closed', badge: 'border-amber-200 bg-amber-50 text-amber-800' },
  live: { label: 'Live', badge: 'border-violet-200 bg-violet-50 text-violet-700' },
  running: { label: 'Running', badge: 'border-violet-200 bg-violet-50 text-violet-700' },
  ended: { label: 'Finished', badge: 'border-slate-300 bg-slate-100 text-slate-700' },
  finished: { label: 'Finished', badge: 'border-slate-300 bg-slate-100 text-slate-700' },
  pending: { label: 'Pending approval', badge: 'border-amber-300 bg-amber-50 text-amber-800' },
  approved: { label: 'Approved', badge: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  rejected: { label: 'Rejected', badge: 'border-rose-300 bg-rose-50 text-rose-800' },
  not_marked: { label: 'Not marked', badge: 'border-slate-300 bg-slate-100 text-slate-600' },
  present: { label: 'Present', badge: 'border-emerald-400 bg-emerald-100 text-emerald-800' },
  absent: { label: 'Absent', badge: 'border-rose-400 bg-rose-100 text-rose-800' },
  late: { label: 'Late', badge: 'border-amber-400 bg-amber-100 text-amber-800' },
};

const fallback = { label: '', badge: 'border-slate-200 bg-slate-100 text-slate-700', control: 'border-slate-300 bg-white text-slate-700' };

export const statusPresentation = (status) => {
  const key = String(status || '').toLowerCase();
  const item = PRESENTATION[key] || fallback;
  return { ...item, label: item.label || key.replaceAll('_', ' ') };
};

export const statusControlClass = (status) => statusPresentation(status).control || fallback.control;
