import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

const actionClass = 'inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-white';

export const RegistrationsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [registrations, setRegistrations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '', status: 'pending', search: '' });
  const [loading, setLoading] = useState(true);

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

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black text-slate-900">Training Registrations</h1><p className="mt-1 text-xs text-slate-500">Participant accounts are active immediately. Review acceptance requests for individual training sessions here.</p></div>
    <AdminProgramFilters value={filters} onChange={setFilters} includeStatus includeSearch searchPlaceholder="Participant or session" statusOptions={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'cancelled', label: 'Cancelled' }]} />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => deleteRegistrations(selectedIds)} disabled={!selectedIds.length} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Delete selected</button><button type="button" onClick={() => deleteRegistrations(registrations.map((item) => item._id))} disabled={!registrations.length} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40">Delete all</button></div>
    {loading ? <LoadingSpinner label="Loading training registrations..." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={registrations.length > 0 && selectedIds.length === registrations.length} onChange={toggleAll} aria-label="Select all registrations" className="h-4 w-4 accent-[#1a6b3c]" /></th><th className="p-4">Participant</th><th className="p-4">Training Session</th><th className="p-4">Registered</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
        {registrations.map((reg) => <tr key={reg._id} className="hover:bg-slate-50"><td className="p-4"><input type="checkbox" checked={selectedIds.includes(reg._id)} onChange={() => toggleSelected(reg._id)} aria-label={`Select registration for ${reg.participant?.fullName || 'participant'}`} className="h-4 w-4 accent-[#1a6b3c]" /></td><td className="p-4"><strong className="block text-slate-950">{reg.participant?.fullName}</strong><span className="text-slate-400">{reg.participant?.email}</span></td><td className="p-4 font-bold text-[#1a6b3c]">{reg.training?.title}</td><td className="p-4">{new Date(reg.registeredAt).toLocaleDateString()}</td><td className="p-4"><StatusBadge status={reg.status} /></td><td className="p-4"><div className="flex gap-2">{reg.status !== 'approved' && <button onClick={() => updateTraining(reg._id, 'approved')} className={`${actionClass} bg-emerald-600 hover:bg-emerald-700`}><CheckIcon className="h-4 w-4" /> Approve</button>}{reg.status !== 'rejected' && <button onClick={() => updateTraining(reg._id, 'rejected')} className={`${actionClass} bg-rose-600 hover:bg-rose-700`}><XMarkIcon className="h-4 w-4" /> Reject</button>}<button onClick={() => deleteRegistrations([reg._id])} aria-label="Delete registration" title="Delete registration" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button></div></td></tr>)}
        {!registrations.length && <tr><td colSpan="6" className="p-12 text-center text-sm text-slate-500">No training registrations match these filters.</td></tr>}
      </tbody>
    </table></div></div>}
  </div>;
};

export default RegistrationsManagement;
