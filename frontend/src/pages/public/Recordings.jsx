import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicPageHeader from '../../components/common/PublicPageHeader';
import PublicEmptyState from '../../components/common/PublicEmptyState';
import { PlayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';

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
              <div
                key={recording._id}
                className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Thumbnail Container (16:9) */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  {recording.thumbnail ? (
                    <img
                      src={`/${recording.thumbnail}`}
                      alt={recording.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6">
                      <img src="/logo.png" alt="National Training Week" className="h-16 w-auto object-contain opacity-80" />
                    </div>
                  )}

                  {/* Play Icon Overlay */}
                  <a
                    href={recording.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#1da156] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayIcon className="w-7 h-7 ml-0.5" />
                    </div>
                  </a>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {recording.training?.event && (
                      <span className="text-xs font-semibold text-[#1da156] block mb-1">
                        {recording.training.event.name}
                      </span>
                    )}
                    <h3 className="font-bold text-black text-lg line-clamp-2 mb-2">
                      {recording.title}
                    </h3>
                    {recording.description && (
                      <p className="text-black/70 text-xs line-clamp-2 leading-relaxed mb-4">
                        {recording.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                    <a
                      href={recording.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center bg-black hover:bg-[#1da156] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Watch Recording</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
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
