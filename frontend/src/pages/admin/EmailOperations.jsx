import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon, EnvelopeIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusStyle = { sent: 'bg-emerald-50 text-emerald-700', queued: 'bg-blue-50 text-blue-700', processing: 'bg-amber-50 text-amber-700', retrying: 'bg-orange-50 text-orange-700', dead: 'bg-rose-50 text-rose-700', suppressed: 'bg-slate-100 text-slate-600' };
const number = (value) => Number(value || 0).toLocaleString();

export default function EmailOperations() {
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [overview, list] = await Promise.all([api.get('/admin/email-operations'), api.get('/admin/email-operations/messages', { params: { status, limit: 50 } })]);
      setSummary(overview);
      setMessages(list.items || []);
    } catch { toast.error('Could not load email delivery information.'); }
    finally { setLoading(false); }
  }, [status]);

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
    ['Waiting', summary?.waiting, 'Queued, retrying, or sending'],
    ['Sent last hour', summary?.sentLastHour, `Safe limit: ${number(summary?.hourlyLimit)}`],
    ['Remaining capacity', summary?.remainingThisHour, 'Available in the rolling hour'],
    ['Failed', summary?.statuses?.dead, 'Needs administrator review'],
  ];

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#1a6b3c]">Operations</p><h1 className="mt-1 text-2xl font-black text-slate-950">Email delivery</h1><p className="mt-1 text-sm text-slate-500">A controlled queue protects the provider limit and keeps every message visible.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"><ArrowPathIcon className="h-4 w-4" />Refresh</button>
        {paused ? <button disabled={working || summary?.deliveryDisabled} onClick={() => action('/admin/email-operations/resume', {}, 'Email delivery resumed.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1a6b3c] px-4 text-sm font-bold text-white disabled:opacity-50"><PlayIcon className="h-4 w-4" />Resume delivery</button> : <button disabled={working} onClick={() => action('/admin/email-operations/pause', {}, 'Email delivery paused.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"><PauseIcon className="h-4 w-4" />Pause delivery</button>}
      </div>
    </header>

    {paused && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Delivery is paused.</strong> {summary?.deliveryDisabled ? 'It is disabled in the server environment; enable it there before using Resume.' : summary?.circuit?.reason}</div>}

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{number(value)}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>)}</section>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-slate-950">Message queue</h2><p className="mt-1 text-xs text-slate-500">Estimated time to clear: about {number(summary?.estimatedMinutes)} minutes.</p></div><select aria-label="Filter by delivery status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"><option value="">All statuses</option>{['queued','processing','retrying','sent','dead','suppressed'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Message</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{messages.map((item) => <tr key={item._id}><td className="max-w-56 truncate px-5 py-4 font-semibold text-slate-800">{item.to}</td><td className="max-w-64 truncate px-5 py-4 text-slate-600" title={item.subject}>{item.subject}</td><td className="px-5 py-4 capitalize text-slate-600">{item.category.replaceAll('_', ' ')}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[item.status] || statusStyle.queued}`}>{item.status}</span>{item.lastError && <p title={item.lastError} className="mt-1 max-w-44 truncate text-xs text-rose-600">{item.lastError}</p>}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td><td className="px-5 py-4">{['dead','suppressed'].includes(item.status) && <button disabled={working} onClick={() => action('/admin/email-operations/retry', { ids: [item._id] }, 'Email queued for retry.')} className="font-bold text-[#1a6b3c] hover:underline">Retry</button>}</td></tr>)}</tbody></table>{!messages.length && <div className="flex flex-col items-center px-6 py-14 text-center"><EnvelopeIcon className="h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No email messages found</p></div>}</div>
    </section>
  </div>;
}
