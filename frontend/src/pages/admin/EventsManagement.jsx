import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const minimumFutureDateTime = () => {
  const future = new Date(Date.now() + 60 * 1000);
  const shifted = new Date(future.getTime() - future.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
};

const datePart = (dateTime = '') => dateTime.split('T')[0] || '';
const timePart = (dateTime = '') => dateTime.split('T')[1] || '';
const minuteAfter = (dateTime = '') => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  date.setMinutes(date.getMinutes() + 1);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const availableEventStatus = (form) => {
  const opensAt = new Date(form.registrationStart).getTime();
  const closesAt = new Date(form.registrationDeadline).getTime();
  const startsAt = form.startDate && form.startTime ? new Date(`${form.startDate}T${form.startTime}`).getTime() : Number.NaN;
  const endsAt = form.endDate ? new Date(`${form.endDate}T23:59:59`).getTime() : Number.NaN;
  if (![opensAt, closesAt, startsAt, endsAt].every(Number.isFinite)) return null;
  const now = Date.now();
  if (now < opensAt) return 'registration_scheduled';
  if (now < closesAt) return 'registration_open';
  if (now < startsAt) return 'registration_closed';
  if (now <= endsAt) return 'ongoing';
  return 'completed';
};

const toNairobiInput = (value) => value
  ? new Date(new Date(value).getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  : '';

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

  const [eventForm, setEventForm] = useState({
    name: '',
    theme: '',
    year: '',
    startDate: '',
    startTime: '',
    endDate: '',
    registrationStart: '',
    registrationDeadline: '',
    description: '',
    status: 'draft',
    isCurrent: false,
  });

  const [dayForm, setDayForm] = useState({
    dayNumber: 1,
    theme: '',
    date: '',
  });

  const fetchEventsAndDays = async () => {
    try {
      const res = await api.get('/admin/events');
      if (res.success) {
        const eventList = res.data || [];
        setEvents(eventList);

        // Fetch days for each event
        const daysMap = {};
        for (const ev of eventList) {
          const daysRes = await api.get(`/admin/events/${ev._id}/days`).catch(() => null);
          if (daysRes?.success) {
            daysMap[ev._id] = daysRes.data.days || [];
          }
        }
        setEventDaysMap(daysMap);
      }
    } catch (err) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndDays();
  }, []);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    const eventStartsAt = eventForm.startDate && eventForm.startTime
      ? new Date(`${eventForm.startDate}T${eventForm.startTime}`).getTime()
      : Number.NaN;
    const registrationOpensAt = new Date(eventForm.registrationStart).getTime();
    const registrationClosesAt = new Date(eventForm.registrationDeadline).getTime();
    if (!Number.isFinite(registrationOpensAt) || !Number.isFinite(registrationClosesAt) || !Number.isFinite(eventStartsAt)) {
      toast.error('Complete the registration window and event schedule.');
      return;
    }
    if (registrationOpensAt >= registrationClosesAt) {
      toast.error('Registration must open before it closes.');
      return;
    }
    if (registrationClosesAt >= eventStartsAt) {
      toast.error('Registration must close before the event starts.');
      return;
    }
    const validStatus = availableEventStatus(eventForm);
    if (eventForm.status !== 'draft' && eventForm.status !== validStatus) {
      toast.error(`Based on the schedule, status must be ${validStatus?.replaceAll('_', ' ') || 'Draft until the schedule is complete'}.`);
      return;
    }
    try {
      if (editingEvent) {
        await api.put(`/admin/events/${editingEvent._id}`, eventForm);
        toast.success('Event updated!');
      } else {
        await api.post('/admin/events', eventForm);
        toast.success('New Event edition created!');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventForDay) return;
    const day = dayForm.date;
    const eventStart = selectedEventForDay.startDate?.split('T')[0];
    const eventEnd = selectedEventForDay.endDate?.split('T')[0];
    if (!day || day < eventStart || day > eventEnd) {
      toast.error(`Event day must be between ${eventStart} and ${eventEnd}.`);
      return;
    }
    const siblingDays = eventDaysMap[selectedEventForDay._id] || [];
    const duplicateDate = siblingDays.find((item) => item._id !== editingDay?._id && item.date?.split('T')[0] === day);
    const duplicateNumber = siblingDays.find((item) => item._id !== editingDay?._id && item.dayNumber === dayForm.dayNumber);
    if (duplicateDate) {
      toast.error(`An event day already exists on ${day}. Add training sessions to that day instead.`);
      return;
    }
    if (duplicateNumber) {
      toast.error(`Day ${dayForm.dayNumber} already exists for this event.`);
      return;
    }
    try {
      if (editingDay) {
        await api.put(`/admin/events/${selectedEventForDay._id}/days/${editingDay._id}`, dayForm);
        toast.success('Event Day updated!');
      } else {
        await api.post(`/admin/events/${selectedEventForDay._id}/days`, dayForm);
        toast.success('New Event Day added!');
      }
      setShowDayModal(false);
      setEditingDay(null);
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Day save failed');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      theme: event.theme || '',
      year: event.year,
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      startTime: event.startTime || '09:00',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      registrationStart: toNairobiInput(event.registrationStart),
      registrationDeadline: toNairobiInput(event.registrationDeadline),
      description: event.description || '',
      status: event.status,
      isCurrent: Boolean(event.isCurrent),
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!await confirmAction({ title: 'Delete event edition?', message: 'This edition will be permanently removed. An edition with related program data cannot be deleted.', confirmLabel: 'Delete edition' })) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleAddDay = (event) => {
    setSelectedEventForDay(event);
    setEditingDay(null);
    const existingDays = eventDaysMap[event._id] || [];
    const nextNumber = existingDays.length + 1;
    setDayForm({
      dayNumber: nextNumber,
      theme: `Day ${nextNumber} Theme`,
      date: event.startDate ? event.startDate.split('T')[0] : '',
    });
    setShowDayModal(true);
  };

  const handleEditDay = (event, day) => {
    setSelectedEventForDay(event);
    setEditingDay(day);
    setDayForm({
      dayNumber: day.dayNumber,
      theme: day.theme,
      date: day.date ? day.date.split('T')[0] : '',
    });
    setShowDayModal(true);
  };

  const handleDeleteDay = async (eventId, dayId) => {
    if (!await confirmAction({ title: 'Delete event day?', message: 'This program day will be permanently removed. A day with assigned sessions cannot be deleted.', confirmLabel: 'Delete day' })) return;
    try {
      await api.delete(`/admin/events/${eventId}/days/${dayId}`);
      toast.success('Event day deleted');
      fetchEventsAndDays();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading events and event days..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Events & Event Days Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage annual National Training Week editions (2026+) and create/edit themed Event Days for each edition.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setEventForm({
              name: '',
              theme: '',
              year: '',
              startDate: '',
              startTime: '',
              endDate: '',
              registrationStart: '',
              registrationDeadline: '',
              description: '',
              status: 'draft',
              isCurrent: false,
            });
            setShowEventModal(true);
          }}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#124d2a] sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create New Event Edition</span>
        </button>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-6">
        {events.map((ev) => {
          const days = eventDaysMap[ev._id] || [];
          return (
            <div key={ev._id} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
              
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-emerald-100 text-[#1a6b3c] rounded-md">
                      Year {ev.year}
                    </span>
                      <span className="text-xs font-bold uppercase text-slate-500">{ev.status.replace(/_/g, ' ')}</span>
                      {ev.isCurrent && <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#1a6b3c] text-white">Current public edition</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{ev.name}</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">Theme: {ev.theme}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAddDay(ev)}
                    className="flex min-h-10 items-center gap-1 rounded-lg bg-[#1a6b3c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#124d2a]"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Event Day</span>
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

              {/* Event Days Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4 text-[#1a6b3c]" />
                  <span>Configured Themed Event Days ({days.length})</span>
                </h4>

                {days.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {days.map((day) => (
                      <div
                        key={day._id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 hover:border-emerald-500 transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#1a6b3c] block">
                            Day {day.dayNumber}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm">{day.theme}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditDay(ev, day)}
                            className="p-1 text-slate-400 hover:text-blue-600"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDay(ev._id, day._id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                    No themed days configured for this event edition yet. Click "+ Add Event Day" to add days.
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Event Form Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowEventModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowEventModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingEvent ? 'Edit Event Edition' : 'Create New Event Edition'}
            </h3>

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. National Training Week 2027"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration Opens</label>
                  <input type="datetime-local" min={editingEvent ? undefined : minimumFutureDateTime()} max={eventForm.registrationDeadline || undefined} value={eventForm.registrationStart} onChange={(e) => setEventForm({ ...eventForm, registrationStart: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" required />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    min={eventForm.registrationStart || minimumFutureDateTime()}
                    max={eventForm.startDate && eventForm.startTime ? `${eventForm.startDate}T${eventForm.startTime}` : undefined}
                    value={eventForm.registrationDeadline}
                    onChange={(e) => {
                      const deadline = e.target.value;
                      const deadlineDate = datePart(deadline);
                      const startIsTooEarly = eventForm.startDate && eventForm.startDate < deadlineDate;
                      const sameDayTimeIsTooEarly = eventForm.startDate === deadlineDate
                        && eventForm.startTime && eventForm.startTime <= timePart(deadline);
                      setEventForm({
                        ...eventForm,
                        registrationDeadline: deadline,
                        ...(startIsTooEarly || sameDayTimeIsTooEarly ? { startDate: '', endDate: '', startTime: '' } : {}),
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <p className="sm:col-span-2 text-[11px] leading-5 text-slate-500">Choose when registration opens and closes. Both must be before the event start date and time.</p>
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2027"
                    min={new Date().getFullYear()}
                    value={eventForm.year}
                    onChange={(e) => setEventForm({ ...eventForm, year: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    min={datePart(eventForm.registrationDeadline) || (eventForm.year ? `${eventForm.year}-01-01` : undefined)}
                    max={eventForm.year ? `${eventForm.year}-12-31` : undefined}
                    value={eventForm.startDate}
                    onChange={(e) => {
                      setEventForm({
                        ...eventForm,
                        startDate: e.target.value,
                        ...(eventForm.endDate && eventForm.endDate < e.target.value ? { endDate: '' } : {}),
                        ...(e.target.value !== datePart(eventForm.registrationDeadline) ? {} : { startTime: '' }),
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">End Date</label>
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
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Event Starts</label>
                  <input type="time" min={eventForm.startDate === datePart(eventForm.registrationDeadline) ? minuteAfter(eventForm.registrationDeadline) : undefined} value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-300" required />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Status</label>
                  <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="registration_scheduled" disabled={availableEventStatus(eventForm) !== 'registration_scheduled'}>Registration Scheduled</option>
                  <option value="registration_open" disabled={availableEventStatus(eventForm) !== 'registration_open'}>Registration Open</option>
                  <option value="registration_closed" disabled={availableEventStatus(eventForm) !== 'registration_closed'}>Registration Closed</option>
                  <option value="ongoing" disabled={availableEventStatus(eventForm) !== 'ongoing'}>Ongoing</option>
                  <option value="completed" disabled={availableEventStatus(eventForm) !== 'completed'}>Completed</option>
                  </select>
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Day Form Modal */}
      {showDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowDayModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowDayModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingDay ? 'Edit Event Day' : `Add Day to ${selectedEventForDay?.name}`}
            </h3>

            <form onSubmit={handleDaySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Day Number *</label>
                  <input
                    type="number"
                    min="1"
                    value={dayForm.dayNumber}
                    onChange={(e) => setDayForm({ ...dayForm, dayNumber: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase text-slate-700 mb-1">Day Date *</label>
                  <input
                    type="date"
                    min={selectedEventForDay?.startDate?.split('T')[0]}
                    max={selectedEventForDay?.endDate?.split('T')[0]}
                    value={dayForm.date}
                    onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Day Theme *</label>
                <input
                  type="text"
                  placeholder="e.g. AI Literacy Day"
                  value={dayForm.theme}
                  onChange={(e) => setDayForm({ ...dayForm, theme: e.target.value })}
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
                  Save Day
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
