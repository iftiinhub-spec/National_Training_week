import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicEmptyState from '../../components/common/PublicEmptyState';
import PublicPageHeader from '../../components/common/PublicPageHeader';

export const PastEditions = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/public/events').then(async (res) => {
      if (!res.success) return;
      const completed = (res.data.events || []).filter((event) => event.status === 'completed');
      const enriched = await Promise.all(completed.map(async (event) => {
        try { const sponsorRes = await api.get(`/public/sponsors?event=${event._id}`); return { ...event, sponsors: sponsorRes.data?.sponsors || [] }; }
        catch { return { ...event, sponsors: [] }; }
      }));
      setEvents(enriched);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return <div className="min-h-screen bg-white">
    <PublicPageHeader eyebrow="Program archive" title="Past Editions" description="Explore completed National Training Week programs, speakers, and permanently available recordings." />
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
      {loading ? <LoadingSpinner label="Loading past editions..." /> : events.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <article key={event._id} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">Completed edition</span><span className="text-2xl font-black text-[#1a6b3c]">{event.year}</span></div><h2 className="mt-5 text-xl font-black text-slate-950">{event.name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{event.theme}</p>{event.sponsors?.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5" aria-label={`${event.year} sponsors`}>{event.sponsors.map((sponsor) => <img key={sponsor._id} src={sponsor.logo.startsWith('http') ? sponsor.logo : `/${sponsor.logo.replace(/^\//, '')}`} alt={`${sponsor.name} logo`} className="h-8 w-16 object-contain" loading="lazy" />)}</div>}<div className="mt-6 flex flex-wrap gap-3"><Link to={`/program?event=${event._id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1a6b3c] px-4 text-xs font-bold text-white"><CalendarDaysIcon className="h-4 w-4" /> View program</Link><Link to={`/recordings?event=${event._id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700"><VideoCameraIcon className="h-4 w-4" /> Recordings</Link></div></article>)}</div> : <PublicEmptyState title="No past editions yet" description="Completed National Training Week editions will appear here." />}
    </section>
  </div>;
};

export default PastEditions;
