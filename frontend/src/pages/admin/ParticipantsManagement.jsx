import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const ParticipantsManagement = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchParticipants = useCallback(async () => {
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (search) query.set('search', search);
      if (status) query.set('isActive', status);
      const res = await api.get(`/admin/participants?${query.toString()}`);
      if (res.success) setParticipants(res.data || []);
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
      </div>

      {loading ? <LoadingSpinner label="Loading participants..." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-500">
                <tr>
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
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!participants.length && (
                  <tr><td colSpan="8" className="p-12 text-center text-sm text-slate-500">No participants match these filters.</td></tr>
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
