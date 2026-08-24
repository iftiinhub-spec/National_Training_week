import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function AdminProgramFilters({ value, onChange, includeSession = true, includeStatus = false, statusOptions = [], includeLevel = false, includeLanguage = false, includeSearch = false, searchPlaceholder = 'Search', className = '' }) {
  const [events, setEvents] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [eventDays, setEventDays] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/admin/events?limit=100'), api.get('/admin/trainings?limit=100')]).then(([eventResponse, trainingResponse]) => {
      setEvents(eventResponse.data || []);
      setTrainings(trainingResponse.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!value.event) { setEventDays([]); return; }
    api.get(`/admin/events/${value.event}/days`).then((response) => setEventDays(response.data?.days || [])).catch(() => setEventDays([]));
  }, [value.event]);

  const eventTrainings = useMemo(() => value.event ? trainings.filter((item) => String(item.event?._id || item.event) === value.event) : trainings, [trainings, value.event]);
  const days = useMemo(() => [...eventDays].sort((a, b) => a.dayNumber - b.dayNumber), [eventDays]);
  const sessions = useMemo(() => value.eventDay ? eventTrainings.filter((item) => String(item.eventDay?._id || item.eventDay) === value.eventDay) : eventTrainings, [eventTrainings, value.eventDay]);
  const set = (updates) => onChange({ ...value, ...updates });
  const selectClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15';

  const fieldCount = 2 + (includeSession ? 1 : 0) + (includeStatus ? 1 : 0) + (includeLevel ? 1 : 0) + (includeLanguage ? 1 : 0) + (includeSearch ? 1 : 0);
  const gridClass = fieldCount >= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : fieldCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}><div className={`grid gap-3 ${gridClass}`}>
    <label className="text-xs font-bold uppercase text-slate-600">Event<select value={value.event || ''} onChange={(event) => set({ event: event.target.value, eventDay: '', training: '' })} className={`${selectClass} mt-1`}><option value="">All events</option>{events.map((item) => <option key={item._id} value={item._id}>{item.name}{item.year ? ` (${item.year})` : ''}</option>)}</select></label>
    <label className="text-xs font-bold uppercase text-slate-600">Event day<select value={value.eventDay || ''} onChange={(event) => set({ eventDay: event.target.value, training: '' })} className={`${selectClass} mt-1`} disabled={!value.event}><option value="">All days</option>{days.map((item) => <option key={item._id} value={item._id}>Day {item.dayNumber}: {item.theme}</option>)}</select></label>
    {includeSession && <label className="text-xs font-bold uppercase text-slate-600">Training session<select value={value.training || ''} onChange={(event) => set({ training: event.target.value })} className={`${selectClass} mt-1`}><option value="">All sessions</option>{sessions.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>}
    {includeStatus && <label className="text-xs font-bold uppercase text-slate-600">Status<select value={value.status || ''} onChange={(event) => set({ status: event.target.value })} className={`${selectClass} mt-1`}><option value="">All statuses</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
    {includeLevel && <label className="text-xs font-bold uppercase text-slate-600">Level<select value={value.level || ''} onChange={(event) => set({ level: event.target.value })} className={`${selectClass} mt-1`}><option value="">All levels</option><option value="general">General</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>}
    {includeLanguage && <label className="text-xs font-bold uppercase text-slate-600">Language<select value={value.language || ''} onChange={(event) => set({ language: event.target.value })} className={`${selectClass} mt-1`}><option value="">All languages</option><option value="Somali">Somali</option><option value="English">English</option></select></label>}
    {includeSearch && <label className="text-xs font-bold uppercase text-slate-600">Search<span className="relative mt-1 block"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={value.search || ''} onChange={(event) => set({ search: event.target.value })} placeholder={searchPlaceholder} className={`${selectClass} pl-10 font-normal`} /></span></label>}
  </div></div>;
}
