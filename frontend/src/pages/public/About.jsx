import React from 'react';
import { CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

/* Shared section title component */
const SectionTitle = ({ tag, title, light = false }) => (
  <div className={`text-center mb-10 ${light ? 'text-white' : ''}`}>
    {tag && (
      <p className={`text-xs font-bold uppercase tracking-[.2em] mb-2 ${light ? 'text-emerald-300' : 'text-[#1a6b3c]'}`}>{tag}</p>
    )}
    <h2 className={`text-3xl sm:text-4xl font-black relative inline-block ${light ? 'text-white' : 'text-slate-900'}`}>
      {title}
      <span className={`block h-1 w-16 mx-auto mt-3 rounded-full ${light ? 'bg-emerald-400' : 'bg-[#1a6b3c]'}`} />
    </h2>
  </div>
);

const OBJECTIVES = [
  'Equip participants with practical, job-ready skills in modern technology and AI.',
  'Provide equal access to high-quality learning across all regions of Somalia.',
  'Support university students and fresh graduates in career transition.',
  'Build a strong community of developers, innovators, and technical leaders.',
  'Issue verified digital certificates to recognise attendance and learning outcomes.',
];

const AUDIENCE = [
  { icon: '🎓', role: 'University Students & Scholars',  text: 'Enhance your degree studies with real-world technical frameworks and tools.' },
  { icon: '💻', role: 'Developers & IT Professionals',    text: 'Deepen knowledge of ML, AI model integration, cloud, and modern APIs.' },
  { icon: '🏫', role: 'Fresh High-School Graduates',     text: 'Discover emerging university majors and high-demand tech skill paths.' },
  { icon: '🚀', role: 'General Public & Professionals',  text: 'Gain digital literacy and understand how AI impacts business and society.' },
];

export const About = () => (
  <div>

    {/* ── Page Hero Banner ─────────────────────────── */}
    <section
      className="relative py-24 text-white text-center"
      style={{ background: 'linear-gradient(135deg,#0d3d22 0%,#1a6b3c 50%,#155289 100%)' }}
    >
      <div className="absolute inset-0 opacity-[0.06] bg-grid-pattern pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">About The Event</p>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
          National Training Week
        </h1>
        <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          An annual flagship education and capacity-building initiative empowering Somalia's
          national workforce, scholars, developers, and high-school graduates through
          expert-led technical training.
        </p>
      </div>
    </section>

    {/* ── Background & Purpose ─────────────────────── */}
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionTitle tag="Background & Purpose" title="Driving Digital Transformation" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div className="space-y-5">
            <p className="text-slate-600 text-sm leading-relaxed">
              National Training Week (NTW) was established to bridge the gap between academic theory
              and practical, real-world technology skills. Each year NTW selects a transformative
              national theme to guide its curriculum.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              For the <strong>2026 edition</strong>, the program centres around{' '}
              <strong className="text-[#1a6b3c]">Artificial Intelligence for National Transformation</strong>.
              Over six intensive days, participants engage in interactive online sessions delivered
              by recognised university professors, industry engineers, and thought leaders.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {['September 14–19, 2026', '100% Online', 'Free & Certified'].map((tag) => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#1a6b3c] text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Objectives card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-4">
            <h3 className="text-base font-black text-[#1a6b3c] flex items-center gap-2 uppercase tracking-wide">
              <AcademicCapIcon className="w-5 h-5" /> Core Objectives
            </h3>
            <ul className="space-y-3">
              {OBJECTIVES.map((obj, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircleIcon className="w-5 h-5 text-[#1a6b3c] shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ── Target Participants ───────────────────────── */}
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionTitle tag="Audience Scope" title="Target Participant Groups" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AUDIENCE.map((a, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-8 border border-slate-200 text-center hover:border-[#1a6b3c] hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4">{a.icon}</div>
              <h4 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-[#1a6b3c] transition-colors">{a.role}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Organizer ────────────────────────────────── */}
    <section
      className="py-20 text-white"
      style={{ background: 'linear-gradient(135deg,#041022 0%,#0d3d22 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionTitle tag="About The Organizer" title="Hormuud University" light />
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-300 text-sm leading-relaxed">
            Hormuud University is a premier higher learning institution in Somalia dedicated to
            engineering, technology, computer science, and business management. Through initiatives
            like National Training Week, Hormuud University leads national workforce development
            and innovation — connecting classrooms to the global knowledge economy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {[['📍', 'Mogadishu, Somalia'], ['✉️', 'ntw@hormuud.edu.so'], ['🌐', 'www.hormuud.edu.so']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 text-sm text-slate-300">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

  </div>
);

export default About;
