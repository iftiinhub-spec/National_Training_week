import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, FunnelIcon,
} from '@heroicons/react/24/outline';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MyMaterials = () => {
  // Arriving from a session card on My Trainings scopes the page to that one session.
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionFilter = searchParams.get('session');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get('/participant/materials');
        if (res.success) setMaterials(res.data?.materials || []);
      } catch (err) {
        toast.error('Failed to load learning materials.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // The endpoint returns every material at once, so the options are read straight off the loaded
  // set. That is what keeps them accurate here: an option exists only because a material has it,
  // so no choice can produce an empty page.
  const filterOptions = useMemo(() => {
    const events = new Map();
    const days = new Map();
    materials.forEach((item) => {
      const event = item.training?.event;
      const day = item.training?.eventDay;
      if (event?._id) events.set(String(event._id), event);
      // The day is keyed with the edition it belongs to, so the day list can narrow to the chosen
      // event and never offer a day from a different edition.
      if (day?._id) days.set(String(day._id), { ...day, event: event?._id || null });
    });
    return {
      events: [...events.values()].sort((a, b) => (b.year || 0) - (a.year || 0)),
      days: [...days.values()].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)),
    };
  }, [materials]);

  const dayOptions = useMemo(() => (
    selectedEvent
      ? filterOptions.days.filter((day) => String(day.event) === selectedEvent)
      : filterOptions.days
  ), [filterOptions.days, selectedEvent]);

  const handleEventChange = (value) => {
    setSelectedEvent(value);
    // A day carried over from the previous edition would contradict the new one and match nothing.
    if (value && !filterOptions.days.some((day) => String(day._id) === selectedDay && String(day.event) === value)) {
      setSelectedDay('');
    }
  };

  const filtersActive = Boolean(selectedEvent || selectedDay);

  const visible = useMemo(() => {
    let scoped = sessionFilter
      ? materials.filter((item) => String(item.training?._id) === sessionFilter)
      : materials;
    if (selectedEvent) scoped = scoped.filter((item) => String(item.training?.event?._id) === selectedEvent);
    if (selectedDay) scoped = scoped.filter((item) => String(item.training?.eventDay?._id) === selectedDay);
    const term = search.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((item) => (
      (item.title || '').toLowerCase().includes(term)
      || (item.description || '').toLowerCase().includes(term)
      || (item.training?.title || '').toLowerCase().includes(term)
    ));
  }, [materials, search, sessionFilter, selectedEvent, selectedDay]);

  // Grouped by session so a participant reads down their sessions, not a flat pile of files.
  const grouped = useMemo(() => {
    const map = new Map();
    visible.forEach((item) => {
      const key = String(item.training?._id || 'unknown');
      if (!map.has(key)) map.set(key, { training: item.training, items: [] });
      map.get(key).items.push(item);
    });
    return [...map.values()];
  }, [visible]);

  const sessionTitle = useMemo(
    () => materials.find((item) => String(item.training?._id) === sessionFilter)?.training?.title,
    [materials, sessionFilter],
  );

  // The file is not publicly served, so the download must carry the auth header.
  const handleDownload = async (material) => {
    setDownloading(material._id);
    try {
      const response = await fetch(`/api/participant/materials/${material._id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ntw_token')}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file?.originalName || material.title;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download this file.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading learning materials..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Learning Materials</h1>
        <p className="mt-1 text-xs text-slate-500">
          Slides, notes and documents shared by the trainers of every session you joined.
        </p>
      </div>

      {materials.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:min-w-[220px] sm:max-w-xs sm:flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials or sessions..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium"
            />
          </div>

          {/* On phones this keeps the two controls and Clear together on one line under the search
              box, so the bar is two rows. From sm up it dissolves into the parent flex row. */}
          <div className="flex w-full flex-wrap items-center gap-3 sm:contents">
          {filterOptions.events.length > 1 && (
            <select
              value={selectedEvent}
              onChange={(e) => handleEventChange(e.target.value)}
              aria-label="Filter by event"
              className="min-h-10 min-w-0 flex-[3] basis-32 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40 sm:w-48 sm:flex-none sm:basis-auto lg:w-56"
            >
              <option value="">All events</option>
              {filterOptions.events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name}{event.year ? ` (${event.year})` : ''}
                </option>
              ))}
            </select>
          )}

          {filterOptions.days.length > 1 && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              aria-label="Filter by day"
              className="min-h-10 min-w-0 flex-[2] basis-28 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40 sm:w-44 sm:flex-none sm:basis-auto lg:w-52"
            >
              <option value="">All days</option>
              {dayOptions.map((day) => (
                <option key={day._id} value={day._id}>
                  Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}
                </option>
              ))}
            </select>
          )}

          {(filtersActive || search) && (
            <button
              type="button"
              onClick={() => { setSelectedEvent(''); setSelectedDay(''); setSearch(''); }}
              className="min-h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}

          <span className="ml-auto hidden shrink-0 text-xs font-medium text-slate-500 sm:inline">
            {visible.length} of {materials.length} materials
          </span>
          </div>
        </div>
      )}

      {sessionFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-bold text-[#1a6b3c]">
            Showing materials for {sessionTitle || 'this session'} only.
          </p>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="rounded-lg border border-[#1a6b3c]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#1a6b3c] hover:bg-emerald-100"
          >
            Show all materials
          </button>
        </div>
      )}

      {!materials.length ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No learning materials yet"
          message="When a trainer shares slides or documents for a session you joined, they appear here."
        />
      ) : !grouped.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          {search
            ? `No material matches "${search}".`
            : filtersActive
              ? 'No material was shared for the selected event or day. Clear the filters to see them all.'
              : 'No materials have been shared for this session.'}
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ training, items }) => (
            <section key={String(training?._id || 'unknown')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">{training?.title || 'Session'}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {training?.eventDay?.dayNumber ? `Day ${training.eventDay.dayNumber} · ` : ''}
                  {training?.date ? new Date(training.date).toLocaleDateString() : ''}
                </p>
              </div>

              <ul className="mt-3 space-y-2">
                {items.map((material) => (
                  <li key={material._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{material.title}</p>
                      {material.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{material.description}</p>}
                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        {material.trainer?.name ? `Shared by ${material.trainer.name}` : 'Shared by the trainer'}
                        {material.file?.size ? ` · ${formatSize(material.file.size)}` : ''}
                      </p>
                    </div>

                    {material.file?.path ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(material)}
                        disabled={downloading === material._id}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1a6b3c] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        {downloading === material._id ? 'Downloading...' : 'Download'}
                      </button>
                    ) : (
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-[#1a6b3c] hover:text-[#1a6b3c]"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        Open link
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMaterials;
