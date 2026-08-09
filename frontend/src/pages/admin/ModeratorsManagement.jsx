import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export const ModeratorsManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const fetchModerators = async () => {
    try {
      const res = await api.get('/admin/moderators');
      if (res.success) setModerators(res.data || []);
    } catch (err) {
      toast.error('Failed to load moderators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/moderators', form);
      toast.success('Moderator account created!');
      setShowModal(false);
      setForm({ fullName: '', email: '', password: '', phone: '' });
      fetchModerators();
    } catch (err) {
      toast.error(err.message || 'Creation failed');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/admin/moderators/${id}/toggle-status`);
      if (res.success) {
        toast.success(res.message);
        fetchModerators();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading moderator accounts..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Moderator Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin creates and manages operational Moderator user accounts for training sessions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Create Moderator Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {moderators.map((mod) => (
                <tr key={mod._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{mod.fullName}</td>
                  <td className="p-4 text-slate-500">{mod.email}</td>
                  <td className="p-4">{mod.phone || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      mod.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {mod.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(mod._id)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs"
                    >
                      {mod.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">Create Moderator Account</h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a6b3c] text-white font-bold rounded-lg shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModeratorsManagement;
