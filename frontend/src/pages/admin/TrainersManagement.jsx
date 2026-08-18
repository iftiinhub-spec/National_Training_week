import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, CameraIcon, UserCircleIcon, EyeIcon, EyeSlashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import PhoneInput from '../../components/common/PhoneInput';
import PhotoCropModal from '../../components/common/PhotoCropModal';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

// Resolve the photo URL — Vite proxies /uploads → backend in dev; same origin in prod
const photoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `/${path.replace(/^\//,'')}`;
};

const TRAINER_TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Eng.'];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  title: '',
  organization: '',
  biography: '',
  expertise: '',
  password: '',
  confirmPassword: '',
  accessStatus: 'pending',
};

export const TrainersManagement = () => {
  const confirmAction = useConfirmDialog();
  const [trainers, setTrainers] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [assignedSessions, setAssignedSessions] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingTrainer, setViewingTrainer] = useState(null);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState(EMPTY_FORM);

  const fetchTrainers = async () => {
    try {
      const [res, eventRes, trainingRes] = await Promise.all([api.get('/admin/trainers?limit=100'), api.get('/admin/events'), api.get('/admin/trainings?limit=100')]);
      if (res.success) { setAllTrainers(res.data || []); setTrainers(res.data || []); }
      if (eventRes.success) setEvents(eventRes.data || []);
      if (trainingRes.success) setAssignedSessions(trainingRes.data || []);
    } catch (err) {
      toast.error('Failed to load trainers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, []);

  useEffect(() => {
    if (!filters.event) { setEventDays([]); return; }
    api.get(`/admin/events/${filters.event}/days`).then((res) => setEventDays(res.data?.days || [])).catch(() => setEventDays([]));
  }, [filters.event]);

  const visibleTrainers = trainers.filter((trainer) => {
    if (!filters.event && !filters.eventDay) return true;
    return assignedSessions.some((session) => String(session.trainer?._id || session.trainer) === String(trainer._id)
      && (!filters.event || String(session.event?._id || session.event) === String(filters.event))
      && (!filters.eventDay || String(session.eventDay?._id || session.eventDay) === String(filters.eventDay)));
  });

  useEffect(() => {
    if (!filters.event && !filters.eventDay) { setTrainers(allTrainers); return; }
    setTrainers(allTrainers.filter((trainer) => assignedSessions.some((session) => String(session.trainer?._id || session.trainer) === String(trainer._id) && (!filters.event || String(session.event?._id || session.event) === String(filters.event)) && (!filters.eventDay || String(session.eventDay?._id || session.eventDay) === String(filters.eventDay)))));
  }, [allTrainers, assignedSessions, filters]);

  const openCreateModal = () => {
    setEditingTrainer(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const openEditModal = (tr) => {
    setEditingTrainer(tr);
    setForm({
      name: tr.name || '',
      email: tr.email || '',
      phone: tr.phone || '',
      title: tr.title || '',
      organization: tr.organization || '',
      biography: tr.biography || '',
      expertise: tr.expertise || '',
      password: '',
      confirmPassword: '',
      accessStatus: tr.accessStatus || 'pending',
    });
    setPhotoFile(null);
    // Show existing saved photo as preview
    setPhotoPreview(photoUrl(tr.photo));
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const openViewModal = (tr) => setViewingTrainer(tr);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
  };
  const applyCroppedPhoto = (file) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPhotoFile(file);
    // Local object URL preview before upload
    setPhotoPreview(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = '';
  };
  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const needsAccount = !editingTrainer || !editingTrainer.user;
    if (needsAccount && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => { if (k !== 'confirmPassword') formData.append(k, form[k]); });
      if (photoFile) formData.append('photo', photoFile);

      if (editingTrainer) {
        await api.put(`/admin/trainers/${editingTrainer._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer profile updated!');
      } else {
        await api.post('/admin/trainers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer profile created!');
      }

      setShowModal(false);
      setEditingTrainer(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const reviewAccess = async (id, status) => {
    try {
      await api.patch(`/admin/trainers/${id}/access`, { status });
      toast.success(`Trainer ${status}.`);
      fetchTrainers();
    } catch (error) { toast.error(error.message || 'Access update failed.'); }
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({ title: 'Delete trainer profile?', message: 'This trainer profile will be permanently removed. Trainers assigned to sessions may not be deletable.', confirmLabel: 'Delete trainer' })) return;
    try {
      await api.delete(`/admin/trainers/${id}`);
      toast.success('Trainer profile deleted');
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading trainer profiles..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Trainer / Speaker Profiles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applications, create trainer accounts, and control trainer portal access.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#124d2a] sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Trainer Profile</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2"><select value={filters.event} onChange={(e) => setFilters({ event: e.target.value, eventDay: '' })} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All events</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name} ({event.year})</option>)}</select><select value={filters.eventDay} onChange={(e) => setFilters((current) => ({ ...current, eventDay: e.target.value }))} disabled={!filters.event} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"><option value="">All days</option>{eventDays.map((day) => <option key={day._id} value={day._id}>Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}</option>)}</select></div>

      {/* Cards Grid */}
      {trainers.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          No trainer profiles yet. Click <strong>Add Trainer Profile</strong> to create one.
        </div>
      ) : (
        <>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Trainer</th><th className="px-4 py-3">Organization</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Expertise</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{trainers.map((tr) => { const imgSrc = photoUrl(tr.photo); return <tr key={tr._id} className="align-middle hover:bg-slate-50/70"><td className="px-4 py-2"><div className="flex items-center gap-3">{imgSrc ? <img src={imgSrc} alt={tr.name} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-[#1a6b3c]">{tr.name?.charAt(0)?.toUpperCase()}</div>}<span className="max-w-40 truncate font-bold text-slate-900">{tr.title ? `${tr.title} ` : ''}{tr.name}</span></div></td><td className="max-w-36 truncate px-4 py-2 text-xs font-semibold text-[#155289]">{tr.organization || '—'}</td><td className="max-w-52 truncate px-4 py-2 text-xs text-slate-500" title={tr.email}>{tr.email || '—'}</td><td className="max-w-40 truncate px-4 py-2 text-xs text-emerald-700" title={tr.expertise}>{tr.expertise || '—'}</td><td className="px-4 py-2"><select value={tr.accessStatus || 'pending'} onChange={(e) => reviewAccess(tr._id, e.target.value)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select></td><td className="px-4 py-2"><div className="flex justify-end gap-1"><button onClick={() => openViewModal(tr)} className="flex min-h-9 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#1a6b3c]" title="View full trainer profile"><EyeIcon className="h-4 w-4" />View</button></div></td></tr>; })}</tbody></table>
        </div>
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Trainer</th><th className="px-4 py-3">Organization</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Expertise</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{trainers.map((tr) => { const imgSrc = photoUrl(tr.photo); return <tr key={tr._id} className="align-middle hover:bg-slate-50/70"><td className="px-4 py-3"><div className="flex items-center gap-3">{imgSrc ? <img src={imgSrc} alt={tr.name} loading="lazy" className="h-11 w-11 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-[#1a6b3c]">{tr.name?.charAt(0)?.toUpperCase()}</div>}<div><p className="font-bold text-slate-900">{tr.title ? `${tr.title} ` : ''}{tr.name}</p>{tr.biography && <p className="max-w-xs truncate text-xs text-slate-500">{tr.biography}</p>}</div></div></td><td className="px-4 py-3 text-xs font-semibold text-[#155289]">{tr.organization || '—'}</td><td className="px-4 py-3 text-xs text-slate-500">{tr.email || '—'}</td><td className="px-4 py-3 text-xs text-emerald-700">{tr.expertise || '—'}</td><td className="px-4 py-3"><select value={tr.accessStatus || 'pending'} onChange={(e) => reviewAccess(tr._id, e.target.value)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select></td><td className="px-4 py-3"><div className="flex justify-end gap-1">{imgSrc && <a href={imgSrc} download className="flex min-h-9 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-[#1a6b3c]" title="Download photo"><ArrowDownTrayIcon className="h-4 w-4" />Download</a>}<button onClick={() => openEditModal(tr)} className="flex min-h-9 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-[#1a6b3c]" title="Edit trainer profile"><PencilIcon className="h-4 w-4" />Edit</button><button onClick={() => handleDelete(tr._id)} className="flex min-h-9 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete trainer profile"><TrashIcon className="h-4 w-4" />Delete</button></div></td></tr>; })}</tbody></table>
        </div>
        <div className="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((tr) => {
            const imgSrc = photoUrl(tr.photo);
            return (
              <div
                key={tr._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Photo banner */}
                <div className="relative flex h-32 items-center justify-center bg-emerald-50 sm:h-36">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={tr.name}
                      loading="lazy"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-100 text-[#1a6b3c] flex items-center justify-center border-4 border-white shadow-md text-4xl font-black">
                      {tr.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col space-y-2 p-4 sm:p-5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {tr.title ? `${tr.title} ` : ''}{tr.name}
                    </h3>
                    {tr.organization && (
                      <p className="text-xs text-[#155289] font-semibold mt-0.5">{tr.organization}</p>
                    )}
                    {tr.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{tr.email}</p>
                    )}
                    {tr.expertise && (
                      <p className="text-xs text-emerald-700 font-medium mt-1">
                        🎯 {tr.expertise}
                      </p>
                    )}
                  </div>
                  {tr.biography && (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {tr.biography}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <select value={tr.accessStatus || 'pending'} onChange={(e) => reviewAccess(tr._id, e.target.value)} className="min-h-10 min-w-28 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold sm:flex-none"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>
                    {imgSrc && (
                      <a
                        href={imgSrc}
                        download
                        className="flex min-h-10 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-[#1a6b3c]"
                        title="Download photo"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(tr)}
                      className="flex min-h-10 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-[#1a6b3c]"
                      title="Edit trainer profile"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tr._id)}
                      className="flex min-h-10 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Delete trainer profile"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {viewingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setViewingTrainer(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-2xl font-black text-[#1a6b3c]">{viewingTrainer.photo ? <img src={photoUrl(viewingTrainer.photo)} alt={viewingTrainer.name} className="h-full w-full object-cover" /> : viewingTrainer.name?.charAt(0)?.toUpperCase()}</div><div><p className="text-xs font-bold uppercase tracking-wide text-[#1a6b3c]">Trainer profile</p><h2 className="mt-1 text-xl font-black text-slate-900">{viewingTrainer.title ? `${viewingTrainer.title} ` : ''}{viewingTrainer.name}</h2><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${viewingTrainer.accessStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{viewingTrainer.accessStatus || 'Pending'}</span></div></div><AdminModalClose onClick={() => setViewingTrainer(null)} /></div>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Email</p><p className="mt-1 text-slate-700">{viewingTrainer.email || '—'}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Phone</p><p className="mt-1 text-slate-700">{viewingTrainer.phone || '—'}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Organization</p><p className="mt-1 text-slate-700">{viewingTrainer.organization || '—'}</p></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Areas of expertise</p><div className="mt-2 flex flex-wrap gap-2">{String(viewingTrainer.expertise || '').split(',').map((area) => area.trim()).filter(Boolean).map((area) => <span key={area} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-[#1a6b3c]">{area}</span>)}{!viewingTrainer.expertise && <span className="text-slate-500">—</span>}</div></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Biography</p><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{viewingTrainer.biography || '—'}</p></div></div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingTrainer ? 'Edit Trainer Profile' : 'Create Trainer Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              {/* Photo Upload with Preview */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative w-28 h-28 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1a6b3c] group transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-14 h-14 text-slate-300 group-hover:text-[#1a6b3c] transition-colors" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-[#1a6b3c] font-semibold hover:underline"
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-[10px] text-slate-400">JPEG, PNG or WebP · Max 5 MB</p>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Title</label>
                  <select
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                  >
                    <option value="">Select title</option>
                    {TRAINER_TITLES.map((title) => <option key={title} value={title}>{title}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ibrahim Ahmed Abdirahman"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ibrahim@example.com"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Phone</label>
                  <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Organization / Affiliation</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. Hormuud University"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Area of Expertise</label>
                <input
                  type="text"
                  value={form.expertise}
                  onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  placeholder="e.g. Machine Learning, Cybersecurity"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                />
              </div>

              {/* Biography */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  placeholder="Short professional bio..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c] resize-none"
                />
              </div>

              {(!editingTrainer || !editingTrainer.user) && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="font-bold uppercase text-slate-700">Password *<span className="relative mt-1 block"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="e.g. StrongPass123" minLength={8} className="w-full rounded-lg border border-slate-300 p-2.5 pr-11 normal-case font-normal focus:outline-none focus:border-[#1a6b3c]" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></span></label>
                <label className="font-bold uppercase text-slate-700">Confirm Password *<span className="relative mt-1 block"><input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="e.g. StrongPass123" minLength={8} className="w-full rounded-lg border border-slate-300 p-2.5 pr-11 normal-case font-normal focus:outline-none focus:border-[#1a6b3c]" required /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></span></label>
                <label className="font-bold uppercase text-slate-700 sm:col-span-2">Initial Access Status<select value={form.accessStatus} onChange={(e) => setForm({ ...form, accessStatus: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 normal-case font-normal"><option value="pending">Pending review</option><option value="approved">Approved — portal access enabled</option></select></label>
              </div>}

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setPhotoPreview(null); }}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-lg shadow-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cropSrc && <PhotoCropModal imageSrc={cropSrc} onCancel={cancelCrop} onCropped={applyCroppedPhoto} />}
    </div>
  );
};

export default TrainersManagement;
