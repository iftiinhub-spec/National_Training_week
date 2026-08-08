import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const photoUrl = (p) => {
  if (!p) return null;
  return p.startsWith('http') ? p : `/${p.replace(/^\//,'')}`;
};

const statusColor = (s) => ({
  registration_open:   'bg-emerald-500',
  ongoing:             'bg-blue-500',
  published:           'bg-[#155289]',
  completed:           'bg-slate-400',
  cancelled:           'bg-rose-500',
  draft:               'bg-amber-400',
  registration_closed: 'bg-orange-500',
}[s] || 'bg-slate-500');

/* ── Training card (TheEvent speaker-card hover style) ── */
const TrainingCard = ({ training: t }) => (
  <Link
    to={`/trainings/${t._id}`}
    className="group block relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all bg-slate-900"
  >
    {/* Cover image / placeholder */}
    <div className="relative h-52 overflow-hidden">
      {photoUrl(t.coverImage) ? (
        <img
          src={photoUrl(t.coverImage)}
          alt={t.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white/20 text-7xl font-black select-none"
          style={{ background: 'linear-gradient(135deg,#0d3d22,#155289)' }}
        >
          NTW
        </div>
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Status badge */}
      <span className={`absolute top-3 left-3 ${statusColor(t.status)} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide`}>
        {t.status?.replace(/_/g, ' ')}
      </span>

      {/* Hover description reveal */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white text-xs leading-relaxed line-clamp-3">
          {t.description || 'Click to view session details and register for free.'}
        </p>
      </div>
    </div>

    {/* Card body */}
    <div className="p-5 bg-white">
      <h3 className="font-black text-slate-900 text-base leading-snug mb-1 group-hover:text-[#1a6b3c] transition-colors line-clamp-2">
        {t.title}
      </h3>
      <p className="text-xs text-[#155289] font-semibold mb-3">
        {t.trainer
          ? `${t.trainer.title || ''} ${t.trainer.name}`.trim()
          : 'Expert Trainer'}
      </p>
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-3">
        <span>
          {t.date
            ? new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
        <span>{t.startTime} – {t.endTime}</span>
      </div>
    </div>
  </Link>
);

/* ══════════════════════════════════════════════════ */
export const Trainings = () => {
  const [trainings, setTrainings]             = useState([]);
  const [categories, setCategories]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel]     = useState('');
  const [selectedStatus, setSelectedStatus]   = useState('');

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)           params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel)    params.append('level', selectedLevel);
      if (selectedStatus)   params.append('status', selectedStatus);
      const res = await api.get(`/public/trainings?${params}`);
      if (res.success) setTrainings(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/admin/categories?activeOnly=true')
      .then((r) => { if (r.success) setCategories(r.data.categories || []); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTrainings(); }, [selectedCategory, selectedLevel, selectedStatus]);

  const reset = () => { setSearch(''); setSelectedCategory(''); setSelectedLevel(''); setSelectedStatus(''); };

  return (
    <div>

      {/* ── Page Hero ───────────────────────────────── */}
      <section
        className="relative py-20 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#0d3d22 0%,#1a6b3c 50%,#155289 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06] bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">Explore Curriculum</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">National Training Sessions</h1>
          <p className="text-emerald-100 text-sm max-w-xl mx-auto leading-relaxed">
            Browse published sessions for National Training Week 2026. Register free, attend live, and earn verified certificates.
          </p>
        </div>
      </section>

      {/* ── Filter Bar ──────────────────────────────── */}
      <section className="sticky top-[72px] z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchTrainings(); }}
            className="flex flex-wrap gap-2 items-center"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
              />
            </div>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            {/* Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
            >
              <option value="">All Levels</option>
              <option value="general">General</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
            >
              <option value="">All Statuses</option>
              <option value="registration_open">Registration Open</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-sm transition-colors"
            >
              Search
            </button>

            {(search || selectedCategory || selectedLevel || selectedStatus) && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 font-medium"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </section>

      {/* ── Results Grid ────────────────────────────── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {loading ? (
            <LoadingSpinner label="Loading training sessions..." />
          ) : trainings.length > 0 ? (
            <>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Showing <strong>{trainings.length}</strong> session{trainings.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {trainings.map((t) => (
                  <TrainingCard key={t._id} training={t} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 border border-dashed border-slate-300 rounded-2xl">
              <p className="text-slate-400 text-lg font-bold mb-2">No sessions found</p>
              <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filter criteria.</p>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-[#1a6b3c] text-white rounded-lg font-bold text-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Trainings;
