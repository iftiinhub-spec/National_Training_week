import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarIcon, ClockIcon, UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const AssignedSessions = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/moderator/trainings').then((res) => { if (res.success) setTrainings(res.data.trainings || []); }).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingSpinner label="Loading assigned sessions..." />;

  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Session operations</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Assigned Sessions</h1><p className="mt-1 text-sm text-slate-500">Open a session to manage its meeting, invitations, participants, QR attendance, and feedback.</p></div>
    {trainings.length ? <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{trainings.map((tr) => <article key={tr._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={tr.status} /><span className="text-xs font-bold text-[#1a6b3c]">{tr.eventDay?.dayNumber ? `Day ${tr.eventDay.dayNumber}: ${tr.eventDay.theme}` : 'Program day not assigned'}</span></div><h2 className="mt-3 text-lg font-bold text-slate-950">{tr.title}</h2><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600"><span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4 text-[#1a6b3c]" />{tr.date ? new Date(tr.date).toLocaleDateString() : 'TBA'}</span><span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4 text-[#1a6b3c]" />{tr.startTime} – {tr.endTime}</span>{tr.trainer && <span className="flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-[#1a6b3c]" />{tr.trainer.name}</span>}</div><Link to={`/moderator/trainings/${tr._id}`} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white"><WrenchScrewdriverIcon className="h-4 w-4" /> Manage session</Link></article>)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No training sessions have been assigned to your account.</div>}
  </div>;
};

export default AssignedSessions;
