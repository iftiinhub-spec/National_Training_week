import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const RegistrationsManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/registrations?status=${statusFilter}` : '/admin/registrations';
      const res = await api.get(url);
      if (res.success) {
        setRegistrations(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const handleUpdateStatus = async (regId, newStatus) => {
    try {
      const res = await api.patch(`/admin/registrations/${regId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(`Registration ${newStatus}!`);
        fetchRegistrations();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Participant Registrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject participant training registrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading registrations..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
                <tr>
                  <th className="p-4">Participant</th>
                  <th className="p-4">Training Session</th>
                  <th className="p-4">Participant Type</th>
                  <th className="p-4">Enrolled Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span className="block font-bold text-slate-900">{reg.participant?.fullName}</span>
                      <span className="text-[11px] text-slate-400">{reg.participant?.email}</span>
                    </td>
                    <td className="p-4 font-bold text-[#1a6b3c]">
                      {reg.training?.title}
                    </td>
                    <td className="p-4 capitalize">
                      {reg.participant?.participantType?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={reg.status} type="registration" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {reg.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(reg._id, 'approved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                          >
                            <CheckIcon className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {reg.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(reg._id, 'rejected')}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegistrationsManagement;
