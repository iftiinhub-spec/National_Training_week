import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

export const Program = () => {
  const [eventData, setEventData]     = useState(null);
  const [programDays, setProgramDays] = useState([]);
  const [activeDay, setActiveDay]     = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/public/program')
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
  }, []);

  const currentDay = programDays.find((p) => p.day._id === activeDay) || programDays[0];

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    /* ── Full dark background ───────────────────── */
    <div style={{ background: '#0a1628', minHeight: '100vh' }}>

      {/* ── Page Hero ───────────────────────────── */}
      <section
        className="relative py-20 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#0d3d22 0%,#1a6b3c 50%,#155289 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06] bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">
            Official Event Schedule
          </p>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            National Training Week 2026
          </h1>
          <p className="text-emerald-100 text-sm">
            Theme:{' '}
            <span className="text-white font-semibold">
              {eventData?.theme || 'Artificial Intelligence for National Transformation'}
            </span>
          </p>
          <p className="text-slate-300 text-xs mt-2">
            {eventData?.startDate
              ? new Date(eventData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
              : 'Sept 14'}{' '}
            –{' '}
            {eventData?.endDate
              ? new Date(eventData.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : 'Sept 19, 2026'}{' '}
            · 6 Days · Online
          </p>
        </div>
      </section>

      {/* ── Day Tab Row ─────────────────────────── */}
      {!loading && programDays.length > 0 && (
        <div style={{ background: '#0f1e35', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex overflow-x-auto scrollbar-none gap-2 py-4">
              {programDays.map((p) => {
                const isActive = p.day._id === activeDay;
                return (
                  <button
                    key={p.day._id}
                    onClick={() => setActiveDay(p.day._id)}
                    className="shrink-0 px-6 py-3 rounded-xl text-left transition-all font-bold text-sm border"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg,#1a6b3c,#155289)'
                        : 'rgba(255,255,255,0.04)',
                      borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#fff' : '#94a3b8',
                    }}
                  >
                    <span
                      className="block text-[10px] font-black uppercase tracking-widest mb-0.5"
                      style={{ color: isActive ? '#6ee7b7' : '#64748b' }}
                    >
                      Day {p.day.dayNumber}
                      {p.day.date ? ` · ${fmtDate(p.day.date)}` : ''}
                    </span>
                    <span className="block font-black truncate max-w-[160px] text-sm">
                      {p.day.theme}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sessions Grid ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        {loading ? (
          <LoadingSpinner label="Loading program schedule..." />
        ) : !currentDay ? (
          <div className="text-center py-24 text-slate-500">
            Program schedule will be published soon.
          </div>
        ) : currentDay.sessions?.length === 0 ? (
          <div
            className="text-center py-24 rounded-2xl border"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}
          >
            No sessions scheduled for this day yet.
          </div>
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

/* ── Session Card (matches the dark image design) ── */
const SessionCard = ({ session: s, dayNumber }) => {
  const statusBg = {
    registration_open:   '#1a6b3c',
    ongoing:             '#155289',
    published:           '#155289',
    completed:           '#334155',
    cancelled:           '#9f1239',
    draft:               '#78350f',
    registration_closed: '#7c3aed',
  }[s.status] || '#334155';

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#111c2e',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top accent line */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg,#1a6b3c,#155289)' }}
      />

      {/* Card Body */}
      <div className="flex-1 p-6 space-y-4">

        {/* Row 1: Day badge + Time */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded"
            style={{ background: 'rgba(26,107,60,0.25)', color: '#6ee7b7', border: '1px solid rgba(26,107,60,0.4)' }}
          >
            Day {dayNumber} Session
          </span>
          {(s.startTime || s.endTime) && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#94a3b8' }}>
              <ClockIcon className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
              {s.startTime} – {s.endTime}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-black leading-snug text-white line-clamp-2">
          {s.title}
        </h3>

        {/* Trainer */}
        {s.trainer && (
          <div className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
            <UserIcon className="w-4 h-4 shrink-0" style={{ color: '#6ee7b7' }} />
            <span className="text-sm font-medium truncate">
              {s.trainer.title ? `${s.trainer.title} ` : ''}{s.trainer.name}
            </span>
          </div>
        )}

        {/* Tags: audience + level */}
        <div className="flex flex-wrap gap-2">
          {s.audience && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {s.audience}
            </span>
          )}
          {s.level && s.level !== 'general' && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full capitalize"
              style={{ background: 'rgba(21,82,137,0.3)', color: '#93c5fd', border: '1px solid rgba(21,82,137,0.4)' }}
            >
              {s.level}
            </span>
          )}
          {s.category?.name && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(26,107,60,0.2)', color: '#6ee7b7', border: '1px solid rgba(26,107,60,0.3)' }}
            >
              {s.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Action buttons */}
      <div className="px-6 py-4 flex items-center gap-3">
        <Link
          to={`/trainings/${s._id}`}
          className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          View Details
        </Link>
        <Link
          to={`/trainings/${s._id}`}
          className="flex-1 text-center py-2.5 rounded-xl text-sm font-black transition-all"
          style={{
            background: 'linear-gradient(135deg,#1a6b3c,#0e9f6e)',
            color: '#fff',
            boxShadow: '0 0 16px rgba(26,107,60,0.4)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#238c50,#16b87e)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#1a6b3c,#0e9f6e)'; }}
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default Program;
