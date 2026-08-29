import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon, MagnifyingGlassIcon, ArrowLeftIcon, StarIcon,
} from '@heroicons/react/24/outline';

const round = (value) => (Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '—');

// Small numeric rating with stars, so a value is readable at a glance and still exact.
const Rating = ({ label, value }) => {
  const score = Number(value) || 0;
  return (
    <div className="min-w-24">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-sm font-black text-slate-900">{round(value)}</span>
        <span className="flex" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((step) => (
            <StarIcon
              key={step}
              className={`h-3.5 w-3.5 ${step <= Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
};

export const FeedbackManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [byTraining, setByTraining] = useState([]);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [openSession, setOpenSession] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [trainingRes, reportRes] = await Promise.all([
          api.get('/admin/trainings?limit=100'),
          api.get('/admin/reports/feedback'),
        ]);
        setTrainings(trainingRes.data || []);
        setByTraining(reportRes.data?.byTraining || []);
      } catch (err) {
        toast.error('Failed to load feedback summary.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Every session is listed, including those with no feedback yet, so nothing looks missing.
  const sessions = useMemo(() => {
    const summaryById = new Map(byTraining.map((item) => [String(item.trainingId), item]));
    const term = search.trim().toLowerCase();
    return trainings
      .filter((item) => (!filters.event || String(item.event?._id || item.event) === filters.event))
      .filter((item) => (!filters.eventDay || String(item.eventDay?._id || item.eventDay) === filters.eventDay))
      .filter((item) => (!filters.training || String(item._id) === filters.training))
      .filter((item) => (!term || (item.title || '').toLowerCase().includes(term)))
      .map((item) => ({ training: item, summary: summaryById.get(String(item._id)) || null }))
      .sort((a, b) => new Date(a.training.date) - new Date(b.training.date));
  }, [trainings, byTraining, filters, search]);

  const openFeedback = async (training) => {
    setOpenSession(training);
    setLoadingFeedback(true);
    setFeedback([]);
    setStats(null);
    try {
      const res = await api.get(`/admin/trainings/${training._id}/feedback`);
      setFeedback(res.data?.feedback || []);
      setStats(res.data?.stats || null);
    } catch (err) {
      toast.error('Failed to load feedback for this session.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading feedback..." />;

  // ── Reading one session's feedback ──
  if (openSession) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setOpenSession(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1a6b3c] hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to all sessions
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h1 className="text-xl font-black text-slate-900">{openSession.title}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {openSession.eventDay?.dayNumber ? `Day ${openSession.eventDay.dayNumber} · ` : ''}
            {openSession.date ? new Date(openSession.date).toLocaleDateString() : ''}
          </p>
          {stats && stats.count > 0 && (
            <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4">
              <Rating label="Content" value={stats.avgContent} />
              <Rating label="Trainer" value={stats.avgTrainer} />
              <Rating label="Organization" value={stats.avgOrganization} />
              <div className="min-w-24">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Responses</p>
                <p className="mt-1 text-sm font-black text-slate-900">{stats.count}</p>
              </div>
            </div>
          )}
        </div>

        {loadingFeedback ? <LoadingSpinner label="Loading responses..." /> : !feedback.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
            No participant has submitted feedback for this session yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{item.participant?.fullName || 'Participant'}</p>
                    <p className="truncate text-xs text-slate-500">{item.participant?.email}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ''}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-6">
                  <Rating label="Content" value={item.contentRating} />
                  <Rating label="Trainer" value={item.trainerRating} />
                  <Rating label="Organization" value={item.organizationRating} />
                </div>

                {item.comments && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Comments</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{item.comments}</p>
                  </div>
                )}
                {item.suggestions && (
                  <div className="mt-3 rounded-xl bg-emerald-50/60 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#1a6b3c]">Suggestions</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{item.suggestions}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Session list ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Feedback & Evaluations</h1>
        <p className="mt-1 text-xs text-slate-500">
          Participant evaluations, session by session. Open a session to read every response and its ratings.
        </p>
      </div>

      <AdminProgramFilters value={filters} onChange={setFilters} includeSession />

      <div className="relative max-w-xs">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium"
        />
      </div>

      {!sessions.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          No training session matches these filters.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(({ training, summary }) => (
            <button
              key={training._id}
              type="button"
              onClick={() => openFeedback(training)}
              className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition hover:border-[#1a6b3c]/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">{training.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {training.eventDay?.dayNumber ? `Day ${training.eventDay.dayNumber} · ` : ''}
                  {training.date ? new Date(training.date).toLocaleDateString() : ''}
                </p>
              </div>

              {summary ? (
                <div className="flex flex-wrap items-center gap-5 sm:shrink-0">
                  <Rating label="Content" value={summary.avgContent} />
                  <Rating label="Trainer" value={summary.avgTrainer} />
                  <Rating label="Organization" value={summary.avgOrg} />
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#1a6b3c]">
                    {summary.count} response{summary.count === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  No feedback yet
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
