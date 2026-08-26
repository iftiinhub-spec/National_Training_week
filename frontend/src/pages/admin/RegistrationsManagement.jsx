import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { CheckIcon, PaperAirplaneIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import AdminModalClose from '../../components/common/AdminModalClose';

const actionClass = 'inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-white';

export const RegistrationsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [registrations, setRegistrations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '', status: 'pending', search: '' });
  const [loading, setLoading] = useState(true);
  const [approvingAll, setApprovingAll] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcement, setAnnouncement] = useState({ subject: '', message: '' });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ ...filters, limit: '100' });
      const res = await api.get(`/admin/registrations?${query.toString()}`);
      if (res.success) { setRegistrations(res.data || []); setSelectedIds([]); }
    } catch (error) { toast.error(error.message || 'Failed to load training registrations.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTraining = async (id, status) => {
    try { await api.patch(`/admin/registrations/${id}/status`, { status }); toast.success(`Training registration ${status}.`); fetchData(); }
    catch (error) { toast.error(error.message); }
  };

  const toggleSelected = (id) => setSelectedIds((current) => (
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  ));
  const toggleAll = () => setSelectedIds((current) => (
    current.length === registrations.length ? [] : registrations.map((item) => item._id)
  ));
  const deleteRegistrations = async (ids) => {
    if (!ids.length) return;
    if (!await confirmAction({
      title: ids.length === registrations.length ? 'Delete all shown registrations?' : `Delete ${ids.length} registration(s)?`,
      message: 'This permanently deletes the selected registration(s), releases approved seats, and removes matching attendance records. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })) return;
    try {
      const res = ids.length === 1 ? await api.delete(`/admin/registrations/${ids[0]}`) : await api.delete('/admin/registrations', { data: { ids } });
      toast.success(res.message || 'Registration(s) deleted.');
      fetchData();
    } catch (error) { toast.error(error.message || 'Delete failed.'); }
  };

  const approveFiltered = async () => {
    const pendingShown = registrations.filter((registration) => registration.status === 'pending').length;
    if (!pendingShown) return;
    if (!await confirmAction({
      title: 'Approve all filtered registrations?',
      message: 'Every pending registration matching the current event, day, session, and search filters will be approved, including matches beyond this table page. Session capacity limits still apply.',
      confirmLabel: 'Approve all',
    })) return;

    setApprovingAll(true);
    try {
      const query = new URLSearchParams({
        event: filters.event,
        eventDay: filters.eventDay,
        training: filters.training,
        search: filters.search,
      });
      const res = await api.patch(`/admin/registrations/approve-filtered?${query.toString()}`);
      const summary = res.data?.summary;
      if (summary?.capacitySkipped) {
        toast.success(`Approved ${summary.approved}. Skipped ${summary.capacitySkipped} because session capacity is full.`);
      } else {
        toast.success(res.message || `Approved ${summary?.approved || 0} registration(s).`);
      }
      fetchData();
    } catch (error) { toast.error(error.message || 'Bulk approval failed.'); }
    finally { setApprovingAll(false); }
  };

  const sendAnnouncement = async (event) => {
    event.preventDefault();
    setSendingAnnouncement(true);
    try {
      const query = new URLSearchParams({ training: filters.training });
      const res = await api.post(`/admin/registrations/email-filtered?${query.toString()}`, announcement);
      toast.success(res.message || 'Applicant email queued.');
      setAnnouncementOpen(false);
      setAnnouncement({ subject: '', message: '' });
    } catch (error) { toast.error(error.message || 'Could not queue applicant email.'); }
    finally { setSendingAnnouncement(false); }
  };

  const selectedSessionTitle = registrations.find((registration) => String(registration.training?._id) === filters.training)?.training?.title || 'Selected training session';

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black text-slate-900">Training Registrations</h1><p className="mt-1 text-xs text-slate-500">Participant accounts are active immediately. Review acceptance requests for individual training sessions here.</p></div>
    <AdminProgramFilters value={filters} onChange={setFilters} includeStatus includeSearch searchPlaceholder="Participant or session" statusOptions={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'cancelled', label: 'Cancelled' }]} />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setAnnouncementOpen(true)} disabled={!filters.training} title={!filters.training ? 'Select a training session first' : 'Email pending and approved applicants'} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1a6b3c] px-3 text-xs font-bold text-white hover:bg-[#145731] disabled:cursor-not-allowed disabled:opacity-40"><PaperAirplaneIcon aria-hidden="true" className="h-4 w-4" />Email filtered applicants</button><button type="button" onClick={approveFiltered} disabled={approvingAll || !registrations.some((registration) => registration.status === 'pending')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><CheckIcon aria-hidden="true" className="h-4 w-4" />{approvingAll ? 'Approving...' : 'Approve all filtered'}</button><button type="button" onClick={() => deleteRegistrations(selectedIds)} disabled={!selectedIds.length} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Delete selected</button><button type="button" onClick={() => deleteRegistrations(registrations.map((item) => item._id))} disabled={!registrations.length} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40">Delete all</button></div>
    {loading ? <LoadingSpinner label="Loading training registrations..." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={registrations.length > 0 && selectedIds.length === registrations.length} onChange={toggleAll} aria-label="Select all registrations" className="h-4 w-4 accent-[#1a6b3c]" /></th><th className="p-4">Participant</th><th className="p-4">Training Session</th><th className="p-4">Registered</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
        {registrations.map((reg) => <tr key={reg._id} className="hover:bg-slate-50"><td className="p-4"><input type="checkbox" checked={selectedIds.includes(reg._id)} onChange={() => toggleSelected(reg._id)} aria-label={`Select registration for ${reg.participant?.fullName || 'participant'}`} className="h-4 w-4 accent-[#1a6b3c]" /></td><td className="p-4"><strong className="block text-slate-950">{reg.participant?.fullName}</strong><span className="text-slate-400">{reg.participant?.email}</span></td><td className="p-4 font-bold text-[#1a6b3c]">{reg.training?.title}</td><td className="p-4">{new Date(reg.registeredAt).toLocaleDateString()}</td><td className="p-4"><StatusBadge status={reg.status} /></td><td className="p-4"><div className="flex gap-2">{reg.status !== 'approved' && <button onClick={() => updateTraining(reg._id, 'approved')} className={`${actionClass} bg-emerald-600 hover:bg-emerald-700`}><CheckIcon className="h-4 w-4" /> Approve</button>}{reg.status !== 'rejected' && <button onClick={() => updateTraining(reg._id, 'rejected')} className={`${actionClass} bg-rose-600 hover:bg-rose-700`}><XMarkIcon className="h-4 w-4" /> Reject</button>}<button onClick={() => deleteRegistrations([reg._id])} aria-label="Delete registration" title="Delete registration" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button></div></td></tr>)}
        {!registrations.length && <tr><td colSpan="6" className="p-12 text-center text-sm text-slate-500">No training registrations match these filters.</td></tr>}
      </tbody>
    </table></div></div>}
    {announcementOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !sendingAnnouncement) setAnnouncementOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="applicant-email-title" className="relative w-full max-w-xl rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-7"><AdminModalClose onClick={() => !sendingAnnouncement && setAnnouncementOpen(false)} /><p className="text-xs font-bold uppercase text-[#1a6b3c]">Session announcement</p><h2 id="applicant-email-title" className="mt-1 pr-10 text-xl font-black text-slate-950">Email filtered applicants</h2><p className="mt-2 text-sm leading-6 text-slate-600">This will email every pending and approved applicant for <strong className="text-slate-800">{selectedSessionTitle}</strong>. Rejected and cancelled registrations are excluded.</p><form onSubmit={sendAnnouncement} className="mt-5 space-y-4"><label className="block text-sm font-bold text-slate-700">Email subject<input autoFocus required minLength={5} maxLength={150} value={announcement.subject} onChange={(event) => setAnnouncement((current) => ({ ...current, subject: event.target.value }))} placeholder="e.g. Important session schedule update" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" /></label><label className="block text-sm font-bold text-slate-700">Message<textarea required minLength={10} maxLength={2000} rows={7} value={announcement.message} onChange={(event) => setAnnouncement((current) => ({ ...current, message: event.target.value }))} placeholder="Explain the trainer's apology and the next step for applicants..." className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal leading-6 outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" /></label><p className="text-right text-xs text-slate-400">{announcement.message.length}/2000</p><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={sendingAnnouncement} onClick={() => setAnnouncementOpen(false)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="submit" disabled={sendingAnnouncement || announcement.subject.trim().length < 5 || announcement.message.trim().length < 10} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white hover:bg-[#145731] disabled:cursor-not-allowed disabled:opacity-50"><PaperAirplaneIcon aria-hidden="true" className="h-5 w-5" />{sendingAnnouncement ? 'Queuing email...' : 'Send email'}</button></div></form></section></div>}
  </div>;
};

export default RegistrationsManagement;
