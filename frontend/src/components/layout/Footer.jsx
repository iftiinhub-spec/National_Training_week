import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BuildingLibraryIcon, MapPinIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { useCurrentEvent } from '../../context/EventContext';
import api from '../../api/axios';

const OFFICIAL_CONTACT = {
  email: 'info@ntw.hu.edu.so',
  location: 'Daru Shura Campus, Villa Baidoa, Wadajir, Mogadishu, Somalia',
};

export const Footer = () => {
  const year = new Date().getFullYear();
  const { event } = useCurrentEvent();
  const [settings, setSettings] = useState({
    organizerName: 'Hormuud University',
    contactEmail: OFFICIAL_CONTACT.email,
    location: OFFICIAL_CONTACT.location,
    facebookUrl: '',
    tiktokUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    xUrl: '',
  });

  useEffect(() => {
    api.get('/public/settings')
      .then((response) => setSettings((current) => {
        const incoming = response.data?.settings || {};
        return {
          ...current,
          ...incoming,
          organizerName: !incoming.organizerName || incoming.organizerName === 'National Training Week' ? 'Hormuud University' : incoming.organizerName,
          contactEmail: !incoming.contactEmail || incoming.contactEmail === 'ntw@trainingweek.so' ? OFFICIAL_CONTACT.email : incoming.contactEmail,
          location: !incoming.location || incoming.location === 'Mogadishu, Somalia' ? OFFICIAL_CONTACT.location : incoming.location,
        };
      }))
      .catch(() => {});
  }, []);
  const dates = event?.startDate && event?.endDate
    ? `${new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Next edition to be announced';
  const socialLinks = [
    { key: 'facebookUrl', label: 'Facebook', Icon: FaFacebookF },
    { key: 'tiktokUrl', label: 'TikTok', Icon: FaTiktok },
    { key: 'instagramUrl', label: 'Instagram', Icon: FaInstagram },
    { key: 'linkedinUrl', label: 'LinkedIn', Icon: FaLinkedinIn },
    { key: 'xUrl', label: 'X', Icon: FaXTwitter },
  ].filter((item) => settings[item.key]);

  return (
    <footer className="bg-black text-white/80 border-t border-[#1da156]/20">

      {/* Top strip */}
      <div className="border-b border-white/10 py-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-dark.png"
              alt="National Training Week Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-[#1da156] font-bold">
              {event ? <>Theme {event.year}: {event.theme}</> : 'Annual learning and professional development'}
            </p>
            <p className="text-xs text-white/60 mt-1">{dates}{event ? ' · Online' : ''}</p>
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
            An annual national learning initiative connecting students, graduates,
            professionals, and the public with practical learning and expert-led
            professional development.
          </p>
          {socialLinks.length > 0 && <div className="flex flex-wrap gap-3 pt-2">{socialLinks.map(({ key, label, Icon }) => <a key={key} href={settings[key]} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:border-[#1da156] hover:bg-[#1da156] focus:outline-none focus:ring-2 focus:ring-[#1da156] focus:ring-offset-2 focus:ring-offset-black"><Icon className="h-4 w-4" /></a>)}</div>}
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
              { name: 'Program',               path: '/program' },
              { name: 'Past Editions',          path: '/past-editions' },
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
              { name: 'Frequently Asked Questions', path: '/faq' },
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
              <span> {settings.organizerName}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPinIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span>{settings.location}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <EnvelopeIcon className="w-4 h-4 text-[#1da156] shrink-0" />
              <span> <a href={`mailto:${settings.contactEmail}`} className="hover:text-[#1da156]">{settings.contactEmail}</a></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>&copy; {year} National Training Week. All rights reserved.</p>
          <p className="text-white/60 font-medium">Learning for national transformation</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
