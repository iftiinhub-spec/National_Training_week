import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { intervalToDuration } from 'date-fns';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCurrentEvent } from '../../context/EventContext';
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/* ── Countdown hook ──────────────────────────────── */
const useCountdown = (target) => {
  const calc = React.useCallback(() => {
    if (!target) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
    const diff = new Date(target) - Date.now();
    if (diff <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
    const duration = intervalToDuration({ start: new Date(), end: new Date(target) });
    return {
      months:  (duration.years || 0) * 12 + (duration.months || 0),
      days:    duration.days || 0,
      hours:   duration.hours || 0,
      minutes: duration.minutes || 0,
      seconds: duration.seconds || 0,
      complete: false,
    };
  }, [target]);
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return tick;
};

/* ── Animated number ─────────────────────────────── */
const Digit = ({ v, label }) => (
  <div className="flex min-w-[52px] flex-col items-center rounded-xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-md sm:min-w-[72px] sm:px-3">
    <span className="text-2xl font-black leading-none tabular-nums text-white sm:text-3xl">
      {String(v).padStart(2, '0')}
    </span>
    <span className="text-[10px] uppercase tracking-widest text-white mt-1 font-bold">{label}</span>
  </div>
);

/* ── Section heading ────────────────────────────── */
const SectionTitle = ({ tag, title, subtitle, light = false }) => (
  <div className="mx-auto mb-12 max-w-3xl text-center" data-section-title>
    {tag && (
      <p className={`mb-4 inline-flex rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.18em] ${light ? 'bg-white/10 text-white' : 'bg-[#1da156]/10 text-[#1da156]'}`}>{tag}</p>
    )}
    <h2 className={`text-3xl font-bold leading-tight tracking-[-.025em] sm:text-4xl lg:text-[2.75rem] ${light ? 'text-white' : 'text-black'}`}>
      {title}
    </h2>
    {subtitle && (
      <p className={`mx-auto mt-4 max-w-2xl text-sm leading-6 ${light ? 'text-white/65' : 'text-black/60'}`}>{subtitle}</p>
    )}
  </div>
);

const AUDIENCE = [
  { Icon: AcademicCapIcon,    label: 'University Students & Scholars', desc: 'Gain cutting-edge skills relevant to academic research and industry.' },
  { Icon: BuildingLibraryIcon, label: 'High-School Graduates',          desc: 'Prepare for university and discover future-proof tech careers.' },
  { Icon: CodeBracketIcon,    label: 'Developers & IT Professionals',   desc: 'Master AI implementation, APIs, ML algorithms, and practical tools.' },
  { Icon: RocketLaunchIcon,   label: 'Entrepreneurs & Professionals',   desc: 'Leverage AI to scale business operations and public services.' },
];

/* ══════════════════════════════════════════════════ */
export const Home = () => {
  const { event, days, sessionCount } = useCurrentEvent();
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const countdownTarget = event?.startDate
    ? `${event.startDate.slice(0, 10)}T${event.startTime || '09:00'}:00`
    : null;
  const countdown = useCountdown(countdownTarget);
  const eventHasEnded = event?.endDate
    ? Date.now() > new Date(`${event.endDate.slice(0, 10)}T23:59:59`).getTime()
    : false;
  const eventDates = event?.startDate && event?.endDate
    ? `${new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : 'Dates to be announced';
  const eventStatus = event?.status?.replace(/_/g, ' ') || 'Program announced';
  const heroImage = '/training-week-default-hero.png';

  useEffect(() => {
    api.get('/public/trainers')
      .then(r => { if (r.success) setTrainers(r.data.trainers || []); })
      .catch(() => {})
      .finally(() => setLoadingTrainers(false));
  }, []);

  return (
    <div className="bg-white min-h-screen">

      {/* ══ HERO ════════════════════════════════════════ */}
      <section id="hero" className="relative isolate overflow-hidden bg-black pt-[88px] text-white">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
        <div className="absolute inset-0 -z-10 bg-black/60" />
        <div className="mx-auto flex min-h-[680px] max-w-7xl items-center justify-start px-4 py-20 text-left sm:px-8">
          <div className="max-w-3xl animate-fade-up">
            <h1 className="text-5xl font-black leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-7xl">National<br /><span className="text-[#1da156]">Training Week</span></h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-snug text-white sm:text-xl">{event?.theme || 'Skills, knowledge, and opportunity—accessible nationwide.'}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">{event?.description || 'An annual virtual learning platform connecting students, graduates, and professionals with expert-led training across technology, education, health, business, and community development.'}</p>
            {event && <div className="mt-6 flex flex-wrap justify-start gap-x-6 gap-y-2 text-xs font-bold text-white/80"><span>{eventDates}</span><span>{days.length} day{days.length === 1 ? '' : 's'} · {sessionCount} session{sessionCount === 1 ? '' : 's'}</span><span className="capitalize text-[#1da156]">{eventStatus}</span></div>}
            {event && (countdown.complete ? (
              <div className="mx-auto mt-7 inline-flex rounded-xl border border-white/20 bg-black/35 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm">
                {eventHasEnded ? 'This edition has been completed' : 'The event is underway'}
              </div>
            ) : (
              <div className="mt-7 flex max-w-xl items-center justify-start gap-1.5 sm:gap-2" aria-label="Countdown to event"><Digit v={countdown.months} label="Months" /><Digit v={countdown.days} label="Days" /><Digit v={countdown.hours} label="Hours" /><Digit v={countdown.minutes} label="Mins" /><Digit v={countdown.seconds} label="Secs" /></div>
            ))}
            <div className="mt-8 flex flex-col justify-start gap-3 sm:flex-row">
              {event ? <><Link to="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1da156] px-7 text-sm font-extrabold text-white transition hover:bg-white hover:text-black">Register free</Link><Link to="/program" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-black/20 px-7 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-black">Explore the program</Link></> : <><Link to="/about" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1da156] px-7 text-sm font-extrabold text-white transition hover:bg-white hover:text-black">Discover the program</Link><Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-black/20 px-7 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-black">Contact the program office</Link></>}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white text-slate-900">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-8 md:grid-cols-3 md:divide-x md:divide-slate-200">
            <div className="flex gap-3"><AcademicCapIcon className="h-6 w-6 shrink-0 text-[#1da156]" /><div><h2 className="text-sm font-black">Academic and practical</h2><p className="mt-1 text-xs leading-5 text-slate-600">Expert-led learning that connects university knowledge to real national challenges.</p></div></div>
            <div className="flex gap-3 md:pl-6"><CalendarDaysIcon className="h-6 w-6 shrink-0 text-[#1da156]" /><div><h2 className="text-sm font-black">{event ? eventDates : 'Next dates to be announced'}</h2><p className="mt-1 text-xs leading-5 text-slate-600">The official schedule is published after an edition is approved.</p></div></div>
            <div className="flex gap-3 md:pl-6"><GlobeAltIcon className="h-6 w-6 shrink-0 text-[#1da156]" /><div><h2 className="text-sm font-black">Accessible nationwide</h2><p className="mt-1 text-xs leading-5 text-slate-600">Join online from anywhere and earn verifiable certificates.</p></div></div>
          </div>
        </div>
      </section>

      {/* ══ SCHEDULE / 6 DAYS ════════════════════════ */}
      <section className="border-y border-slate-200 bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Program Structure"
            title={`${days.length || 'Focused'} Days Of Learning`}
            subtitle={`Each day advances the current edition theme: ${event?.theme || 'national skills and innovation'}.`}
          />
          <ScheduleTabs fallbackDays={days} />
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
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="World-Class Faculty"
            title="Featured Trainers & Keynote Speakers"
            subtitle={`Meet the professors, industry leaders, and practitioners guiding the ${event?.year || 'current'} edition.`}
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
      <section className="border-t border-black/10 bg-white py-24 text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionTitle
            tag="Who Should Attend"
            title="Learning designed for every stage"
            subtitle="From foundational digital literacy to advanced technical practice, the program welcomes learners across Somalia."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCE.map((a, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-black/10 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#1da156] hover:shadow-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1da156]/10 transition-colors group-hover:bg-[#1da156]">
                  <a.Icon className="w-7 h-7 text-[#1da156] group-hover:text-white transition-colors" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-black">{a.label}</h3>
                <p className="text-xs leading-relaxed text-black/65">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CERTIFICATE CTA STRIP ═══════════════════ */}
      <section className="bg-[#1da156] py-20 text-white">
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

/* ── Schedule Tabs ── */
const ScheduleTabs = ({ fallbackDays = [] }) => {
  const [active, setActive]   = useState(0);
  const [program, setProgram] = useState([]);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    api.get('/public/program')
      .then(r => { if (r.success && r.data) setProgram(r.data.program || []); })
      .catch(() => setProgram(fallbackDays.map((day) => ({ day, sessions: [] }))))
      .finally(() => setLoaded(true));
  }, [fallbackDays]);

  const currentDay = program[active];
  const sessions   = currentDay?.sessions || [];

  if (loaded && program.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <CalendarDaysIcon className="mx-auto h-10 w-10 text-[#1da156]" />
        <h3 className="mt-4 text-xl font-black text-slate-900">Program coming soon</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">No event is active. Program days and training sessions will appear here when the next edition is published.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Day Tab Row ── */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12 py-2">
        {program.map(({ day }, i) => {
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
                Day {day.dayNumber} • {day.date ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}
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
              Day {currentDay?.day?.dayNumber}
            </span>
            <h3 className="text-2xl font-black text-black mb-3">{currentDay?.day?.theme}</h3>
            <p className="text-black/70 text-sm leading-relaxed">The detailed sessions for this program day will be published soon.</p>
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
