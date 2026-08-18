import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import PhoneInput from '../../components/common/PhoneInput';

export const ModeratorsManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [allModerators, setAllModerators] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const fetchModerators = async () => {
    try {
      const [res, eventRes, trainingRes] = await Promise.all([api.get('/admin/moderators?limit=100'), api.get('/admin/events'), api.get('/admin/trainings?limit=100')]);
      if (res.success) { setAllModerators(res.data || []); setModerators(res.data || []); }
      if (eventRes.success) setEvents(eventRes.data || []);
      if (trainingRes.success) setAssignedSessions(trainingRes.data || []);
    } catch (err) {
      toast.error('Failed to load moderators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  useEffect(() => {
    if (!filters.event) { setEventDays([]); return; }
    api.get(`/admin/events/${filters.event}/days`).then((res) => setEventDays(res.data?.days || [])).catch(() => setEventDays([]));
  }, [filters.event]);

  useEffect(() => {
    if (!filters.event && !filters.eventDay) { setModerators(allModerators); return; }
    setModerators(allModerators.filter((moderator) => assignedSessions.some((session) => String(session.moderator?._id || session.moderator) === String(moderator._id) && (!filters.event || String(session.event?._id || session.event) === String(filters.event)) && (!filters.eventDay || String(session.eventDay?._id || session.eventDay) === String(filters.eventDay)))));
  }, [allModerators, assignedSessions, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/moderators', form);
      toast.success('Moderator account created!');
      setShowModal(false);
      setShowPassword(false);
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
          onClick={() => { setShowPassword(false); setShowModal(true); }}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Create Moderator Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2"><select value={filters.event} onChange={(e) => setFilters({ event: e.target.value, eventDay: '' })} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All events</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name} ({event.year})</option>)}</select><select value={filters.eventDay} onChange={(e) => setFilters((current) => ({ ...current, eventDay: e.target.value }))} disabled={!filters.event} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"><option value="">All days</option>{eventDays.map((day) => <option key={day._id} value={day._id}>Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}</option>)}</select></div>
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
                  placeholder="e.g. Amina Mohamed Ali"
                  autoComplete="name"
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
                  placeholder="e.g. amina@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="e.g. StrongPass123"
                    autoComplete="new-password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2.5 pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] font-normal normal-case text-slate-500">Use at least 8 characters.</p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Phone <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
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
