import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, PhotoIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatTimeRange12, toTimeInputValue } from '../../utils/timeFormat';

// What an administrator decides about a session. All four can be chosen at any time, because none
// of them depends on the clock. Whether registration is open, whether the session is running and
// whether it is over are decided by the server and arrive as `phase` on every session.
const SESSION_STATUSES = [
  ['draft', 'Draft — nobody can see it'],
  ['published', 'Published — people can see it'],
  ['cancelled', 'Cancelled'],
  ['completed', 'Finished'],
];

const statusControlClass = (status) => {
  if (status === 'published') return 'border-emerald-200 bg-emerald-50 text-[#1a6b3c]';
  if (status === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'completed') return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
};

// The button only makes sense while the session is still ahead of its own day.
const canChangeRegistration = (training) => training.status === 'published'
  && ['registration_open', 'registration_closed', 'scheduled'].includes(training.phase);

const assetUrl = (value) => value ? (value.startsWith('http') ? value : `/${value.replace(/^\//, '')}`) : '';

export const TrainingsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [trainings, setTrainings] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '', level: '', language: '' });

  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const coverImageInputRef = useRef(null);
  const [languageMode, setLanguageMode] = useState('Somali');

  useEffect(() => () => {
    if (coverImagePreview.startsWith('blob:')) URL.revokeObjectURL(coverImagePreview);
  }, [coverImagePreview]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event: '',
    eventDay: '',
    category: '',
    trainers: [],
    moderator: '',
    startTime: '',
    endTime: '',
    audience: 'General Public & University Students',
    level: 'general',
    language: 'Somali / English',
    capacity: '',
  });

  const fetchData = async () => {
    try {
      const [trRes, evRes, catRes, trnerRes, modRes] = await Promise.all([
        api.get('/admin/trainings?limit=100'),
        api.get('/admin/events'),
        api.get('/admin/categories'),
        api.get('/admin/trainers?limit=100'),
        api.get('/admin/moderators?limit=100'),
      ]);

      if (trRes.success) setTrainings(trRes.data || []);
      if (evRes.success && evRes.data?.length > 0) {
        setEvents(evRes.data);
        // Load days for the first event
        const defaultEvId = evRes.data[0]._id;
        const daysRes = await api.get(`/admin/events/${defaultEvId}/days`).catch(() => null);
        if (daysRes?.success) {
          const days = daysRes.data.days || [];
          setEventDays(days);
        }
      }
      if (catRes.success) setCategories(catRes.data.categories || []);
      if (trnerRes.success) setTrainers((trnerRes.data || []).filter((trainer) => trainer.isActive && trainer.accessStatus === 'approved'));
      if (modRes.success) setModerators((modRes.data || []).filter((moderator) => moderator.isActive));
    } catch (err) {
      toast.error('Failed to load training management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventChange = async (eventId) => {
    setForm((prev) => ({ ...prev, event: eventId, eventDay: '' }));
    if (eventId) {
      try {
        const res = await api.get(`/admin/events/${eventId}/days`);
        if (res.success) {
          const days = res.data.days || [];
          setEventDays(days);
          if (days.length > 0) {
            setForm((prev) => ({ ...prev, eventDay: days[0]._id }));
          }
        }
      } catch (err) {
        setEventDays([]);
      }
    } else {
      setEventDays([]);
    }
  };

  const handleOpenCreateModal = async () => {
    setEditingTraining(null);
    const defaultEv = events[0]?._id || '';
    let days = [];
    if (defaultEv) {
      const daysRes = await api.get(`/admin/events/${defaultEv}/days`).catch(() => null);
      if (daysRes?.success) days = daysRes.data.days || [];
    }
    setEventDays(days);
    setCoverImageFile(null);
    setCoverImagePreview('');
    setLanguageMode('Somali');

    setForm({
      title: '',
      description: '',
      event: defaultEv,
      eventDay: days[0]?._id || '',
      category: categories[0]?._id || '',
      trainers: [],
      moderator: moderators[0]?._id || '',
      startTime: '',
      endTime: '',
      audience: 'General Public & University Students',
      level: 'general',
      language: 'Somali',
      capacity: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = async (tr) => {
    setEditingTraining(tr);
    setCoverImageFile(null);
    setCoverImagePreview(assetUrl(tr.coverImage));
    const evId = tr.event?._id || tr.event || '';
    if (evId) {
      const daysRes = await api.get(`/admin/events/${evId}/days`).catch(() => null);
      if (daysRes?.success) setEventDays(daysRes.data.days || []);
    }

    const trainingLanguage = tr.language || 'Somali';
    setLanguageMode(['Somali', 'English'].includes(trainingLanguage) ? trainingLanguage : 'Other');

    setForm({
      title: tr.title || '',
      description: tr.description || '',
      event: evId,
      eventDay: tr.eventDay?._id || tr.eventDay || '',
      category: tr.category?._id || tr.category || '',
      trainers: [...new Set([...(tr.trainers || []).map((trainer) => trainer?._id || trainer), ...(tr.trainer ? [tr.trainer?._id || tr.trainer] : [])])],
      moderator: tr.moderator?._id || tr.moderator || '',
      startTime: toTimeInputValue(tr.startTime),
      endTime: toTimeInputValue(tr.endTime),
      audience: tr.audience || 'General Public & University Students',
      level: tr.level || 'general',
      language: trainingLanguage,
      capacity: tr.capacity ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventDay) {
      toast.error('Choose which day this session belongs to. Days are created automatically from the event dates.');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key === 'trainers') form.trainers.forEach((trainerId) => formData.append('trainers', trainerId));
        else if (form[key]) formData.append(key, form[key]);
      });
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }

      if (editingTraining) {
        await api.put(`/admin/trainings/${editingTraining._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Training updated!');
      } else {
        await api.post('/admin/trainings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('New training session created!');
      }

      setShowModal(false);
      setEditingTraining(null);
      setCoverImageFile(null);
      setCoverImagePreview('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleStatusChange = async (trainingId, newStatus) => {
    if (newStatus === 'completed' && !await confirmAction({ title: 'Mark this session as finished?', message: 'Attendance will be locked. Participant certificates and the trainer Certificate of Appreciation will be queued for safe background delivery. This session cannot be reopened.', confirmLabel: 'Mark as finished', tone: 'warning' })) return;
    try {
      const res = await api.patch(`/admin/trainings/${trainingId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(res.message || 'Session updated.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Could not update this session.');
    }
  };

  // Opening simply removes the manual stop, so the session goes back to following the event dates.
  // Closing records "closed from now". The server decides whether either is possible and says why.
  const handleRegistrationChange = async (trainingId, open) => {
    try {
      const res = await api.patch(`/admin/trainings/${trainingId}/registration`, { open });
      if (res.success) {
        toast.success(res.message || (open ? 'Registration opened.' : 'Registration closed.'));
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Could not change registration.');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({
      title: 'Delete training session and its data?',
      message: 'This permanently deletes this session, registrations, attendance, meeting details, communications, feedback, certificates, recordings, materials, QR sessions, and related operational data. This cannot be undone.',
      confirmLabel: 'Delete session and data',
      tone: 'danger',
    })) return;
    try {
      await api.delete(`/admin/trainings/${id}`);
      toast.success('Training deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading training sessions..." />;
  const filteredTrainings = trainings.filter((item) => (!filters.event || String(item.event?._id || item.event) === filters.event) && (!filters.eventDay || String(item.eventDay?._id || item.eventDay) === filters.eventDay) && (!filters.level || item.level === filters.level) && (!filters.language || item.language === filters.language));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trainings Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pick a day, set the time, assign the trainer and moderator, then publish. Registration opens and closes by itself: it starts when the event opens and stops when the session&rsquo;s own day begins.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create New Training Session</span>
        </button>
      </div>

      <AdminProgramFilters value={filters} onChange={setFilters} includeSession={false} includeLevel includeLanguage />

      {/* Trainings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Session Title</th>
                <th className="p-4">Day & Category</th>
                <th className="p-4">Trainer & Moderator</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status &amp; registration</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTrainings.map((tr) => (
                <tr key={tr._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900 max-w-xs truncate">
                    {tr.title}
                  </td>
                  <td className="p-4">
                    <span className="block text-[#1a6b3c] font-bold">
                      {tr.eventDay?.dayNumber ? `Day ${tr.eventDay.dayNumber}: ${tr.eventDay.theme}` : 'Unassigned Day'}
                    </span>
                    <span className="text-[11px] text-slate-400">{tr.category?.name || '—'}</span>
                  </td>
                  <td className="p-4">
                    <span className="block text-slate-800 font-semibold">T: {([...(tr.trainers || []), ...(!tr.trainers?.length && tr.trainer ? [tr.trainer] : [])].map((trainer) => trainer.name).join(', ')) || 'Unassigned'}</span>
                    <span className="text-[11px] text-slate-500 block">M: {tr.moderator?.fullName || 'Unassigned'}</span>
                  </td>
                  <td className="p-4">
                    <span className="block text-slate-900">{tr.date ? new Date(tr.date).toLocaleDateString() : '—'}</span>
                    <span className="text-[11px] text-slate-400">{formatTimeRange12(tr.startTime, tr.endTime)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex min-w-52 flex-col items-start gap-2">
                      <div className={`relative inline-flex min-w-52 items-center rounded-full border ${statusControlClass(tr.status)}`}>
                        <span className="pointer-events-none ml-3 h-2 w-2 shrink-0 rounded-full bg-current" />
                        <select
                          value={tr.status}
                          onChange={(e) => handleStatusChange(tr._id, e.target.value)}
                          aria-label={`Change status for ${tr.title}`}
                          className="admin-status-select w-full cursor-pointer appearance-none bg-transparent py-2 pl-2 pr-9 text-xs font-bold"
                        >
                          {SESSION_STATUSES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4" />
                      </div>

                      {canChangeRegistration(tr) && (
                        <button
                          type="button"
                          onClick={() => handleRegistrationChange(tr._id, !tr.registration?.open)}
                          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-[#1a6b3c] hover:bg-emerald-50 hover:text-[#1a6b3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a6b3c]"
                        >
                          {tr.registration?.open ? 'Close registration' : 'Open registration'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(tr)}
                      aria-label={`Edit ${tr.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tr._id)}
                      aria-label={`Delete ${tr.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredTrainings.length && <tr><td colSpan="6" className="p-12 text-center text-sm text-slate-500">No training sessions match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 my-8" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingTraining ? 'Edit Training Session' : 'Create New Training Session'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Introduction to Machine Learning Algorithms"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Event Edition *</label>
                  <select
                    value={form.event}
                    onChange={(e) => handleEventChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  >
                    <option value="">Select Event</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>{ev.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Event Day *</label>
                  {eventDays.length > 0 ? (
                    <select
                      value={form.eventDay}
                      onChange={(e) => setForm({ ...form, eventDay: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    >
                      <option value="">Select Day</option>
                      {eventDays.map((d) => (
                        <option key={d._id} value={d._id}>Day {d.dayNumber}: {d.theme}{d.date ? ` (${new Date(d.date).toLocaleDateString()})` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center justify-between">
                      <span>No Days for this Event!</span>
                      <Link to="/admin/events" className="underline font-bold text-xs">
                        Create Days
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <fieldset className="min-w-0">
                  <legend className="block font-bold uppercase text-slate-700 mb-1">Assign Trainers</legend>
                  <details className="group relative" aria-describedby="trainer-selection-help">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-[#1a6b3c] focus-visible:ring-offset-1 [&::-webkit-details-marker]:hidden">
                      <span className="truncate">{form.trainers.length ? `${form.trainers.length} trainer${form.trainers.length === 1 ? '' : 's'} selected` : 'Select trainers'}</span>
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {form.trainers.length > 0 && <button type="button" onClick={() => setForm((current) => ({ ...current, trainers: [] }))} className="flex min-h-10 w-full items-center justify-end rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50">Clear selection</button>}
                    {trainers.length ? trainers.map((trainer) => {
                      const selected = form.trainers.includes(trainer._id);
                      return <label key={trainer._id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${selected ? 'bg-emerald-50 text-[#1a6b3c]' : 'hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={selected} onChange={() => setForm((current) => ({ ...current, trainers: selected ? current.trainers.filter((id) => id !== trainer._id) : [...current.trainers, trainer._id] }))} className="h-4 w-4 rounded border-slate-300 text-[#1a6b3c] focus:ring-[#1a6b3c]" />
                        <span className="min-w-0"><span className="block truncate font-semibold">{trainer.name}</span>{trainer.organization && <span className="block truncate text-xs text-slate-500">{trainer.organization}</span>}</span>
                      </label>;
                    }) : <p className="p-3 text-sm text-slate-500">No approved trainers available.</p>}
                    </div>
                  </details>
                  <p id="trainer-selection-help" className="mt-1 text-xs text-slate-500">{form.trainers.length ? `${form.trainers.length} trainer${form.trainers.length === 1 ? '' : 's'} selected` : 'Optional — select one or more trainers.'}</p>
                </fieldset>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Assign Moderator Account</label>
                  <select
                    value={form.moderator}
                    onChange={(e) => setForm({ ...form, moderator: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">None / Unassigned</option>
                    {moderators.map((m) => (
                      <option key={m._id} value={m._id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="general">General</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Language</label>
                  <select
                    value={languageMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setLanguageMode(mode);
                      setForm({ ...form, language: mode === 'Other' ? '' : mode });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Somali">Somali</option>
                    <option value="English">English</option>
                    <option value="Other">Other</option>
                  </select>
                  {languageMode === 'Other' && (
                    <input
                      type="text"
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      placeholder="Enter language name"
                      className="mt-2 w-full p-2.5 rounded-lg border border-slate-300"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">Maximum approved participants for this session.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">16:9 Cover Image / Presentation Graphic</label>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                      toast.error('Choose a PNG, JPG, or WebP image.');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Cover image must be 5 MB or smaller.');
                      e.target.value = '';
                      return;
                    }
                    setCoverImageFile(file);
                    setCoverImagePreview(URL.createObjectURL(file));
                  }}
                />
                <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-[#1a6b3c] hover:bg-emerald-50/40">
                  {coverImagePreview ? (
                    <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
                      <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={coverImagePreview} alt="Training cover preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{coverImageFile?.name || 'Current cover image'}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Preview shown in the same 16:9 shape used on training cards.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => coverImageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-[#1a6b3c] px-3 py-2 text-xs font-bold text-white"><ArrowUpTrayIcon className="h-4 w-4" />Replace image</button>
                          {coverImageFile && <button type="button" onClick={() => { setCoverImageFile(null); setCoverImagePreview(assetUrl(editingTraining?.coverImage)); if (coverImageInputRef.current) coverImageInputRef.current.value = ''; }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"><XMarkIcon className="h-4 w-4" />Cancel replacement</button>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => coverImageInputRef.current?.click()} className="flex w-full flex-col items-center px-6 py-9 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6b3c] focus-visible:ring-inset">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#1a6b3c]"><PhotoIcon className="h-6 w-6" /></span>
                      <span className="mt-3 text-sm font-bold text-slate-900">Upload a training cover image</span>
                      <span className="mt-1 text-xs text-slate-500"><span className="font-bold text-[#1a6b3c]">Choose an image</span> from your device</span>
                      <span className="mt-2 text-[11px] text-slate-400">PNG, JPG, or WebP · 16:9 recommended · Maximum 5 MB</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Description & Overview</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                ></textarea>
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
                  Save Training Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingsManagement;
