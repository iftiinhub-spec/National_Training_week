import React from 'react';
import {
  CheckCircleIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  MapPinIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const OBJECTIVES = [
  'Equip participants with practical, job-ready skills in modern technology and AI.',
  'Provide equal access to high-quality learning across all regions of Somalia.',
  'Support university students and fresh graduates in career transition.',
  'Build a strong community of developers, innovators, and technical leaders.',
  'Issue verified digital certificates to recognise attendance and learning outcomes.',
];

const AUDIENCE = [
  { Icon: AcademicCapIcon,     role: 'University Students & Scholars',  text: 'Enhance your degree studies with real-world technical frameworks and tools.' },
  { Icon: CodeBracketIcon,     role: 'Developers & IT Professionals',   text: 'Deepen knowledge of ML, AI model integration, cloud, and modern APIs.' },
  { Icon: BuildingLibraryIcon, role: 'Fresh High-School Graduates',     text: 'Discover emerging university majors and high-demand tech skill paths.' },
  { Icon: RocketLaunchIcon,    role: 'General Public & Professionals',  text: 'Gain digital literacy and understand how AI impacts business and society.' },
];

export const About = () => (
  <div className="bg-white min-h-screen">

    {/* ── Page Hero Banner ─────────────────────────── */}
    <section className="relative py-24 text-white text-center bg-[#1da156]">
      <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">About The Event</p>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
          National Training Week
        </h1>
        <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          An annual flagship education and capacity-building initiative empowering Somalia's
          national workforce, scholars, developers, and high-school graduates through
          expert-led technical training.
        </p>
      </div>
    </section>

    {/* ── Background & Purpose ─────────────────────── */}
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Section Title */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-2 text-[#1da156]">Background & Purpose</p>
          <h2 className="text-3xl sm:text-4xl font-black text-black relative inline-block">
            Driving Digital Transformation
            <span className="block h-1 w-16 mx-auto mt-3 rounded-full bg-[#1da156]" />
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div className="space-y-5">
            <p className="text-black/70 text-sm leading-relaxed">
              National Training Week (NTW) was established to bridge the gap between academic theory
              and practical, real-world technology skills. Each year NTW selects a transformative
              national theme to guide its curriculum.
            </p>
            <p className="text-black/70 text-sm leading-relaxed">
              For the <strong className="text-black">2026 edition</strong>, the program centres around{' '}
              <strong className="text-[#1da156]">Artificial Intelligence for National Transformation</strong>.
              Over six intensive days, participants engage in interactive online sessions delivered
              by recognised university professors, industry engineers, and thought leaders.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {['September 14–19, 2026', '100% Online', 'Free & Certified'].map((tag) => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-white border border-[#1da156] text-[#1da156] text-xs font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Objectives card */}
          <div className="bg-white border border-black/10 rounded-2xl p-8 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-[#1da156] flex items-center gap-2 uppercase tracking-wide">
              <AcademicCapIcon className="w-5 h-5" /> Core Objectives
            </h3>
            <ul className="space-y-3">
              {OBJECTIVES.map((obj, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-black/80">
                  <CheckCircleIcon className="w-5 h-5 text-[#1da156] shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ── Target Participants ───────────────────────── */}
    <section className="py-20 bg-white border-y border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Section Title */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-2 text-[#1da156]">Audience Scope</p>
          <h2 className="text-3xl sm:text-4xl font-black text-black relative inline-block">
            Target Participant Groups
            <span className="block h-1 w-16 mx-auto mt-3 rounded-full bg-[#1da156]" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AUDIENCE.map((a, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-8 border border-black/10 text-center hover:border-[#1da156] hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1da156] transition-colors">
                <a.Icon className="w-7 h-7 text-[#1da156] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-bold text-black text-sm mb-2 group-hover:text-[#1da156] transition-colors">{a.role}</h4>
              <p className="text-xs text-black/60 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Organizer ────────────────────────────────── */}
    <section className="py-20 bg-[#1da156] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Section Title */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[.2em] mb-2 text-white/70">About The Organizer</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white relative inline-block">
            National Training Week
            <span className="block h-1 w-16 mx-auto mt-3 rounded-full bg-white" />
          </h2>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/90 text-sm leading-relaxed">
            Leading national workforce development and capacity building in engineering, technology,
            computer science, and digital management — connecting Somali youth, professionals, and academic scholars
            to the global knowledge economy.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {[
              { Icon: MapPinIcon,    text: 'Mogadishu, Somalia' },
              { Icon: EnvelopeIcon, text: 'ntw@trainingweek.so' },
              { Icon: GlobeAltIcon, text: 'www.nationaltrainingweek.so' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-white/80 font-medium">
                <Icon className="w-4 h-4 text-white" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

  </div>
);

export default About;
