import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ── Countdown hook ──────────────────────────────── */
const useCountdown = (target) => {
  const calc = () => {
    const diff = new Date(target) - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return tick;
};

/* ── Animated number ─────────────────────────────── */
const Digit = ({ v, label }) => (
  <div className="flex flex-col items-center bg-white/10 border border-white/20 rounded-xl px-5 py-4 min-w-[72px] backdrop-blur-sm">
    <span className="text-4xl sm:text-5xl font-black text-white tabular-nums leading-none">
      {String(v).padStart(2, '0')}
    </span>
    <span className="text-[10px] uppercase tracking-widest text-emerald-300 mt-1 font-bold">{label}</span>
  </div>
);

/* ── Section heading (TheEvent style) ────────────── */
const SectionTitle = ({ tag, title, subtitle }) => (
  <div className="text-center mb-12" data-section-title>
    {tag && (
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1a6b3c] mb-2">{tag}</p>
    )}
    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 relative inline-block">
      {title}
      <span className="block h-1 w-16 bg-[#1a6b3c] mx-auto mt-3 rounded-full" />
    </h2>
    {subtitle && (
      <p className="mt-4 text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const DAYS = [
  { day: 'Day 1', theme: 'AI Literacy Day', desc: 'Foundations of Artificial Intelligence, ethics, and essential digital readiness for every participant.' },
  { day: 'Day 2', theme: 'AI for Education', desc: 'Transforming teaching, learning, research, and personalised study tools across all levels.' },
  { day: 'Day 3', theme: 'AI for Business', desc: 'Automating business operations, empowering startups, and driving economic productivity.' },
  { day: 'Day 4', theme: 'AI for Health & Community', desc: 'Healthcare diagnostics, public service optimisation, and measurable social impact.' },
  { day: 'Day 5', theme: 'AI for Graduates', desc: 'Career pathing, technical portfolio building, and job-market readiness for fresh graduates.' },
  { day: 'Day 6', theme: 'AI & Innovation Day', desc: "Advanced AI research, capstone showcases, and Somalia's national transformation strategy." },
];

const AUDIENCE = [
  { icon: '🎓', label: 'University Students & Scholars', desc: 'Gain cutting-edge skills relevant to academic research and industry.' },
  { icon: '🏫', label: 'High-School Graduates', desc: 'Prepare for university and discover future-proof tech careers.' },
  { icon: '💻', label: 'Developers & IT Professionals', desc: 'Master AI implementation, APIs, ML algorithms, and practical tools.' },
  { icon: '🚀', label: 'Entrepreneurs & Professionals', desc: 'Leverage AI to scale business operations and public services.' },
];

/* ══════════════════════════════════════════════════ */
export const Home = () => {
  const [featuredTrainings, setFeaturedTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown('2026-09-14T08:00:00');

  useEffect(() => {
    api.get('/public/featured-trainings')
      .then(r => { if (r.success) setFeaturedTrainings(r.data.trainings || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #0d3d22 0%, #1a6b3c 45%, #155289 100%)',
        }}
      >
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />

        {/* Pattern dots */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Main hero content — centred */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-32">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            ✦ Annual Flagship Program — 2026
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight max-w-4xl">
            National<br />
            <span className="text-emerald-400">Training Week</span>
          </h1>

          <p className="mt-6 text-emerald-200 text-lg sm:text-xl font-semibold max-w-2xl">
            Theme: <span className="text-white">"Artificial Intelligence for National Transformation"</span>
          </p>

          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Six intensive days of high-impact online technical training sessions
            led by Somalia's top experts — free, certified, and open to all.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/trainings"
              className="px-8 py-3.5 rounded-lg bg-[#1a6b3c] hover:bg-[#238c50] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all border border-emerald-500/40"
            >
              Browse All Trainings
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-lg bg-white text-[#1a6b3c] hover:bg-emerald-50 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Register Free →
            </Link>
          </div>

          {/* Countdown */}
          <div className="mt-12">
            <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold mb-4">
              Event Starts In
            </p>
            <div className="flex items-center gap-3 justify-center">
              <Digit v={countdown.days}    label="Days" />
              <span className="text-3xl font-black text-white/40 mb-4">:</span>
              <Digit v={countdown.hours}   label="Hours" />
              <span className="text-3xl font-black text-white/40 mb-4">:</span>
              <Digit v={countdown.minutes} label="Minutes" />
              <span className="text-3xl font-black text-white/40 mb-4">:</span>
              <Digit v={countdown.seconds} label="Seconds" />
            </div>
          </div>
        </div>

        {/* About bar — anchored to hero bottom (TheEvent style) */}
        <div className="relative z-10 bg-white/95 backdrop-blur-md border-t border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-black text-[#1a6b3c] mb-1">About The Event</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organized by Hormuud University, Mogadishu. NTW bridges academic theory
                and real-world technology skills — empowering students, professionals,
                and graduates across Somalia.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">📅 When</h3>
              <p className="text-sm font-bold text-slate-900">September 14 – 19, 2026</p>
              <p className="text-xs text-slate-500">Monday to Saturday · 6 Full Days</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">🌐 Where</h3>
              <p className="text-sm font-bold text-slate-900">100% Online</p>
              <p className="text-xs text-slate-500">Zoom · Google Meet · Microsoft Teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED TRAININGS ════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Featured Sessions"
            title="Upcoming Training Sessions"
            subtitle="Explore highlighted 2026 sessions with expert trainers — register free and earn verified certificates."
          />

          {loading ? (
            <LoadingSpinner label="Loading sessions..." />
          ) : featuredTrainings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {featuredTrainings.map((t) => (
                <TrainingTile key={t._id} training={t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No featured sessions published yet — check back soon!
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/trainings"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-lg text-sm shadow transition-colors"
            >
              View All Sessions →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SCHEDULE / 6 DAYS ════════════════════════ */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Program Structure"
            title="6 Days of Focused Innovation"
            subtitle="Each day focuses on a vital sector where Artificial Intelligence drives Somalia's national transformation."
          />
          <ScheduleTabs />

          <div className="mt-10 text-center">
            <Link
              to="/program"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-[#1a6b3c] text-[#1a6b3c] hover:bg-[#1a6b3c] hover:text-white font-bold rounded-lg text-sm transition-colors"
            >
              Explore Complete Program →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ WHO SHOULD ATTEND ════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Who Should Attend"
            title="Built for Everyone"
            subtitle="Sessions range from AI literacy to developer deep-dives. No prior experience required."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCE.map((a, i) => (
              <div
                key={i}
                className="group text-center p-8 border border-slate-200 rounded-2xl hover:border-[#1a6b3c] hover:shadow-lg transition-all bg-white"
              >
                <div className="text-4xl mb-4">{a.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-[#1a6b3c] transition-colors">{a.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CERTIFICATE CTA STRIP ═══════════════════ */}
      <section
        className="py-20 text-white"
        style={{ background: 'linear-gradient(135deg, #155289 0%, #1a6b3c 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-white/15 border border-white/20 px-4 py-1.5 rounded-full mb-4 text-emerald-300">
              🏅 Official Certification
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
              Earn Verified Certificates of Completion
            </h2>
            <p className="text-slate-200 text-sm leading-relaxed">
              Participants who attend live sessions receive an official Certificate with a unique
              verification code and QR identifier — recognised by employers across Somalia.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              to="/verify-certificate"
              className="px-7 py-3.5 bg-white text-[#155289] font-bold rounded-lg text-sm hover:bg-slate-100 transition-colors shadow text-center"
            >
              Verify a Certificate
            </Link>
            <Link
              to="/recordings"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm border border-white/20 transition-colors text-center"
            >
              Watch Recordings
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

/* ── Training Tile (TheEvent speaker-card style) ── */
const TrainingTile = ({ training }) => {
  const photoUrl = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `/${p.replace(/^\//,'')}`;
  };
  const statusColor = {
    registration_open: 'bg-emerald-500',
    ongoing: 'bg-blue-500',
    published: 'bg-[#155289]',
    completed: 'bg-slate-400',
    cancelled: 'bg-rose-500',
  }[training.status] || 'bg-slate-500';

  return (
    <Link to={`/trainings/${training._id}`} className="group block relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow bg-slate-900">
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        {photoUrl(training.coverImage) ? (
          <img
            src={photoUrl(training.coverImage)}
            alt={training.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white/30 text-6xl font-black"
            style={{ background: 'linear-gradient(135deg, #0d3d22, #155289)' }}
          >
            NTW
          </div>
        )}
        {/* Hover overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-xs leading-relaxed line-clamp-3">
            {training.description || 'Click to view full session details and register.'}
          </p>
        </div>

        {/* Status badge */}
        <span className={`absolute top-3 left-3 ${statusColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide`}>
          {training.status?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Card info */}
      <div className="p-5 bg-white">
        <h3 className="font-black text-slate-900 text-base leading-snug mb-1 group-hover:text-[#1a6b3c] transition-colors line-clamp-2">
          {training.title}
        </h3>
        <p className="text-xs text-[#155289] font-semibold mb-3">
          {training.trainer ? `${training.trainer.title || ''} ${training.trainer.name}`.trim() : 'Expert Trainer'}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-3">
          <span>
            {training.date ? new Date(training.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </span>
          <span>{training.startTime} – {training.endTime}</span>
        </div>
      </div>
    </Link>
  );
};

/* ── Schedule Tabs ─────────────────────────────── */
const ScheduleTabs = () => {
  const [active, setActive] = useState(0);
  const d = DAYS[active];
  return (
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {DAYS.map((day, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-5 py-2 rounded-full text-xs font-bold border transition-all ${
              active === i
                ? 'bg-[#1a6b3c] text-white border-[#1a6b3c] shadow'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[#1a6b3c] hover:text-[#1a6b3c]'
            }`}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Active day content */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1a6b3c] to-[#155289]" />
        <div className="p-8 text-center">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-[#1a6b3c] text-xs font-black rounded-full mb-4 uppercase tracking-wide">
            {d.day}
          </span>
          <h3 className="text-2xl font-black text-slate-900 mb-3">{d.theme}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{d.desc}</p>
          <Link
            to="/program"
            className="inline-flex items-center gap-1 mt-6 text-xs font-bold text-[#1a6b3c] hover:underline"
          >
            View full day schedule →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
