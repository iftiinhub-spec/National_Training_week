import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, KeyIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@icons';
import PhoneInput from '../../components/common/PhoneInput';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import ButtonSpinner from '../../components/common/ButtonSpinner';

export const ModeratorsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [moderators, setModerators] = useState([]);
  const [allModerators, setAllModerators] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingModerator, setEditingModerator] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  // One moderator row is acted on at a time, so `<id>:<action>` identifies the busy control.
  const [busy, setBusy] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState({ newPassword: false, confirmPassword: false });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const fetchModerators = async () => {
    try {
      const [res, eventRes, trainingRes] = await Promise.all([api.get('/admin/moderators?limit=100'), api.get('/admin/events'), api.get('/admin/trainings?limit=100')]);
      if (res.success) { setAllModerators(res.data || []); setModerators(res.data || []); setSelectedIds([]); }
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
    const query = filters.search.trim().toLowerCase();
    const hasAssignmentFilter = filters.event || filters.eventDay || filters.training;
    setModerators(allModerators.filter((moderator) => {
      const matchesSearch = !query || [moderator.fullName, moderator.email, moderator.phone]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const matchesAssignment = !hasAssignmentFilter || assignedSessions.some((session) => (
        String(session.moderator?._id || session.moderator) === String(moderator._id)
        && (!filters.event || String(session.event?._id || session.event) === filters.event)
        && (!filters.eventDay || String(session.eventDay?._id || session.eventDay) === filters.eventDay)
        && (!filters.training || String(session._id) === filters.training)
      ));
      return matchesSearch && matchesAssignment;
    }));
  }, [allModerators, assignedSessions, filters]);

  const sessionOptions = assignedSessions.filter((session) => (
    (!filters.event || String(session.event?._id || session.event) === filters.event)
    && (!filters.eventDay || String(session.eventDay?._id || session.eventDay) === filters.eventDay)
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingModerator) {
        const res = await api.put(`/admin/moderators/${editingModerator._id}`, { fullName: form.fullName, email: form.email, phone: form.phone });
        toast.success(res.message || 'Moderator updated successfully.');
      } else {
        await api.post('/admin/moderators', form);
        toast.success('Moderator account created!');
      }
      setShowModal(false);
      setEditingModerator(null);
      setShowPassword(false);
      setForm({ fullName: '', email: '', password: '', phone: '' });
      fetchModerators();
    } catch (err) {
      toast.error(err.message || (editingModerator ? 'Update failed' : 'Creation failed'));
    } finally { setSaving(false); }
  };

  const openCreateModal = () => {
    setEditingModerator(null);
    setForm({ fullName: '', email: '', password: '', phone: '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (moderator) => {
    setEditingModerator(moderator);
    setForm({ fullName: moderator.fullName || '', email: moderator.email || '', password: '', phone: moderator.phone || '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openResetModal = (moderator) => {
    setResetTarget(moderator);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowResetPasswords({ newPassword: false, confirmPassword: false });
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match.');
    if (passwordForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    setSaving(true);
    try {
      const res = await api.patch(`/admin/moderators/${resetTarget._id}/reset-password`, { newPassword: passwordForm.newPassword });
      toast.success(res.message || 'Moderator password reset successfully.');
      setResetTarget(null);
    } catch (err) { toast.error(err.message || 'Password reset failed.'); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (id) => {
    setBusy(`${id}:status`);
    try {
      const res = await api.patch(`/admin/moderators/${id}/toggle-status`);
      if (res.success) {
        toast.success(res.message);
        await fetchModerators();
      }
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setBusy('');
    }
  };

  const toggleSelected = (id) => setSelectedIds((current) => (
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  ));
  const toggleAll = () => setSelectedIds((current) => (
    current.length === moderators.length ? [] : moderators.map((item) => item._id)
  ));
  const deleteModerators = async (ids) => {
    if (!ids.length) return;
    if (!await confirmAction({
      title: ids.length === moderators.length ? 'Delete all shown moderators?' : `Delete ${ids.length} moderator(s)?`,
      message: 'This permanently deletes the moderator account(s). Any assigned training sessions will become unassigned. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })) return;
    if (ids.length === 1) setBusy(`${ids[0]}:delete`); else setBulkDeleting(true);
    try {
      const res = ids.length === 1 ? await api.delete(`/admin/moderators/${ids[0]}`) : await api.delete('/admin/moderators', { data: { ids } });
      toast.success(res.message || 'Moderator(s) deleted.');
      setSelectedIds([]);
      await fetchModerators();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusy('');
      setBulkDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading moderator accounts..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-900">Moderator Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin creates and manages operational Moderator user accounts for training sessions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#124d2a] sm:w-auto"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Create Moderator Account</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <select aria-label="Filter moderators by event" value={filters.event} onChange={(e) => setFilters((current) => ({ ...current, event: e.target.value, eventDay: '', training: '' }))} className="min-h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All events</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name} ({event.year})</option>)}</select>
          <select aria-label="Filter moderators by event day" value={filters.eventDay} onChange={(e) => setFilters((current) => ({ ...current, eventDay: e.target.value, training: '' }))} disabled={!filters.event} className="min-h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"><option value="">All days</option>{eventDays.map((day) => <option key={day._id} value={day._id}>Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}</option>)}</select>
          <select aria-label="Filter moderators by session" value={filters.training} onChange={(e) => setFilters((current) => ({ ...current, training: e.target.value }))} className="min-h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All sessions</option>{sessionOptions.map((session) => <option key={session._id} value={session._id}>{session.title}</option>)}</select>
          <label className="relative block"><span className="sr-only">Search moderators</span><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Search moderators" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" /></label>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
          <button type="button" onClick={() => deleteModerators(selectedIds)} disabled={!selectedIds.length || bulkDeleting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{bulkDeleting && <ButtonSpinner size="xs" />}{bulkDeleting ? 'Deleting…' : 'Delete selected'}</button>
          <button type="button" onClick={() => deleteModerators(moderators.map((item) => item._id))} disabled={!moderators.length || bulkDeleting} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">{bulkDeleting && <ButtonSpinner size="xs" />}{bulkDeleting ? 'Deleting…' : 'Delete all'}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4"><input type="checkbox" checked={moderators.length > 0 && selectedIds.length === moderators.length} onChange={toggleAll} aria-label="Select all moderators" className="h-4 w-4 accent-[#1a6b3c]" /></th>
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
                  <td className="p-4"><input type="checkbox" checked={selectedIds.includes(mod._id)} onChange={() => toggleSelected(mod._id)} aria-label={`Select ${mod.fullName}`} className="h-4 w-4 accent-[#1a6b3c]" /></td>
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
                    <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(mod._id)}
                      disabled={busy.startsWith(`${mod._id}:`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy === `${mod._id}:status` && <ButtonSpinner size="xs" />}
                      {busy === `${mod._id}:status` ? 'Updating…' : mod.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEditModal(mod)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-[#1a6b3c]" title="Edit moderator"><PencilIcon className="h-4 w-4" />Edit</button>
                    <button onClick={() => openResetModal(mod)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700" title="Reset moderator password"><KeyIcon className="h-4 w-4" />Reset password</button>
                    <button onClick={() => deleteModerators([mod._id])} disabled={busy.startsWith(`${mod._id}:`)} aria-label={`Delete ${mod.fullName}`} title="Delete moderator" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60">{busy === `${mod._id}:delete` ? <ButtonSpinner /> : <TrashIcon className="h-4 w-4" />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!moderators.length && <p className="p-10 text-center text-sm text-slate-500">No moderators match these filters.</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">{editingModerator ? 'Edit Moderator Account' : 'Create Moderator Account'}</h3>

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

              {!editingModerator && <div>
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
              </div>}

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Phone <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingModerator(null); }}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1a6b3c] text-white font-bold rounded-lg shadow-xs disabled:opacity-60"
                >
                  {saving ? <><ButtonSpinner /> Saving…</> : editingModerator ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => !saving && setResetTarget(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="reset-moderator-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <AdminModalClose onClick={() => !saving && setResetTarget(null)} />
            <h3 id="reset-moderator-title" className="pr-10 text-lg font-bold text-slate-900">Reset Moderator Password</h3>
            <p className="mt-2 text-sm text-slate-500">Set a new password for <strong className="text-slate-700">{resetTarget.fullName}</strong>. Existing sessions will be signed out.</p>
            <form onSubmit={resetPassword} className="mt-5 space-y-4">
              {[['newPassword', 'New password', 'At least 8 characters'], ['confirmPassword', 'Confirm new password', 'Re-enter the new password']].map(([key, label, hint]) => <label key={key} className="block text-xs font-bold uppercase text-slate-700">{label}<span className="relative mt-1 block"><input type={showResetPasswords[key] ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required value={passwordForm[key]} onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })} placeholder={hint} className="w-full rounded-lg border border-slate-300 p-2.5 pr-11 text-sm font-normal normal-case placeholder:text-slate-400" /><button type="button" aria-label={`${showResetPasswords[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setShowResetPasswords({ ...showResetPasswords, [key]: !showResetPasswords[key] })} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400">{showResetPasswords[key] ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></span></label>)}
              <p className="text-xs text-slate-500">Use between 8 and 128 characters.</p>
              <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setResetTarget(null)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white disabled:opacity-60">{saving ? <><ButtonSpinner /> Resetting…</> : 'Reset Password'}</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModeratorsManagement;
