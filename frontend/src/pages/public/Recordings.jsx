import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicPageHeader from '../../components/common/PublicPageHeader';
import PublicEmptyState from '../../components/common/PublicEmptyState';
import { PlayIcon } from '@heroicons/react/24/outline';
import { Link, useSearchParams } from 'react-router-dom';

const mediaUrl = (value) => value?.startsWith('http') ? value : value ? `/${value.replace(/^\//, '')}` : '';

const getYouTubeId = (url = '') => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || '';
      if (/^\/(embed|shorts)\//.test(parsed.pathname)) return parsed.pathname.split('/')[2] || '';
    }
  } catch { return ''; }
  return '';
};

const getRecordingThumbnail = (recording) => {
  if (recording.thumbnail) return mediaUrl(recording.thumbnail);
  const youtubeId = getYouTubeId(recording.url);
  if (youtubeId) return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return mediaUrl(recording.training?.coverImage);
};

export const Recordings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [days, setDays] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [filters, setFilters] = useState({ eventDay: '', category: '', trainer: '', language: '' });

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const params = new URLSearchParams({ ...(selectedEvent ? { event: selectedEvent } : {}), ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
        const res = await api.get(`/public/recordings${params.toString() ? `?${params}` : ''}`);
        if (res.success) {
          setRecordings(res.data || []);
        }
      } catch (err) {
        console.error('Error loading recordings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, [selectedEvent, filters]);

  useEffect(() => { api.get('/public/events').then((res) => { if (res.success) setEvents(res.data.events || []); }).catch(() => {}); }, []);
  useEffect(() => { api.get('/public/categories?activeOnly=true').then((res) => { if (res.success) setCategories(res.data.categories || []); }).catch(() => {}); }, []);
  useEffect(() => {
    setFilters({ eventDay: '', category: '', trainer: '', language: '' });
    if (!selectedEvent) { setDays([]); setTrainers([]); return; }
    Promise.all([api.get(`/public/events/${selectedEvent}`), api.get(`/public/trainers?event=${selectedEvent}`)]).then(([eventRes, trainerRes]) => { setDays(eventRes.data?.days || []); setTrainers(trainerRes.data?.trainers || []); }).catch(() => {});
  }, [selectedEvent]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page Hero ── */}
      <PublicPageHeader
        eyebrow="Free public learning library"
        title="Recorded Training Sessions"
        description="Revisit published National Training Week sessions for continued learning, revision, and professional development."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 space-y-8">

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold text-slate-700">Event edition<select value={selectedEvent} onChange={(e) => { setSelectedEvent(e.target.value); setSearchParams(e.target.value ? { event: e.target.value } : {}); }} className="mt-1 block min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option value="">All editions</option>{events.map((event) => <option key={event._id} value={event._id}>{event.year} — {event.theme}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700">Program day<select disabled={!selectedEvent} value={filters.eventDay} onChange={(e) => setFilters({ ...filters, eventDay: e.target.value })} className="mt-1 block min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:opacity-50"><option value="">All days</option>{days.map((day) => <option key={day._id} value={day._id}>Day {day.dayNumber} — {day.theme}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700">Category<select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="mt-1 block min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700">Trainer<select disabled={!selectedEvent} value={filters.trainer} onChange={(e) => setFilters({ ...filters, trainer: e.target.value })} className="mt-1 block min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:opacity-50"><option value="">All trainers</option>{trainers.map((trainer) => <option key={trainer._id} value={trainer._id}>{trainer.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700">Language<select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className="mt-1 block min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">All languages</option><option value="English">English</option><option value="Somali">Somali</option><option value="Somali / English">Somali / English</option></select></label>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading published recordings..." />
        ) : recordings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((recording) => (
              (() => {
                const thumbnail = getRecordingThumbnail(recording);
                return (
              <article
                key={recording._id}
                className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Thumbnail Container (16:9) */}
                <Link to={`/recordings/${recording._id}`} aria-label={`Watch ${recording.title}`} className="relative block aspect-video w-full overflow-hidden bg-slate-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={recording.title}
                      className="h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/logo.png';
                        event.currentTarget.className = 'h-full w-full object-contain p-12';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6">
                      <img src="/logo.png" alt="National Training Week" className="h-16 w-auto object-contain opacity-80" />
                    </div>
                  )}

                  {/* Play Icon Overlay */}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-[#1da156] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <PlayIcon className="w-7 h-7 ml-0.5" />
                    </span>
                  </span>
                </Link>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {recording.training?.event && (
                      <span className="text-xs font-semibold text-[#1da156] block mb-1">
                        {recording.training.event.name}
                      </span>
                    )}
                    <h3 className="font-bold text-black text-lg line-clamp-2 mb-2"><Link to={`/recordings/${recording._id}`} className="hover:text-[#1da156]">{recording.title}</Link></h3>
                    {recording.description && (
                      <p className="text-black/70 text-xs line-clamp-2 leading-relaxed mb-4">
                        {recording.description}
                      </p>
                    )}
                  </div>

                </div>
              </article>
                );
              })()
            ))}
          </div>
        ) : (
          <PublicEmptyState
            title="The recording library is being prepared"
            description="Published recordings will appear here after training sessions are completed and approved for public access."
          />
        )}

      </div>
    </div>
  );
};

export default Recordings;
