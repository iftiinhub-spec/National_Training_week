import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { ArrowPathIcon, CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// The server sends `phase` with every event: what is happening right now, worked out from the
// dates. This screen only colours it — it never works out a date rule of its own, so it cannot
// end up telling the administrator something different from what the server will accept.
const phaseChipClass = (phase) => {
  if (phase === 'registration_open') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (phase === 'running') return 'border-purple-200 bg-purple-50 text-purple-700';
  if (phase === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (phase === 'finished') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-800';
};

const EVENT_STATUSES = [
  ['draft', 'Draft — nobody can see it'],
  ['published', 'Published — visible to everyone'],
  ['cancelled', 'Cancelled'],
];

const dateOnly = (value) => (value ? String(value).split('T')[0] : '');

// <input type="datetime-local"> has no time zone. Everything here is Nairobi time, so the stored
// instant is shifted into Nairobi for display and shifted back by the server on save.
const toNairobiInput = (value) => (value
  ? new Date(new Date(value).getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  : '');

const countDays = (startDate, endDate) => {
  if (!startDate || !endDate || startDate > endDate) return 0;
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86400000) + 1;
};

const emptyEventForm = {
  name: '',
  theme: '',
  year: '',
  startDate: '',
  endDate: '',
  registrationStart: '',
  registrationDeadline: '',
  description: '',
  status: 'draft',
  isCurrent: false,
};

export const EventsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [events, setEvents] = useState([]);
  const [eventDaysMap, setEventDaysMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEventForDay, setSelectedEventForDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [useCutOff, setUseCutOff] = useState(false);
  const [dayTheme, setDayTheme] = useState('');

  const fetchEventsAndDays = async () => {
    try {
      const res = await api.get('/admin/events');
      if (res.success) {
        const eventList = res.data || [];
        setEvents(eventList);

        const daysMap = {};
        for (const ev of eventList) {
          const daysRes = await api.get(`/admin/events/${ev._id}/days`).catch(() => null);
          if (daysRes?.success) daysMap[ev._id] = daysRes.data.days || [];
        }
        setEventDaysMap(daysMap);
      }
    } catch (err) {
      toast.error('Could not load the events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndDays();
  }, []);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventForm.registrationStart) {
      toast.error('Choose when registration opens.');
      return;
    }
    if (eventForm.endDate < eventForm.startDate) {
      toast.error('The end date cannot be before the start date.');
      return;
    }
    // An empty cut-off means "no event-wide cut-off": each session then closes on its own day.
    const payload = { ...eventForm, registrationDeadline: useCutOff ? eventForm.registrationDeadline : '' };
    try {
      const res = editingEvent
        ? await api.put(`/admin/events/${editingEvent._id}`, payload)
        : await api.post('/admin/events', payload);
      toast.success(res?.message || 'Event saved.');
      setShowEventModal(false);
      setEditingEvent(null);
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Could not save the event.');
    }
  };

  const handleDaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventForDay || !editingDay) return;
    try {
      await api.put(`/admin/events/${selectedEventForDay._id}/days/${editingDay._id}`, { theme: dayTheme });
      toast.success('Day theme saved.');
      setShowDayModal(false);
      setEditingDay(null);
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Could not save the day theme.');
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setEventForm(emptyEventForm);
    setUseCutOff(false);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      theme: event.theme || '',
      year: event.year,
      startDate: dateOnly(event.startDate),
      endDate: dateOnly(event.endDate),
      registrationStart: toNairobiInput(event.registrationStart),
      registrationDeadline: toNairobiInput(event.registrationDeadline),
      description: event.description || '',
      status: event.status,
      isCurrent: Boolean(event.isCurrent),
    });
    setUseCutOff(Boolean(event.registrationDeadline));
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!await confirmAction({
      title: 'Delete this whole event?',
      message: 'This permanently deletes the event, all its days, all training sessions, registrations, attendance, meetings, feedback, certificates, recordings, co-organizers, and related data. This cannot be undone.',
      confirmLabel: 'Delete everything',
      tone: 'danger',
    })) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted.');
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Could not delete the event.');
    }
  };

  const handleEditDay = (event, day) => {
    setSelectedEventForDay(event);
    setEditingDay(day);
    setDayTheme(day.theme || '');
    setShowDayModal(true);
  };

  // Days come from the event's date range. This button is only needed for older events that were
  // built before days were generated, or after a date range is changed outside this screen.
  const handleRebuildDays = async (event) => {
    try {
      const res = await api.post(`/admin/events/${event._id}/days/regenerate`, {});
      toast.success(res?.message || 'Days rebuilt.');
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Could not rebuild the days.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading events and days..." />;

  const plannedDays = countDays(eventForm.startDate, eventForm.endDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Events &amp; days</h1>
          <p className="text-xs text-slate-500 mt-1">
            Set the dates of an edition and the day list is built for you — one day per date. Give each day a theme, then add its sessions.
          </p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#124d2a] sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create new event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {events.map((ev) => {
          const days = eventDaysMap[ev._id] || [];
          return (
            <div key={ev._id} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-emerald-100 text-[#1a6b3c] rounded-md">
                      Year {ev.year}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${phaseChipClass(ev.phase)}`}>
                      {ev.phaseLabel || 'Draft'}
                    </span>
                    {ev.isCurrent && <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#1a6b3c] text-white">Current public edition</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{ev.name}</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">Theme: {ev.theme}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {dateOnly(ev.startDate)} to {dateOnly(ev.endDate)}
                    {' · '}
                    Registration opens {ev.registrationStart ? new Date(ev.registrationStart).toLocaleString() : 'not set'}
                    {' · '}
                    {ev.registrationDeadline
                      ? `Everything closes ${new Date(ev.registrationDeadline).toLocaleString()}`
                      : 'Each session closes on its own day'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleRebuildDays(ev)}
                    title="Rebuild the day list from the event dates"
                    className="flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#1a6b3c] hover:text-[#1a6b3c]"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>Rebuild days</span>
                  </button>
                  <button
                    onClick={() => handleEditEvent(ev)}
                    className="min-h-10 min-w-10 rounded-lg p-2 text-slate-600 hover:bg-emerald-50 hover:text-[#1a6b3c]"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev._id)}
                    className="p-2 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4 text-[#1a6b3c]" />
                  <span>Days ({days.length}) — created from the event dates</span>
                </h4>

                {days.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {days.map((day) => (
                      <div
                        key={day._id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 hover:border-emerald-500 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-[#1a6b3c] block">
                            Day {day.dayNumber}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm truncate">{day.theme}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditDay(ev, day)}
                          title="Rename this day"
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                    This event has no days yet. Check its start and end dates, then press &ldquo;Rebuild days&rdquo;.
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Event form */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onMouseDown={() => setShowEventModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 my-8" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowEventModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingEvent ? 'Edit event' : 'Create a new event'}
            </h3>

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Event name</label>
                <input
                  type="text"
                  placeholder="e.g. National Training Week 2027"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Theme</label>
                <input
                  type="text"
                  placeholder="e.g. Digital Skills for National Growth"
                  value={eventForm.theme}
                  onChange={(e) => setEventForm({ ...eventForm, theme: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2027"
                    value={eventForm.year}
                    onChange={(e) => setEventForm({ ...eventForm, year: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">First day</label>
                  <input
                    type="date"
                    min={eventForm.year ? `${eventForm.year}-01-01` : undefined}
                    max={eventForm.year ? `${eventForm.year}-12-31` : undefined}
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      startDate: e.target.value,
                      ...(eventForm.endDate && eventForm.endDate < e.target.value ? { endDate: '' } : {}),
                    })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Last day</label>
                  <input
                    type="date"
                    min={eventForm.startDate || (eventForm.year ? `${eventForm.year}-01-01` : undefined)}
                    max={eventForm.year ? `${eventForm.year}-12-31` : undefined}
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                {plannedDays > 0 && (
                  <p className="sm:col-span-3 text-[11px] leading-5 text-slate-500">
                    This event will have <strong>{plannedDays} day{plannedDays === 1 ? '' : 's'}</strong>. They are created for you when you save — you only name them.
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration opens</label>
                  <input
                    type="datetime-local"
                    value={eventForm.registrationStart}
                    onChange={(e) => setEventForm({ ...eventForm, registrationStart: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    From this moment people can register. Each session then stops taking registrations when its own day begins, so day 5 stays open while day 1 is running.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCutOff}
                    onChange={(e) => setUseCutOff(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#1a6b3c]"
                  />
                  <span>
                    <strong className="block text-sm text-slate-900">Stop all registration at one time</strong>
                    <span className="block text-xs text-slate-500 mt-1">Only tick this if you want registration for the whole event to end at a fixed moment. Most editions do not need it.</span>
                  </span>
                </label>

                {useCutOff && (
                  <input
                    type="datetime-local"
                    min={eventForm.registrationStart || undefined}
                    value={eventForm.registrationDeadline}
                    onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {EVENT_STATUSES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    You only choose these three. &ldquo;Registration open&rdquo;, &ldquo;running&rdquo; and &ldquo;finished&rdquo; are worked out from the dates above.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer">
                  <input type="checkbox" checked={eventForm.isCurrent} onChange={(e) => setEventForm({ ...eventForm, isCurrent: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#1a6b3c]" />
                  <span><strong className="block text-sm text-slate-900">Use as current public edition</strong><span className="block text-xs text-slate-500 mt-1">Controls the public homepage, countdown, program, and default training catalogue. Only one edition can be current.</span></span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a6b3c] text-white font-bold rounded-lg shadow-xs"
                >
                  Save event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day theme */}
      {showDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowDayModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowDayModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              Name day {editingDay?.dayNumber}
            </h3>
            <p className="text-xs text-slate-500">
              {editingDay?.date && new Date(editingDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' — '}
              the date comes from the event and cannot be changed here.
            </p>

            <form onSubmit={handleDaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Day theme</label>
                <input
                  type="text"
                  placeholder="e.g. AI Literacy Day"
                  value={dayTheme}
                  onChange={(e) => setDayTheme(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#155289] text-white font-bold rounded-lg shadow-xs"
                >
                  Save theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventsManagement;
