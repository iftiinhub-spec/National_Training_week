import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const registrationDefaults = (eventDate) => {
  if (!eventDate) return { registrationStart: '', registrationDeadline: '' };
  const start = new Date(`${eventDate}T09:00:00`);
  const opens = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
  const closes = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const localValue = (date) => {
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
  };
  return { registrationStart: localValue(opens), registrationDeadline: localValue(closes) };
};

const toNairobiInput = (value) => value
  ? new Date(new Date(value).getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  : '';

export const EventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [eventDaysMap, setEventDaysMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEventForDay, setSelectedEventForDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const [eventForm, setEventForm] = useState({
    name: 'National Training Week 2026',
    theme: 'Artificial Intelligence for National Transformation',
    year: 2026,
    startDate: '2026-09-14',
    startTime: '09:00',
    endDate: '2026-09-19',
    registrationStart: '2026-08-01T09:00',
    registrationDeadline: '2026-09-13T09:00',
    description: '',
    status: 'registration_open',
    isCurrent: true,
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
    if (!window.confirm('Are you sure you want to delete this event edition?')) return;
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
    if (!window.confirm('Delete this event day?')) return;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Events & Event Days Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage annual National Training Week editions (2026+) and create/edit themed Event Days for each edition.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            const nextYear = new Date().getFullYear() + 1;
            setEventForm({
              name: `National Training Week ${nextYear}`,
              theme: '',
              year: nextYear,
              startDate: '',
              startTime: '09:00',
              endDate: '',
              registrationStart: '',
              registrationDeadline: '',
              description: '',
              status: 'registration_scheduled',
              isCurrent: false,
            });
            setShowEventModal(true);
          }}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
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
            <div key={ev._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-emerald-100 text-[#1a6b3c] rounded-md">
                      Year {ev.year}
                    </span>
                      <span className="text-xs font-bold uppercase text-slate-500">{ev.status.replace(/_/g, ' ')}</span>
                      {ev.isCurrent && <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#1a6b3c] text-white">Current public edition</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{ev.name}</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">Theme: {ev.theme}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddDay(ev)}
                    className="px-3 py-1.5 bg-[#155289] hover:bg-[#11426e] text-white font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Event Day</span>
                  </button>
                  <button
                    onClick={() => handleEditEvent(ev)}
                    className="p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50"
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
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration Opens</label>
                  <input type="datetime-local" value={eventForm.registrationStart} onChange={(e) => setEventForm({ ...eventForm, registrationStart: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" required />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Registration Deadline</label>
                  <input type="datetime-local" value={eventForm.registrationDeadline} onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" required />
                </div>
                <p className="sm:col-span-2 text-[11px] leading-5 text-slate-500">These values are created automatically from the event start date. You can extend or shorten the window at any time.</p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Theme</label>
                <input
                  type="text"
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
                    value={eventForm.year}
                    onChange={(e) => setEventForm({ ...eventForm, year: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => {
                      const defaults = registrationDefaults(e.target.value);
                      setEventForm({ ...eventForm, startDate: e.target.value, ...(!editingEvent ? defaults : {}) });
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Event Starts</label>
                  <input type="time" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-300" required />
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
                  <option value="registration_scheduled">Registration Scheduled</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="registration_closed">Registration Closed</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
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
