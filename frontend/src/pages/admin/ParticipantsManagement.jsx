import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

export const ParticipantsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [participants, setParticipants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchParticipants = useCallback(async () => {
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (search) query.set('search', search);
      if (status) query.set('isActive', status);
      const res = await api.get(`/admin/participants?${query.toString()}`);
      if (res.success) { setParticipants(res.data || []); setSelectedIds([]); }
    } catch (err) {
      toast.error('Failed to load participants.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchParticipants, 300);
    return () => clearTimeout(timer);
  }, [fetchParticipants]);

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/admin/participants/${id}/toggle-status`);
      if (res.success) {
        toast.success(res.message);
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  const toggleSelected = (id) => setSelectedIds((current) => (
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  ));
  const toggleAll = () => setSelectedIds((current) => (
    current.length === participants.length ? [] : participants.map((item) => item._id)
  ));
  const deleteParticipants = async (ids) => {
    if (!ids.length) return;
    if (!await confirmAction({
      title: ids.length === participants.length ? 'Delete all shown participants?' : `Delete ${ids.length} participant(s)?`,
      message: 'This permanently deletes the participant account(s), their registrations, attendance, feedback, certificates, and related participant data. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })) return;
    try {
      const res = ids.length === 1 ? await api.delete(`/admin/participants/${ids[0]}`) : await api.delete('/admin/participants', { data: { ids } });
      toast.success(res.message || 'Participant(s) deleted.');
      fetchParticipants();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Participants</h1>
        <p className="mt-1 text-xs text-slate-500">Everyone with a participant account, whether or not they've registered for a training session yet.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full max-w-[10rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="button" onClick={() => deleteParticipants(selectedIds)} disabled={!selectedIds.length} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Delete selected</button>
        <button type="button" onClick={() => deleteParticipants(participants.map((item) => item._id))} disabled={!participants.length} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40">Delete all</button>
      </div>

      {loading ? <LoadingSpinner label="Loading participants..." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-4"><input type="checkbox" checked={participants.length > 0 && selectedIds.length === participants.length} onChange={toggleAll} aria-label="Select all participants" className="h-4 w-4 accent-[#1a6b3c]" /></th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {participants.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="p-4"><input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelected(p._id)} aria-label={`Select ${p.fullName}`} className="h-4 w-4 accent-[#1a6b3c]" /></td>
                    <td className="p-4 font-bold text-slate-900">{p.fullName}</td>
                    <td className="p-4 text-slate-500">{p.email}</td>
                    <td className="p-4">{p.phone || '—'}</td>
                    <td className="p-4">{p.region || p.city || '—'}</td>
                    <td className="p-4">{p.participantType ? p.participantType.replaceAll('_', ' ') : '—'}</td>
                    <td className="p-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteParticipants([p._id])} aria-label={`Delete ${p.fullName}`} title="Delete participant" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!participants.length && (
                  <tr><td colSpan="9" className="p-12 text-center text-sm text-slate-500">No participants match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsManagement;
