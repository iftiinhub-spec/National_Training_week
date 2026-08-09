import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const TRAINING_STATUSES = [
  ['draft', 'Draft'],
  ['published', 'Published'],
  ['registration_open', 'Registration Open'],
  ['registration_closed', 'Registration Closed'],
  ['ongoing', 'Ongoing / Live'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
];

const statusControlClass = (status) => {
  if (status === 'published' || status === 'registration_open' || status === 'ongoing') {
    return 'border-emerald-200 bg-emerald-50 text-[#1a6b3c]';
  }
  if (status === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'completed') return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
};

export const TrainingsManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventDays, setEventDays] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event: '',
    eventDay: '',
    category: '',
    trainer: '',
    moderator: '',
    date: '',
    startTime: '09:00 AM',
    endTime: '11:00 AM',
    audience: 'General Public & University Students',
    level: 'general',
    language: 'Somali / English',
    capacity: 100,
  });

  const fetchData = async () => {
    try {
      const [trRes, evRes, catRes, trnerRes, modRes] = await Promise.all([
        api.get('/admin/trainings'),
        api.get('/admin/events'),
        api.get('/admin/categories'),
        api.get('/admin/trainers'),
        api.get('/admin/moderators'),
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
      if (trnerRes.success) setTrainers(trnerRes.data || []);
      if (modRes.success) setModerators(modRes.data || []);
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
            setForm((prev) => ({ ...prev, eventDay: days[0]._id, date: days[0].date ? days[0].date.split('T')[0] : prev.date }));
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

    setForm({
      title: '',
      description: '',
      event: defaultEv,
      eventDay: days[0]?._id || '',
      category: categories[0]?._id || '',
      trainer: trainers[0]?._id || '',
      moderator: moderators[0]?._id || '',
      date: days[0]?.date ? days[0].date.split('T')[0] : '',
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      audience: 'General Public & University Students',
      level: 'general',
      language: 'Somali / English',
      capacity: 100,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = async (tr) => {
    setEditingTraining(tr);
    const evId = tr.event?._id || tr.event || '';
    if (evId) {
      const daysRes = await api.get(`/admin/events/${evId}/days`).catch(() => null);
      if (daysRes?.success) setEventDays(daysRes.data.days || []);
    }

    setForm({
      title: tr.title || '',
      description: tr.description || '',
      event: evId,
      eventDay: tr.eventDay?._id || tr.eventDay || '',
      category: tr.category?._id || tr.category || '',
      trainer: tr.trainer?._id || tr.trainer || '',
      moderator: tr.moderator?._id || tr.moderator || '',
      date: tr.date ? tr.date.split('T')[0] : '',
      startTime: tr.startTime || '09:00 AM',
      endTime: tr.endTime || '11:00 AM',
      audience: tr.audience || 'General Public & University Students',
      level: tr.level || 'general',
      language: tr.language || 'Somali / English',
      capacity: tr.capacity || 100,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventDay) {
      toast.error('Please select an Event Day for this session. If none exist, create an Event Day in Events & Days first.');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) formData.append(key, form[key]);
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
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleStatusChange = async (trainingId, newStatus) => {
    try {
      const res = await api.patch(`/admin/trainings/${trainingId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Status transition failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training session?')) return;
    try {
      await api.delete(`/admin/trainings/${id}`);
      toast.success('Training deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading training sessions..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trainings Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, upload 16:9 cover images, select Event Days, assign trainers/moderators, and manage status transitions.
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
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {trainings.map((tr) => (
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
                    <span className="block text-slate-800 font-semibold">T: {tr.trainer?.name || 'Unassigned'}</span>
                    <span className="text-[11px] text-slate-500 block">M: {tr.moderator?.fullName || 'Unassigned'}</span>
                  </td>
                  <td className="p-4">
                    <span className="block text-slate-900">{tr.date ? new Date(tr.date).toLocaleDateString() : '—'}</span>
                    <span className="text-[11px] text-slate-400">{tr.startTime} - {tr.endTime}</span>
                  </td>
                  <td className="p-4">
                    <div className={`relative inline-flex min-w-44 items-center rounded-full border ${statusControlClass(tr.status)}`}>
                      <span className="pointer-events-none ml-3 h-2 w-2 shrink-0 rounded-full bg-current" />
                      <select
                        value={tr.status}
                        onChange={(e) => handleStatusChange(tr._id, e.target.value)}
                        aria-label={`Change status for ${tr.title}`}
                        className="admin-status-select w-full cursor-pointer appearance-none bg-transparent py-2 pl-2 pr-9 text-xs font-bold"
                      >
                        {TRAINING_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4" />
                    </div>
                  </td>
                  <td className="p-4 flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(tr)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tr._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
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
                      onChange={(e) => {
                        const selectedDay = eventDays.find((d) => d._id === e.target.value);
                        setForm({
                          ...form,
                          eventDay: e.target.value,
                          date: selectedDay?.date ? selectedDay.date.split('T')[0] : form.date,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    >
                      <option value="">Select Day</option>
                      {eventDays.map((d) => (
                        <option key={d._id} value={d._id}>Day {d.dayNumber}: {d.theme}</option>
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

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Assign Trainer Profile</label>
                  <select
                    value={form.trainer}
                    onChange={(e) => setForm({ ...form, trainer: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">None / Unassigned</option>
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>

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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Session Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">16:9 Cover Image / Presentation Graphic</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImageFile(e.target.files[0])}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
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
