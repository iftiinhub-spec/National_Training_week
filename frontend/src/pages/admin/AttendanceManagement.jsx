import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@icons';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import AdminModalClose from '../../components/common/AdminModalClose';
import ButtonSpinner from '../../components/common/ButtonSpinner';

export default function AttendanceManagement() {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [review, setReview] = useState({ open: false, endsAt: null, finalizedAt: null });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '' });
  const [search, setSearch] = useState('');
  const [pendingCorrection, setPendingCorrection] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingRecordId, setSavingRecordId] = useState('');

  useEffect(() => {
    api.get('/admin/trainings?limit=100').then((res) => {
      const items = res.success ? res.data || [] : [];
      setTrainings(items); setSelectedTraining(items[0]?._id || '');
    }).catch(() => toast.error('Failed to load trainings.')).finally(() => setLoading(false));
  }, []);

  const filteredTrainings = useMemo(() => trainings.filter((item) => (!filters.event || String(item.event?._id || item.event) === filters.event) && (!filters.eventDay || String(item.eventDay?._id || item.eventDay) === filters.eventDay)), [trainings, filters.event, filters.eventDay]);
  useEffect(() => { setSelectedTraining(filters.training || filteredTrainings[0]?._id || ''); }, [filters.training, filteredTrainings]);

  const fetchAttendance = async (trainingId) => {
    if (!trainingId) return;
    try {
      const res = await api.get(`/admin/trainings/${trainingId}/attendance`);
      if (res.success) { setRecords(res.data.records || []); setStats(res.data.stats); setReview(res.data.review || { open: false, endsAt: null, finalizedAt: null }); }
    } catch { toast.error('Failed to load attendance records.'); }
  };
  useEffect(() => { if (selectedTraining) fetchAttendance(selectedTraining); else { setRecords([]); setStats(null); } }, [selectedTraining]);

  const activeTraining = useMemo(() => trainings.find((item) => item._id === selectedTraining), [trainings, selectedTraining]);
  const completed = activeTraining?.status === 'completed';
  const attendanceLocked = completed && !review.open && !review.correctionOpen;

  const saveAttendance = async (record, status, reason = '') => {
    setSavingRecordId(record._id);
    try {
      const res = await api.patch(`/admin/trainings/${selectedTraining}/attendance/${record._id}`, { status, ...(reason ? { correctionReason: reason } : {}) });
      toast.success(res.message || 'Attendance updated.'); await fetchAttendance(selectedTraining); return true;
    } catch (error) { toast.error(error.message || 'Update failed.'); return false; }
    finally { setSavingRecordId(''); }
  };
  const requestUpdate = async (record, status) => {
    if (!completed) return saveAttendance(record, status);
    if (!review.open && !review.correctionOpen) return toast.error('The correction period for this session has closed.');
    setCorrectionReason(''); setPendingCorrection({ record, status });
  };
  const submitCorrection = async (event) => {
    event.preventDefault();
    if (!pendingCorrection || correctionReason.trim().length < 5) return;
    if (await saveAttendance(pendingCorrection.record, pendingCorrection.status, correctionReason.trim())) { setPendingCorrection(null); setCorrectionReason(''); }
  };

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? records.filter((item) => `${item.participant?.fullName || ''} ${item.participant?.email || ''}`.toLowerCase().includes(term)) : records;
  }, [records, search]);

  if (loading) return <LoadingSpinner label="Loading attendance management..." />;
  const statCards = [['Total', stats?.total, 'text-slate-900'], ['Present', stats?.present, 'text-emerald-700'], ['Absent', stats?.absent, 'text-rose-700'], ['Late', stats?.late, 'text-amber-700'], ['Not Marked', stats?.not_marked, 'text-slate-500']];

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-black text-slate-950">Attendance Management</h1><p className="mt-1 text-sm text-slate-500">Review attendance and make audited corrections before certificate processing.</p></header>
    <AdminProgramFilters value={filters} onChange={setFilters} />
    {stats && <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-5">{statCards.map(([label, value, color]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{value || 0}</p></article>)}</div>}
    {completed && <div className={`rounded-2xl border p-4 text-sm ${review.open ? 'border-amber-200 bg-amber-50 text-amber-900' : review.correctionOpen ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>{review.open ? <><strong>Attendance review is open.</strong> Certificates are issued when it closes at {new Date(review.endsAt).toLocaleString()}. Every change requires a reason.</> : review.correctionOpen ? <><strong>Certificates have been issued.</strong> Attendance can still be corrected until {new Date(review.correctionEndsAt).toLocaleString()}. Marking someone present issues their certificate; changing them away from present revokes it. Every change requires a reason.</> : <><strong>The correction period has closed.</strong> Attendance for this session can no longer be changed.</>}</div>}
    <div className="relative w-full sm:max-w-xs"><MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search participants..." className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" /></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-500"><tr><th className="p-4">Participant</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Check-in</th><th className="p-4">Method</th><th className="p-4">Correction</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-700">{visibleRecords.map((record) => <tr key={record._id} className="hover:bg-slate-50"><td className="p-4 font-bold text-slate-900">{record.participant?.fullName}</td><td className="p-4 text-slate-500">{record.participant?.email}</td><td className="p-4"><StatusBadge status={record.status} type="attendance" /></td><td className="p-4">{record.checkinTime ? new Date(record.checkinTime).toLocaleTimeString() : '—'}</td><td className="p-4 text-[10px] font-bold uppercase text-slate-400">{record.method}</td><td className="p-4"><div className="flex items-center gap-2"><select aria-label={`Attendance for ${record.participant?.fullName || 'participant'}`} value={record.status} disabled={attendanceLocked || savingRecordId === record._id} onChange={(event) => requestUpdate(record, event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option>{!completed && <option value="not_marked">Not Marked</option>}</select>{savingRecordId === record._id && <ButtonSpinner size="xs" className="text-[#1a6b3c]" />}</div></td></tr>)}</tbody></table>{!selectedTraining && <p className="p-12 text-center text-sm text-slate-500">No training session matches these filters.</p>}{selectedTraining && !visibleRecords.length && <p className="p-12 text-center text-sm text-slate-500">{search ? `No participant matches "${search}".` : 'No attendance records for this session yet.'}</p>}</div></section>
    {pendingCorrection && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="attendance-correction-title" className="relative w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"><AdminModalClose onClick={() => setPendingCorrection(null)} /><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Audited correction</p><h2 id="attendance-correction-title" className="mt-1 pr-10 text-xl font-black text-slate-950">Change attendance to {pendingCorrection.status}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Explain why <strong>{pendingCorrection.record.participant?.fullName || 'this participant'}</strong> needs this correction. The reason, administrator, and time will be saved.</p><form onSubmit={submitCorrection} className="mt-5"><label className="block text-sm font-bold text-slate-700">Correction reason<textarea autoFocus required minLength={5} maxLength={500} rows={4} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="For example: QR check-in failed; attendance verified by the moderator." className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal leading-6 outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" /></label><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPendingCorrection(null)} disabled={Boolean(savingRecordId)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button><button type="submit" disabled={correctionReason.trim().length < 5 || Boolean(savingRecordId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingRecordId && <ButtonSpinner />}{savingRecordId ? 'Saving…' : 'Save correction'}</button></div></form></section></div>}
  </div>;
}
