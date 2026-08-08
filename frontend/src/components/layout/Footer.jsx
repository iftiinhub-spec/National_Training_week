import React from 'react';
import { Link } from 'react-router-dom';
import { BuildingLibraryIcon, MapPinIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { FaFacebookF, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6';

export const Footer = () => {
  const year = new Date().getFullYear();

  const socialLinks = [
    { Icon: FaFacebookF, url: '#', label: 'Facebook' },
    { Icon: FaLinkedinIn, url: '#', label: 'LinkedIn' },
    { Icon: FaXTwitter, url: '#', label: 'X (Twitter)' },
    { Icon: FaYoutube, url: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-black text-white/80 border-t border-[#1da156]/20">

      {/* Top strip */}
      <div className="border-b border-white/10 py-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="National Training Week Logo"
              className="h-20 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-[#1da156] font-bold">
              "Artificial Intelligence for National Transformation"
            </p>
            <p className="text-xs text-white/60 mt-1">September 14 – 19, 2026 · 100% Online</p>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Col 1 */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm pb-2 border-b border-[#1da156]">
            About NTW
          </h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Empowering Somalia's workforce, students, and professionals through annual
            high-impact technical and professional training programs — 100% free, online,
            and officially certified.
          </p>
          <div className="flex gap-3 pt-2">
            {socialLinks.map(({ Icon, url, label }, i) => (
              <a
                key={i}
                href={url}
                aria-label={label}
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:border-[#1da156] hover:bg-[#1da156] transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-white font-bold text-sm pb-2 border-b border-[#1da156] mb-5">
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
                <Link to={l.path} className="text-sm text-white/70 hover:text-[#1da156] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1da156] shrink-0" />
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-white font-bold text-sm pb-2 border-b border-[#1da156] mb-5">
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
                <Link to={l.path} className="text-sm text-white/70 hover:text-[#1da156] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1da156] shrink-0" />
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-white font-bold text-sm pb-2 border-b border-[#1da156] mb-5">
            Organizer Contact
          </h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2.5">
              <BuildingLibraryIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span><strong className="text-white">Organizer:</strong> National Training Week</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPinIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span><strong className="text-white">Location:</strong> Mogadishu, Somalia</span>
            </li>
            <li className="flex items-center gap-2.5">
              <EnvelopeIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span><strong className="text-white">Email:</strong> ntw@trainingweek.so</span>
            </li>
            <li className="flex items-center gap-2.5">
              <GlobeAltIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span><strong className="text-white">Web:</strong> www.nationaltrainingweek.so</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>© {year} National Training Week · All rights reserved.</p>
          <p className="text-white/60 font-medium">Somalia National Technical Education Initiative</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
