import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ClockIcon } from '@heroicons/react/24/outline';
import PublicPageHeader from '../../components/common/PublicPageHeader';
import PublicEmptyState from '../../components/common/PublicEmptyState';

export const Program = () => {
  const [eventData, setEventData]     = useState(null);
  const [programDays, setProgramDays] = useState([]);
  const [activeDay, setActiveDay]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [events, setEvents]           = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  useEffect(() => {
    api.get('/public/events').then((res) => {
      if (res.success) setEvents(res.data.events || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/public/program${selectedEvent ? `?eventId=${selectedEvent}` : ''}`)
      .then((res) => {
        if (res.success && res.data) {
          setEventData(res.data.event);
          const days = res.data.program || [];
          setProgramDays(days);
          if (days.length > 0) setActiveDay(days[0].day._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  const currentDay = programDays.find((p) => p.day._id === activeDay) || programDays[0];

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ── Page Hero ─────────────────────────────── */}
      <PublicPageHeader eyebrow="Official event schedule" title={eventData?.name || 'Program schedule'} description={eventData?.theme || 'The next edition schedule will be published here when it is ready.'}>
          {eventData && <p className="mt-3 text-xs font-semibold text-white/75">
            {eventData?.startDate
              ? new Date(eventData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
              : 'Dates'}{' '}–{' '}
            {eventData?.endDate
              ? new Date(eventData.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : 'to be announced'}{' '}
            · {programDays.length || 'Program'} Days · Online
          </p>}
          {events.length > 1 && (
            <label className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 px-4 py-2">
              <span className="text-xs font-bold">View edition</span>
              <select aria-label="Select event edition" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="bg-white text-black rounded-lg px-3 py-1.5 text-sm font-semibold">
                <option value="">Current edition</option>
                {events.map((event) => <option key={event._id} value={event._id}>{event.year} — {event.theme}</option>)}
              </select>
            </label>
          )}
      </PublicPageHeader>

      {/* ── Day Tab Row ──────────────────────────── */}
      {!loading && programDays.length > 0 && (
        <div className="bg-white border-b border-black/10 sticky top-[88px] z-40 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 py-4">
              {programDays.map((p) => {
                const isActive = p.day._id === activeDay;
                return (
                  <button
                    key={p.day._id}
                    onClick={() => setActiveDay(p.day._id)}
                    className={`shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl text-left transition-all duration-300 border whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#1da156] border-[#1da156] shadow-lg shadow-[#1da156]/20 text-white scale-105'
                        : 'bg-white border-black/10 text-black hover:border-[#1da156] hover:shadow-md'
                    }`}
                  >
                    <span className={`block text-[11px] font-bold tracking-wider mb-1 ${
                      isActive ? 'text-white/90' : 'text-black/60'
                    }`}>
                      Day {p.day.dayNumber}{p.day.date ? ` • ${fmtDate(p.day.date)}` : ''}
                    </span>
                    <span className={`block text-xs sm:text-sm font-extrabold ${
                      isActive ? 'text-white' : 'text-black'
                    }`}>
                      {p.day.theme}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sessions Grid ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        {loading ? (
          <LoadingSpinner label="Loading program schedule..." />
        ) : !currentDay ? (
          <PublicEmptyState title="Program coming soon" description="No public event schedule is available yet. Program days and sessions will appear here after the next edition is published." />
        ) : currentDay.sessions?.length === 0 ? (
          <PublicEmptyState title="Sessions coming soon" description={`The schedule for Day ${currentDay.day.dayNumber} has not been published yet.`} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDay.sessions.map((s) => (
              <SessionCard
                key={s._id}
                session={s}
                dayNumber={currentDay.day.dayNumber}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Session Card — matches TrainingTile / HomeSessionCard style ── */
const SessionCard = ({ session: s, dayNumber }) => {
  const photoUrl = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `/${p.replace(/^\//, '')}`;
  };

  const trainerLabel = s.trainer
    ? (s.trainer.name?.startsWith(s.trainer.title)
        ? s.trainer.name
        : `${s.trainer.title || ''} ${s.trainer.name}`.trim())
    : null;

  return (
    <Link
      to={`/trainings/${s._id}`}
      className="group block relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all card-hover-lift bg-white border border-black/10"
    >
      {/* Cover image / logo fallback */}
      <div className="relative h-48 overflow-hidden bg-black">
        {photoUrl(s.coverImage) ? (
          <img
            src={photoUrl(s.coverImage)}
            alt={s.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <img src="/logo.png" alt="National Training Week" className="h-20 w-auto object-contain opacity-80" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
          <p className="text-white text-xs leading-relaxed line-clamp-3 font-medium">
            {s.description || 'Click to view full session details and register.'}
          </p>
        </div>

        {/* Status badge */}
        <span className="absolute top-3 left-3 bg-[#1da156] text-white text-[10px] font-bold px-2.5 py-1 rounded-full capitalize shadow">
          {s.status?.replace(/_/g, ' ')}
        </span>

        {/* Time badge */}
        {s.startTime && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-black text-white text-[10px] font-medium px-2 py-1 rounded-full">
            <ClockIcon className="w-3 h-3" />
            {s.startTime}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 bg-white">
        <p className="text-[10px] font-bold text-[#1da156] uppercase tracking-wide mb-1">
          Day {dayNumber} Session
        </p>
        <h3 className="font-black text-black text-base leading-snug mb-1 group-hover:text-[#1da156] transition-colors line-clamp-2">
          {s.title}
        </h3>
        {trainerLabel && (
          <p className="text-xs text-[#1da156] font-bold mb-3">{trainerLabel}</p>
        )}
        <div className="flex items-center justify-between text-[11px] text-black/70 font-medium border-t border-black/10 pt-3">
          <span>
            {s.date
              ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
          <span>{s.startTime} – {s.endTime}</span>
        </div>
      </div>
    </Link>
  );
};

export default Program;
