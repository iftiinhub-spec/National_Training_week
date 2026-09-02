import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon, EnvelopeIcon, PauseIcon, PlayIcon, ClockIcon, PaperAirplaneIcon,
  ChartBarIcon, ExclamationTriangleIcon, KeyIcon, CalendarDaysIcon, CheckCircleIcon,
  XCircleIcon, TicketIcon, BellAlertIcon, UserPlusIcon, ClipboardDocumentCheckIcon,
  CheckBadgeIcon, MegaphoneIcon,
} from '@icons';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const number = (value) => Number(value || 0).toLocaleString();
const categoryMeta = {
  password_reset: ['Password resets', KeyIcon], cancellation: ['Cancellations', ExclamationTriangleIcon],
  schedule_change: ['Schedule changes', CalendarDaysIcon], approval: ['Approvals', CheckCircleIcon],
  rejection: ['Rejections', XCircleIcon], invitation: ['Invitations', TicketIcon],
  reminder: ['Reminders', BellAlertIcon], welcome: ['Welcome messages', UserPlusIcon],
  application_received: ['Applications received', ClipboardDocumentCheckIcon], certificate: ['Certificates', CheckBadgeIcon],
  announcement: ['Announcements', MegaphoneIcon], general: ['General messages', EnvelopeIcon],
};

export default function EmailOperations() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const overview = await api.get('/admin/email-operations');
      setSummary(overview);
    } catch { toast.error('Could not load email delivery information.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, [load]);

  const action = async (path, body, success) => {
    setWorking(true);
    try { await api.post(path, body); toast.success(success); await load(); }
    catch (error) { toast.error(error.message || 'Email operation failed.'); }
    finally { setWorking(false); }
  };

  if (loading) return <LoadingSpinner label="Loading email queue..." />;
  const paused = summary?.circuit?.open || summary?.deliveryDisabled;
  const cards = [
    ['Waiting', summary?.waiting, 'Queued, retrying, or sending', ClockIcon],
    ['Sent last hour', summary?.sentLastHour, `Safe limit: ${number(summary?.hourlyLimit)}`, PaperAirplaneIcon],
    ['Remaining capacity', summary?.remainingThisHour, 'Available in the rolling hour', ChartBarIcon],
    ['Failed', summary?.statuses?.dead, 'Needs administrator review', ExclamationTriangleIcon],
  ];
  const categoryCounts = new Map((summary?.categories || []).map((item) => [item.category, item]));
  const categories = Object.entries(categoryMeta).map(([category, [label, Icon]]) => ({ category, label, Icon, ...(categoryCounts.get(category) || {}) }));

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#1a6b3c]">Operations</p><h1 className="mt-1 text-2xl font-black text-slate-950">Email delivery</h1><p className="mt-1 text-sm text-slate-500">A controlled queue protects the provider limit and keeps every message visible.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"><ArrowPathIcon className="h-4 w-4" />Refresh</button>
        {paused ? <button disabled={working || summary?.deliveryDisabled} onClick={() => action('/admin/email-operations/resume', {}, 'Email delivery resumed.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1a6b3c] px-4 text-sm font-bold text-white disabled:opacity-50"><PlayIcon className="h-4 w-4" />Resume delivery</button> : <button disabled={working} onClick={() => action('/admin/email-operations/pause', {}, 'Email delivery paused.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"><PauseIcon className="h-4 w-4" />Pause delivery</button>}
      </div>
    </header>

    {paused && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Delivery is paused.</strong> {summary?.deliveryDisabled ? 'It is disabled in the server environment; enable it there before using Resume.' : summary?.circuit?.reason}</div>}

    <section>
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Live delivery</p><h2 className="mt-1 text-xl font-bold text-slate-950">Queue snapshot</h2></div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note, Icon]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-600">{label}</p><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><Icon aria-hidden="true" className="h-5 w-5" /></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{number(value)}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}</div>
    </section>

    <section>
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Message types</p><h2 className="mt-1 text-xl font-bold text-slate-950">Email counts by category</h2><p className="mt-1 text-sm text-slate-500">See how many messages are waiting, sent, or failed for every communication type.</p></div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.map(({ category, label, Icon, total, waiting, sent, failed }) => <article key={category} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{label}</p><p className="mt-1 text-xs text-slate-500">{number(total)} total</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><Icon aria-hidden="true" className="h-5 w-5" /></span></div><dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center"><div><dt className="text-[11px] font-semibold text-slate-500">Waiting</dt><dd className="mt-1 text-lg font-bold text-blue-700">{number(waiting)}</dd></div><div><dt className="text-[11px] font-semibold text-slate-500">Sent</dt><dd className="mt-1 text-lg font-bold text-emerald-700">{number(sent)}</dd></div><div><dt className="text-[11px] font-semibold text-slate-500">Failed</dt><dd className="mt-1 text-lg font-bold text-rose-700">{number(failed)}</dd></div></dl></article>)}</div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><EnvelopeIcon aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-950">Delivery summary</h2><p className="mt-1 text-sm leading-6 text-slate-600">Individual participant names and email accounts are intentionally hidden. Use the category cards above to monitor delivery totals safely.</p><p className="mt-2 text-sm text-slate-500">At the current limit, the waiting queue will take about <strong className="text-slate-700">{number(summary?.estimatedMinutes)} minutes</strong> to clear after delivery is active.</p></div></div>
    </section>
  </div>;
}
