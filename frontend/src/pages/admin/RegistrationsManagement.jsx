import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const actionClass = 'inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-white';

export const RegistrationsManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
      const res = await api.get(`/admin/registrations${query}`);
      if (res.success) setRegistrations(res.data || []);
    } catch (error) { toast.error(error.message || 'Failed to load training registrations.'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTraining = async (id, status) => {
    try { await api.patch(`/admin/registrations/${id}/status`, { status }); toast.success(`Training registration ${status}.`); fetchData(); }
    catch (error) { toast.error(error.message); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black text-slate-900">Training Registrations</h1><p className="mt-1 text-xs text-slate-500">Participant accounts are active immediately. Review acceptance requests for individual training sessions here.</p></div>
    <div className="flex justify-end"><label className="text-xs font-bold text-slate-600">Registration status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-black"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select></label></div>
    {loading ? <LoadingSpinner label="Loading training registrations..." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500"><tr><th className="p-4">Participant</th><th className="p-4">Training Session</th><th className="p-4">Registered</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
        {registrations.map((reg) => <tr key={reg._id} className="hover:bg-slate-50"><td className="p-4"><strong className="block text-slate-950">{reg.participant?.fullName}</strong><span className="text-slate-400">{reg.participant?.email}</span></td><td className="p-4 font-bold text-[#1a6b3c]">{reg.training?.title}</td><td className="p-4">{new Date(reg.registeredAt).toLocaleDateString()}</td><td className="p-4"><StatusBadge status={reg.status} /></td><td className="p-4"><div className="flex gap-2">{reg.status !== 'approved' && <button onClick={() => updateTraining(reg._id, 'approved')} className={`${actionClass} bg-emerald-600 hover:bg-emerald-700`}><CheckIcon className="h-4 w-4" /> Approve</button>}{reg.status !== 'rejected' && <button onClick={() => updateTraining(reg._id, 'rejected')} className={`${actionClass} bg-rose-600 hover:bg-rose-700`}><XMarkIcon className="h-4 w-4" /> Reject</button>}</div></td></tr>)}
        {!registrations.length && <tr><td colSpan="5" className="p-12 text-center text-sm text-slate-500">No training registrations found for this status.</td></tr>}
      </tbody>
    </table></div></div>}
  </div>;
};

export default RegistrationsManagement;
