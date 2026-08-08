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
  registration_open:   'bg-[#1da156]',
  ongoing:             'bg-[#1da156]',
  published:           'bg-[#1da156]',
  completed:           'bg-black/60',
  cancelled:           'bg-black/60',
  draft:               'bg-black/60',
  registration_closed: 'bg-black/60',
}[s] || 'bg-black/60');

/* ── Training card ── */
const TrainingCard = ({ training: t }) => (
  <Link
    to={`/trainings/${t._id}`}
    className="group block relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all card-hover-lift bg-white border border-black/10"
  >
    {/* Cover image / placeholder */}
    <div className="relative h-52 overflow-hidden bg-black">
      {photoUrl(t.coverImage) ? (
        <img
          src={photoUrl(t.coverImage)}
          alt={t.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <img src="/logo.png" alt="National Training Week" className="h-20 w-auto object-contain opacity-80" />
        </div>
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
        <p className="text-white text-xs leading-relaxed line-clamp-3">
          {t.description || 'Click to view session details and register for free.'}
        </p>
      </div>

      {/* Status badge */}
      <span className={`absolute top-3 left-3 ${statusColor(t.status)} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow`}>
        {t.status?.replace(/_/g, ' ')}
      </span>
    </div>

    {/* Card body */}
    <div className="p-5 bg-white">
      <h3 className="font-black text-black text-base leading-snug mb-1 group-hover:text-[#1da156] transition-colors line-clamp-2">
        {t.title}
      </h3>
      <p className="text-xs text-[#1da156] font-bold mb-3">
        {t.trainer
          ? `${t.trainer.title || ''} ${t.trainer.name}`.trim()
          : 'Expert Trainer'}
      </p>
      <div className="flex items-center justify-between text-[11px] text-black/70 font-medium border-t border-black/10 pt-3">
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
    <div className="bg-white min-h-screen">

      {/* ── Page Hero ───────────────────────────────── */}
      <section className="relative py-20 text-white text-center bg-[#1da156]">
        <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-white mb-3">Explore Curriculum</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">National Training Sessions</h1>
          <p className="text-white text-sm max-w-xl mx-auto leading-relaxed">
            Browse published sessions for National Training Week 2026. Register free, attend live, and earn verified certificates.
          </p>
        </div>
      </section>

      {/* ── Filter Bar ──────────────────────────────── */}
      <section className="sticky top-[72px] z-30 bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchTrainings(); }}
            className="flex flex-wrap gap-2 items-center"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4 text-black/50 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 text-black bg-white"
              />
            </div>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-black/10 text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
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
              className="px-3 py-2 rounded-lg border border-black/10 text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
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
              className="px-3 py-2 rounded-lg border border-black/10 text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
            >
              <option value="">All Statuses</option>
              <option value="registration_open">Registration Open</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#1da156] hover:bg-black text-white font-bold text-sm transition-colors"
            >
              Search
            </button>

            {(search || selectedCategory || selectedLevel || selectedStatus) && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg border border-black/10 text-sm text-black hover:bg-black hover:text-white font-medium"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </section>

      {/* ── Results Grid ────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {loading ? (
            <LoadingSpinner label="Loading training sessions..." />
          ) : trainings.length > 0 ? (
            <>
              <p className="text-xs text-black/70 font-medium mb-6">
                Showing <strong>{trainings.length}</strong> session{trainings.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {trainings.map((t) => (
                  <TrainingCard key={t._id} training={t} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 border border-dashed border-black/20 rounded-2xl">
              <p className="text-black/70 text-lg font-bold mb-2">No sessions found</p>
              <p className="text-black/60 text-sm mb-6">Try adjusting your search or filter criteria.</p>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-[#1da156] text-white rounded-lg font-bold text-sm"
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
