import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AcademicCapIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, ClockIcon, DocumentTextIcon, MapPinIcon, UserGroupIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { formatTimeRange12 } from '../../utils/timeFormat';

const sessionTime = (session) => new Date(`${String(session.date).slice(0, 10)}T${session.startTime || '00:00'}:00`).getTime();
const statusStyle = { ongoing: 'bg-green-100 text-green-800', completed: 'bg-black/5 text-black/60', registration_open: 'bg-green-50 text-green-800', published: 'bg-green-50 text-green-800', draft: 'bg-black/5 text-black/60', cancelled: 'bg-red-50 text-red-700' };

export default function TrainerDashboard({ sessionsOnly = false }) {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const load = async () => { try { const response = await api.get('/trainer/dashboard'); setData(response.data); } catch (error) { toast.error(error.message || 'Unable to load trainer workspace.'); } };
  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const sessions = data?.sessions || [];
    const now = Date.now();
    const upcoming = sessions.filter((item) => sessionTime(item) >= now && item.status !== 'cancelled').sort((a, b) => sessionTime(a) - sessionTime(b));
    const participants = sessions.reduce((total, item) => total + item.participants.length, 0);
    const present = sessions.reduce((total, item) => total + item.attendancePresent, 0);
    const ratings = sessions.flatMap((item) => item.feedback.map((feedback) => feedback.trainerRating)).filter(Number.isFinite);
    return { upcoming, participants, present, attendanceRate: participants ? Math.round((present / participants) * 100) : 0, averageRating: ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : '—', feedbackCount: ratings.length };
  }, [data]);

  const addMaterial = async (event, trainingId) => { event.preventDefault(); const formElement = event.currentTarget; const payload = new FormData(formElement); try { await api.post(`/trainer/trainings/${trainingId}/materials`, Object.fromEntries(payload)); formElement.reset(); await load(); toast.success('Material added.'); } catch (error) { toast.error(error.message); } };
  const removeMaterial = async (trainingId, materialId) => { try { await api.delete(`/trainer/trainings/${trainingId}/materials/${materialId}`); await load(); toast.success('Material removed.'); } catch (error) { toast.error(error.message); } };

  if (!data) return <DashboardSkeleton />;
  const nextSession = summary.upcoming[0];
  return <div className="space-y-7">
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a6b3c]">{sessionsOnly ? 'Session workspace' : 'Trainer dashboard'}</p><h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{sessionsOnly ? 'My sessions' : `Welcome, ${data.trainer.name?.split(' ')[0]}`}</h1><p className="mt-2 text-sm text-slate-500">{sessionsOnly ? 'Open a session to view learners, feedback, meeting access, and learning materials.' : 'A clear overview of your training activity and performance.'}</p></div>{!sessionsOnly && <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#1a6b3c]">Approved trainer</span>}</header>

    {!sessionsOnly && <><section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Trainer analytics">
      <Metric icon={AcademicCapIcon} label="Assigned sessions" value={data.sessions.length} detail={`${summary.upcoming.length} upcoming`} />
      <Metric icon={UserGroupIcon} label="Approved learners" value={summary.participants} detail="Across your sessions" />
      <Metric icon={CalendarDaysIcon} label="Attendance rate" value={`${summary.attendanceRate}%`} detail={`${summary.present} marked present`} />
      <Metric icon={ChatBubbleLeftRightIcon} label="Trainer rating" value={summary.averageRating === '—' ? '—' : `${summary.averageRating}/5`} detail={`${summary.feedbackCount} responses`} />
    </section>

    <section className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"><span className="absolute inset-y-0 left-0 w-1.5 bg-[#1a6b3c]" /><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Next session</p>{nextSession ? <div className="mt-4"><h2 className="text-2xl font-bold text-slate-950">{nextSession.title}</h2><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="inline-flex items-center gap-2"><CalendarDaysIcon className="h-5 w-5 text-[#1a6b3c]" />{new Date(nextSession.date).toLocaleDateString()}</span><span className="inline-flex items-center gap-2"><ClockIcon className="h-5 w-5 text-[#1a6b3c]" />{formatTimeRange12(nextSession.startTime, nextSession.endTime)}</span><span className="inline-flex items-center gap-2"><MapPinIcon className="h-5 w-5 text-[#1a6b3c]" />Day {nextSession.eventDay?.dayNumber || '—'}</span></div>{nextSession.meeting ? <a href={nextSession.meeting.meetingUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1da156] px-5 py-3 text-sm font-bold text-white"><VideoCameraIcon className="h-5 w-5" /> Join meeting</a> : <p className="mt-5 text-sm text-slate-500">Meeting access has not been added by the administrator.</p>}</div> : <p className="mt-4 text-sm text-slate-500">No upcoming session is currently assigned.</p>}</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Workspace summary</p><dl className="mt-4 space-y-4"><SummaryRow label="Learning materials" value={data.sessions.reduce((sum, item) => sum + item.materials.length, 0)} /><SummaryRow label="Completed sessions" value={data.sessions.filter((item) => item.status === 'completed').length} /><SummaryRow label="Feedback comments" value={data.sessions.reduce((sum, item) => sum + item.feedback.filter((feedback) => feedback.comments).length, 0)} /></dl></div>
    </section></>}

    {sessionsOnly && <section>{data.sessions.length ? <div className="space-y-4">{data.sessions.map((session) => <SessionCard key={session._id} session={session} open={expanded === session._id} onToggle={() => setExpanded(expanded === session._id ? null : session._id)} onAdd={addMaterial} onRemove={removeMaterial} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><AcademicCapIcon className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No assigned sessions</h3><p className="mt-1 text-sm text-slate-500">Sessions will appear here after an administrator assigns you.</p></div>}</section>}
  </div>;
}

function Metric({ icon: Icon, label, value, detail }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#1a6b3c]"><Icon className="h-5 w-5" /></span><p className="mt-4 text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-700 sm:text-sm">{label}</p><p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{detail}</p></article>; }
function SummaryRow({ label, value }) { return <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-sm text-slate-500">{label}</dt><dd className="font-black text-slate-950">{value}</dd></div>; }

function SessionCard({ session, open, onToggle, onAdd, onRemove }) {
  const attendanceRate = session.participants.length ? Math.round((session.attendancePresent / session.participants.length) * 100) : 0;
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6" aria-expanded={open}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyle[session.status] || 'bg-slate-100 text-slate-600'}`}>{session.status.replaceAll('_', ' ')}</span><span className="text-xs text-slate-400">{session.category?.name || 'Uncategorized'}</span></div><h3 className="mt-2 text-lg font-bold text-slate-950">{session.title}</h3><p className="mt-2 text-sm text-slate-500">{new Date(session.date).toLocaleDateString()} · {formatTimeRange12(session.startTime, session.endTime)} · Day {session.eventDay?.dayNumber || '—'}</p></div><div className="flex shrink-0 items-center gap-4"><div className="hidden text-right text-xs sm:block"><p className="font-bold text-slate-900">{session.participants.length} learners</p><p className="mt-1 text-slate-400">{attendanceRate}% attendance</p></div><ChevronDownIcon className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} /></div></button>
    {open && <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-3"><Panel title="Approved learners" icon={UserGroupIcon}>{session.participants.length ? <ul className="space-y-2 text-sm text-slate-600">{session.participants.map((item) => <li key={item._id} className="rounded-lg bg-white px-3 py-2">{item.participant?.fullName}</li>)}</ul> : <Empty text="No approved learners yet." />}</Panel><Panel title="Participant feedback" icon={ChatBubbleLeftRightIcon}>{session.feedback.length ? <div className="space-y-2">{session.feedback.map((item) => <div key={item._id} className="rounded-lg bg-white p-3 text-sm"><p className="font-bold text-[#1a6b3c]">{item.trainerRating}/5 rating</p>{item.comments && <p className="mt-1 text-slate-600">{item.comments}</p>}</div>)}</div> : <Empty text="No feedback received yet." />}</Panel><Panel title="Learning materials" icon={DocumentTextIcon}><div className="space-y-2">{session.materials.map((item) => <div key={item._id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"><a href={item.url} target="_blank" rel="noreferrer" className="truncate font-semibold text-[#1a6b3c] hover:underline">{item.title}</a>{session.status !== 'completed' && <button type="button" onClick={() => onRemove(session._id, item._id)} className="text-xs font-bold text-red-600">Delete</button>}</div>)}{!session.materials.length && <Empty text="No materials added yet." />}</div>{session.status !== 'completed' && <form onSubmit={(event) => onAdd(event, session._id)} className="mt-3 space-y-2"><input name="title" placeholder="e.g. Presentation slides" required className="w-full rounded-lg border border-black/10 bg-white p-2.5 text-sm" /><input name="url" type="url" placeholder="e.g. https://docs.google.com/..." required className="w-full rounded-lg border border-black/10 bg-white p-2.5 text-sm" /><button className="w-full rounded-lg bg-[#1a6b3c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#124d2a]">Add material</button></form>}</Panel></div></div>}
  </article>;
}
function Panel({ title, icon: Icon, children }) { return <section><h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Icon className="h-5 w-5 text-[#1a6b3c]" />{title}</h4>{children}</section>; }
function Empty({ text }) { return <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">{text}</p>; }
function DashboardSkeleton() { return <div className="space-y-6 animate-pulse"><div className="h-20 rounded-2xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-2xl bg-slate-200" />)}</div><div className="h-52 rounded-2xl bg-slate-200" /></div>; }


