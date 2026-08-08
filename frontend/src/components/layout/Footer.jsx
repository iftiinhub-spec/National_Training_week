import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Identity & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#155289] flex items-center justify-center text-white font-black text-lg shadow-md">
                HU
              </div>
              <div>
                <span className="block font-bold text-white text-base">HORMUUD UNIVERSITY</span>
                <span className="block text-xs text-emerald-400 font-semibold tracking-wider">NATIONAL TRAINING WEEK</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering national workforce, students, and professionals through annual high-impact technical and professional training programs.
            </p>
            <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 rounded-lg p-3 inline-block">
              Theme 2026: Artificial Intelligence for National Transformation
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#1a6b3c] pl-2.5">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">Home Landing</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">About National Training Week</Link>
              </li>
              <li>
                <Link to="/program" className="hover:text-emerald-400 transition-colors">6-Day Event Program</Link>
              </li>
              <li>
                <Link to="/trainings" className="hover:text-emerald-400 transition-colors">Browse All Trainings</Link>
              </li>
              <li>
                <Link to="/recordings" className="hover:text-emerald-400 transition-colors">Recorded Sessions Library</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Verification & Access */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#155289] pl-2.5">
              Participant Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/verify-certificate" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Certificate Verification</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Public</span>
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-emerald-400 transition-colors">Register as Participant</Link>
              </li>
              <li>
                <Link to="/signin" className="hover:text-emerald-400 transition-colors">Sign In to Portal</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support Team</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Organizer Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#1a6b3c] pl-2.5">
              Organizer Contact
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p><strong className="text-slate-200">Organizer:</strong> Hormuud University</p>
              <p><strong className="text-slate-200">Location:</strong> Mogadishu, Somalia</p>
              <p><strong className="text-slate-200">Email:</strong> ntw@hormuud.edu.so</p>
              <p><strong className="text-slate-200">Web:</strong> www.hormuud.edu.so</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Hormuud University. All rights reserved. National Training Week Management System.</p>
          <p className="flex items-center gap-4">
            <span className="text-slate-400">Somalia National Education Initiative</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
