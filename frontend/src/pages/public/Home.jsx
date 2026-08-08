import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

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
    <span className="text-[10px] uppercase tracking-widest text-white mt-1 font-bold">{label}</span>
  </div>
);

/* ── Section heading ────────────────────────────── */
const SectionTitle = ({ tag, title, subtitle }) => (
  <div className="text-center mb-12" data-section-title>
    {tag && (
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1da156] mb-2">{tag}</p>
    )}
    <h2 className="text-3xl sm:text-4xl font-black text-black relative inline-block">
      {title}
      <span className="block h-1 w-16 bg-[#1da156] mx-auto mt-3 rounded-full" />
    </h2>
    {subtitle && (
      <p className="mt-4 text-black/70 text-sm max-w-xl mx-auto leading-relaxed">{subtitle}</p>
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
  { Icon: AcademicCapIcon,    label: 'University Students & Scholars', desc: 'Gain cutting-edge skills relevant to academic research and industry.' },
  { Icon: BuildingLibraryIcon, label: 'High-School Graduates',          desc: 'Prepare for university and discover future-proof tech careers.' },
  { Icon: CodeBracketIcon,    label: 'Developers & IT Professionals',   desc: 'Master AI implementation, APIs, ML algorithms, and practical tools.' },
  { Icon: RocketLaunchIcon,   label: 'Entrepreneurs & Professionals',   desc: 'Leverage AI to scale business operations and public services.' },
];

/* ══════════════════════════════════════════════════ */
export const Home = () => {
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const countdown = useCountdown('2026-09-14T08:00:00');

  useEffect(() => {
    api.get('/public/trainers')
      .then(r => { if (r.success) setTrainers(r.data.trainers || []); })
      .catch(() => {})
      .finally(() => setLoadingTrainers(false));
  }, []);

  return (
    <div className="bg-white min-h-screen">

      {/* ══ HERO ════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col"
        style={{ backgroundColor: '#1da156' }}
      >
        {/* Hero background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero.png')" }}
        />

        {/* Dark green overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Main hero content — centred */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-32 relative z-10 bg-gradient-to-r from-black/40 via-gray/10 to-black/40" >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
            <SparklesIcon className="w-3.5 h-3.5 text-white" /> Annual Flagship Program — 2026
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight max-w-4xl">
            National<br />
            <span className="text-white">Training Week</span>
          </h1>

          <p className="mt-6 text-white text-lg sm:text-xl font-semibold max-w-2xl">
            Theme: <span className="text-white font-bold">"Artificial Intelligence for National Transformation"</span>
          </p>

          <p className="mt-3 text-white/90 text-sm sm:text-base max-w-xl leading-relaxed">
            Six intensive days of high-impact online technical training sessions
            led by Somalia's top experts — free, certified, and open to all.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/trainings"
              className="px-8 py-3.5 rounded-xl bg-black hover:bg-white hover:text-black text-white font-bold text-sm shadow-md transition-all border border-black/40"
            >
              Browse All Trainings
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl bg-white text-[#1da156] hover:bg-black hover:text-white font-bold text-sm shadow-md transition-all"
            >
              Register Free →
            </Link>
          </div>

          {/* Countdown */}
          <div className="mt-12">
            <p className="text-xs uppercase tracking-widest text-white font-bold mb-4">
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

        {/* About bar — anchored to hero bottom */}
        <div className="relative z-10 bg-white border-t border-black/10 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-black text-[#1da156] mb-1">About The Event</h3>
              <p className="text-xs text-black/70 leading-relaxed">
                National Training Week (NTW) bridges academic theory
                and real-world technology skills — empowering students, professionals,
                and graduates across Somalia.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-[#1da156]" /> When
              </h3>
              <p className="text-sm font-bold text-black">September 14 – 19, 2026</p>
              <p className="text-xs text-black/60">Monday to Saturday · 6 Full Days</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <GlobeAltIcon className="w-4 h-4 text-[#1da156]" /> Where
              </h3>
              <p className="text-sm font-bold text-black">100% Online</p>
              <p className="text-xs text-black/60">Zoom · Google Meet · Microsoft Teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SCHEDULE / 6 DAYS ════════════════════════ */}
      <section className="bg-white py-20 border-y border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Program Structure"
            title="6 Days Of Focused Innovation"
            subtitle="Each day focuses on a vital sector where Artificial Intelligence drives Somalia’s national transformation."
          />
          <ScheduleTabs />
          <div className="mt-12 text-center">
            <Link
              to="/program"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#1da156] text-[#1da156] hover:bg-[#1da156] hover:text-white font-bold rounded-xl text-sm transition-all"
            >
              Explore Complete Program →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FEATURED TRAINERS & KEYNOTES ════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="World-Class Faculty"
            title="Featured Trainers & Keynote Speakers"
            subtitle="Meet the distinguished university professors, industry engineers, and technical experts leading our 2026 sessions."
          />

          {loadingTrainers ? (
            <LoadingSpinner label="Loading faculty profiles..." />
          ) : trainers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {trainers.slice(0, 6).map((tr) => (
                <div
                  key={tr._id}
                  className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-black/10 flex flex-col"
                >
                  {/* Portrait Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                    {tr.photo ? (
                      <img
                        src={`/${tr.photo}`}
                        alt={tr.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1da156]/10">
                        <div className="w-24 h-24 rounded-full bg-[#1da156] text-white flex items-center justify-center font-black text-4xl">
                          {tr.name?.charAt(0)}
                        </div>
                      </div>
                    )}

                    {/* Hover bio overlay */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <p className="text-white text-xs leading-relaxed line-clamp-5">
                        {tr.biography}
                      </p>
                    </div>

                    {/* Expertise badge top-left */}
                    {tr.expertise?.[0] && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#1da156] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {tr.expertise[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <div>
                      <h3 className="font-extrabold text-black text-base leading-snug group-hover:text-[#1da156] transition-colors">
                        {tr.name}
                      </h3>
                      {tr.organization && (
                        <p className="text-xs text-[#1da156] font-bold mt-0.5">{tr.organization}</p>
                      )}
                    </div>

                    {/* Expertise tags row */}
                    {tr.expertise?.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-black/10">
                        {tr.expertise.slice(1).map((exp, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-black/5 text-black px-2.5 py-1 rounded-md border border-black/10"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-black/60 border border-dashed border-black/20 rounded-2xl">
              Faculty profiles will be published soon!
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/trainings"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1da156] hover:bg-black text-white font-bold rounded-xl text-sm shadow transition-colors"
            >
              Browse All Sessions →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ WHO SHOULD ATTEND ════════════════════════ */}
      <section className="py-20 bg-white border-t border-black/10">
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
                className="group text-center p-8 border border-black/10 rounded-2xl hover:border-[#1da156] hover:shadow-lg transition-all bg-white"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#1da156]/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1da156] transition-colors">
                  <a.Icon className="w-7 h-7 text-[#1da156] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-black text-sm mb-2 group-hover:text-[#1da156] transition-colors">{a.label}</h3>
                <p className="text-xs text-black/70 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CERTIFICATE CTA STRIP ═══════════════════ */}
      <section className="py-20 bg-[#1da156] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-white/15 border border-white/20 px-4 py-1.5 rounded-full mb-4 text-white">
              <ShieldCheckIcon className="w-4 h-4" /> Official Certification
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
              Earn Verified Certificates of Completion
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              Participants who attend live sessions receive an official Certificate with a unique
              verification code and QR identifier — recognised by employers across Somalia.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              to="/verify-certificate"
              className="px-7 py-3.5 bg-white text-[#1da156] font-bold rounded-xl text-sm hover:bg-black hover:text-white transition-colors shadow text-center"
            >
              Verify a Certificate
            </Link>
            <Link
              to="/recordings"
              className="px-7 py-3.5 bg-black hover:bg-white hover:text-black text-white font-bold rounded-xl text-sm border border-black/20 transition-colors text-center"
            >
              Watch Recordings
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

/* ── Training Tile ── */
const TrainingTile = ({ training }) => {
  const photoUrl = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `/${p.replace(/^\//,'')}`;
  };

  return (
    <Link to={`/trainings/${training._id}`} className="group block relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all card-hover-lift bg-white border border-black/10">
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-black">
        {photoUrl(training.coverImage) ? (
          <img
            src={photoUrl(training.coverImage)}
            alt={training.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <img src="/logo.png" alt="National Training Week" className="h-24 w-auto object-contain opacity-80" />
          </div>
        )}
        {/* Hover overlay with info */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
          <p className="text-white text-xs leading-relaxed line-clamp-3 font-medium">
            {training.description || 'Click to view full session details and register.'}
          </p>
        </div>

        {/* Status badge */}
        <span className="absolute top-3 left-3 bg-[#1da156] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow">
          {training.status?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Card info */}
      <div className="p-5 bg-white">
        <h3 className="font-black text-black text-base leading-snug mb-1 group-hover:text-[#1da156] transition-colors line-clamp-2">
          {training.title}
        </h3>
        <p className="text-xs text-[#1da156] font-bold mb-3">
          {training.trainer ? `${training.trainer.title || ''} ${training.trainer.name}`.trim() : 'Expert Trainer'}
        </p>
        <div className="flex items-center justify-between text-[11px] text-black/70 font-medium border-t border-black/10 pt-3">
          <span>
            {training.date ? new Date(training.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </span>
          <span>{training.startTime} – {training.endTime}</span>
        </div>
      </div>
    </Link>
  );
};

/* ── Schedule Tabs ── */
const DATES = ['Sep 14', 'Sep 15', 'Sep 16', 'Sep 17', 'Sep 18', 'Sep 19'];

const ScheduleTabs = () => {
  const [active, setActive]   = useState(0);
  const [program, setProgram] = useState([]);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    api.get('/public/program')
      .then(r => { if (r.success && r.data) setProgram(r.data.program || []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const currentDay = program[active];
  const sessions   = currentDay?.sessions || [];

  return (
    <div>
      {/* ── Day Tab Row ── */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12 py-2">
        {DAYS.map((day, i) => {
          const isActive = active === i;
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl text-left transition-all duration-300 border whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1da156] border-[#1da156] shadow-lg shadow-[#1da156]/20 text-white scale-105'
                  : 'bg-white border-black/10 text-black hover:border-[#1da156] hover:shadow-md'
              }`}
            >
              <span className={`block text-[11px] font-bold tracking-wider mb-1 ${
                isActive ? 'text-white/90' : 'text-black/60'
              }`}>
                Day {i + 1} • {DATES[i]}
              </span>
              <span className={`block text-xs sm:text-sm font-extrabold ${
                isActive ? 'text-white' : 'text-black'
              }`}>
                {day.theme}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Session Cards ── */}
      {!loaded ? (
        <div className="text-center py-16 text-black/60 text-sm">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        /* Fallback */
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-[#1da156]" />
          <div className="p-10 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 bg-white text-[#1da156] border border-[#1da156]">
              {DAYS[active].day}
            </span>
            <h3 className="text-2xl font-black text-black mb-3">{DAYS[active].theme}</h3>
            <p className="text-black/70 text-sm leading-relaxed">{DAYS[active].desc}</p>
            <Link to="/program" className="inline-flex items-center gap-1 mt-6 text-xs font-bold text-[#1da156] hover:underline">
              View Full Day Schedule →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map(s => (
            <HomeSessionCard key={s._id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Home Session Card ── */
const HomeSessionCard = ({ session: s }) => {
  const photoUrl = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `/${p.replace(/^\//, '')}`;
  };

  const trainerLabel = s.trainer
    ? (s.trainer.name?.startsWith(s.trainer.title)
        ? s.trainer.name
        : `${s.trainer.title || ''} ${s.trainer.name}`.trim())
    : 'Expert Trainer';

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
        {(s.startTime || s.endTime) && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-black text-white text-[10px] font-medium px-2 py-1 rounded-full">
            <ClockIcon className="w-3 h-3" />
            {s.startTime}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 bg-white">
        <h3 className="font-black text-black text-base leading-snug mb-1 group-hover:text-[#1da156] transition-colors line-clamp-2">
          {s.title}
        </h3>
        <p className="text-xs text-[#1da156] font-bold mb-3">{trainerLabel}</p>
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

export default Home;
