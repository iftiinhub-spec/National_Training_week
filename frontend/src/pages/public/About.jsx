import React from 'react';
import { AcademicCapIcon, CheckCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a6b3c] to-[#155289] text-white rounded-2xl p-8 md:p-12 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
          About The Event
        </span>
        <h1 className="text-3xl md:text-5xl font-black mt-2 mb-4 leading-tight">
          Hormuud University National Training Week
        </h1>
        <p className="text-emerald-100 text-lg max-w-3xl leading-relaxed">
          An annual flagship education and capacity building initiative aimed at empowering Somalia’s national workforce, university scholars, developers, and high-school graduates through practical, expert-led technical training.
        </p>
      </div>

      {/* Background & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
            Background & Purpose
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Driving Digital & Technical Transformation
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            National Training Week (NTW) was established by Hormuud University to bridge the gap between academic theory and practical, real-world technology skills. Each year, NTW selects a transformative national theme to guide its curriculum.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            For the 2026 edition, the program centers around <strong>Artificial Intelligence for National Transformation</strong>. Over six intensive days, participants engage in interactive online sessions delivered by recognized university professors, industry engineers, and thought leaders.
          </p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200/80 space-y-4">
          <h3 className="text-lg font-bold text-[#1a6b3c] flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6" />
            Core Objectives
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
            {[
              'Equip participants with practical, job-ready skills in modern technology and AI.',
              'Provide equal access to high-quality learning across all regions of Somalia.',
              'Support university students and fresh graduates in career transition.',
              'Build a strong community of developers, innovators, and technical leaders.',
              'Issue verified digital certificates to recognize attendance and learning outcomes.',
            ].map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#1a6b3c] mt-2 shrink-0"></span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Target Participants */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#155289]">
            Audience Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Target Participant Groups
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { role: 'University Students & Scholars', text: 'Enhance your degree studies with real-world technical frameworks and tools.' },
            { role: 'Developers & IT Professionals', text: 'Deepen your knowledge of machine learning, AI model integration, and cloud tools.' },
            { role: 'Fresh High-School Graduates', text: 'Discover emerging university majors and high-demand tech skill paths.' },
            { role: 'General Public & Professionals', text: 'Gain digital literacy and understand how AI impacts business and society.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-[#1a6b3c] transition-colors">
              <h4 className="font-bold text-slate-900 text-base mb-2 text-[#1a6b3c]">{item.role}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Organizer Information */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 space-y-6">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            About The Organizer
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Hormuud University, Mogadishu
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Hormuud University is a premier higher learning institution in Somalia dedicated to engineering, technology, computer science, and business management. Through initiatives like National Training Week, Hormuud University leads national workforce development and innovation.
          </p>
        </div>
      </div>

    </div>
  );
};

export default About;
