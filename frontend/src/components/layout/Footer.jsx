import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: 'linear-gradient(180deg,#0a2818 0%,#041022 100%)' }} className="text-slate-300">

      {/* Top strip */}
      <div
        className="border-b border-white/5 py-10"
        style={{ background: 'rgba(26,107,60,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#155289] flex items-center justify-center text-white font-black text-sm shadow-lg">
              NTW
            </div>
            <div>
              <span className="block font-black text-white text-xl tracking-tight">National Training Week</span>
              <span className="block text-xs text-emerald-400 font-semibold tracking-widest uppercase mt-0.5">
                2026 · Hormuud University
              </span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-emerald-400 font-bold">
              "Artificial Intelligence for National Transformation"
            </p>
            <p className="text-xs text-slate-500 mt-1">September 14 – 19, 2026 · Online</p>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Col 1 */}
        <div className="space-y-4">
          <h4 className="text-white font-black uppercase tracking-wider text-xs pb-2 border-b border-[#1a6b3c]/50">
            About NTW
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Empowering Somalia's workforce, students, and professionals through annual
            high-impact technical and professional training programs — 100% free, online,
            and officially certified.
          </p>
          <div className="flex gap-3 pt-2">
            {['f','in','t','y'].map((s, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:border-[#1a6b3c] hover:text-emerald-400 transition-colors text-xs font-bold"
              >
                {s === 'f' ? 'f' : s === 'in' ? 'in' : s === 't' ? '𝕏' : '▶'}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs pb-2 border-b border-[#155289]/50 mb-5">
            Quick Links
          </h4>
          <ul className="space-y-3">
            {[
              { name: 'Home',                  path: '/' },
              { name: 'About NTW',             path: '/about' },
              { name: '6-Day Program',         path: '/program' },
              { name: 'Browse Trainings',      path: '/trainings' },
              { name: 'Recorded Sessions',     path: '/recordings' },
            ].map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b3c] shrink-0" />
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs pb-2 border-b border-[#1a6b3c]/50 mb-5">
            Participant Services
          </h4>
          <ul className="space-y-3">
            {[
              { name: 'Verify Certificate',    path: '/verify-certificate' },
              { name: 'Register as Participant', path: '/signup' },
              { name: 'Sign In to Portal',     path: '/signin' },
              { name: 'Contact Support',       path: '/contact' },
            ].map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#155289] shrink-0" />
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs pb-2 border-b border-[#1a6b3c]/50 mb-5">
            Organizer Contact
          </h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">🏛</span>
              <span><strong className="text-slate-200">Organizer:</strong> Hormuud University</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">📍</span>
              <span><strong className="text-slate-200">Location:</strong> Mogadishu, Somalia</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✉️</span>
              <span><strong className="text-slate-200">Email:</strong> ntw@hormuud.edu.so</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">🌐</span>
              <span><strong className="text-slate-200">Web:</strong> www.hormuud.edu.so</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {year} National Training Week · Hormuud University · All rights reserved.</p>
          <p className="text-slate-600">Somalia National Education Initiative</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
