import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveBoxIcon, CalendarDaysIcon, MagnifyingGlassIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicEmptyState from '../../components/common/PublicEmptyState';
import PublicPageHeader from '../../components/common/PublicPageHeader';

export const PastEditions = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    Promise.all([api.get('/public/events'), api.get('/public/sponsors')]).then(([eventRes, sponsorRes]) => {
      if (!eventRes.success) return;
      const sponsorsByEvent = (sponsorRes.data?.sponsors || []).reduce((groups, sponsor) => {
        const eventId = String(sponsor.event || '');
        groups[eventId] = [...(groups[eventId] || []), sponsor];
        return groups;
      }, {});
      const completed = (eventRes.data.events || [])
        .filter((event) => event.status === 'completed')
        .map((event) => ({ ...event, sponsors: sponsorsByEvent[event._id] || [] }));
      setEvents(completed);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((event) => {
    const searchable = `${event.year || ''} ${event.name || ''} ${event.theme || ''}`.toLowerCase();
    return searchable.includes(searchQuery.trim().toLowerCase());
  });

  return <div className="min-h-screen bg-white">
    <PublicPageHeader eyebrow="Program archive" title="Past Editions" description="Explore completed National Training Week programs, speakers, and permanently available recordings." />
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      {loading ? <LoadingSpinner label="Loading past editions..." /> : events.length ? (
        <>
          <form onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput); }} role="search" className="mb-8 flex max-w-xl gap-2">
            <label htmlFor="archive-search" className="sr-only">Search archived editions</label>
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input id="archive-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by year, name, or theme" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15" />
              {searchInput && <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); }} aria-label="Clear archive search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><XMarkIcon className="h-4 w-4" /></button>}
            </div>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white hover:bg-[#124d2a]"><MagnifyingGlassIcon className="h-4 w-4" /> Search</button>
          </form>

          {filteredEvents.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <article key={event._id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="inline-flex items-center gap-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"><ArchiveBoxIcon className="h-4 w-4 text-[#1a6b3c]" /> Archived edition</p>
                <p className="text-xl font-black leading-none tracking-tight text-[#1a6b3c]">{event.year}</p>
              </div>

              <div className="mt-6 flex-1">
                <h2 className="text-lg font-black leading-snug text-slate-950">{event.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{event.theme}</p>

                {event.sponsors?.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-3" aria-label={`${event.year} sponsors`}>
                    {event.sponsors.map((sponsor) => (
                      <img key={sponsor._id} src={sponsor.logo.startsWith('http') ? sponsor.logo : `/${sponsor.logo.replace(/^\//, '')}`} alt={`${sponsor.name} logo`} className="h-7 w-14 object-contain" loading="lazy" />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-4">
                <Link to={`/program?event=${event._id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#1a6b3c] hover:text-[#124d2a]">
                  <CalendarDaysIcon className="h-4 w-4" /> Program
                </Link>
                <Link to={`/recordings?event=${event._id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#1a6b3c]">
                  <VideoCameraIcon className="h-4 w-4" /> Recordings
                </Link>
              </div>
            </article>
          ))}
          </div> : <PublicEmptyState title="No matching editions" description="Try another year, event name, or theme." />}
        </>
      ) : <PublicEmptyState title="No past editions yet" description="Completed National Training Week editions will appear here." />}
    </section>
  </div>;
};

export default PastEditions;
