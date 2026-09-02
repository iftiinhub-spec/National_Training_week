import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, CalendarIcon, CheckCircleIcon, ClockIcon, UserIcon, WrenchScrewdriverIcon } from '@icons';
import { formatTimeRange12 } from '../../utils/timeFormat';

export const ModeratorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/moderator/dashboard');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching moderator dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading assigned sessions..." />;

  const { trainings, stats } = data || {};

  return (
    <div className="space-y-8">
      
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a6b3c]">Operational overview</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome, {user?.fullName?.split(' ')[0] || 'Moderator'}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage assigned sessions, meeting access, participant invitations, live QR attendance, and evaluation results.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Assigned trainings</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><AcademicCapIcon className="h-5 w-5" /></span></div><span className="mt-5 block text-3xl font-bold text-slate-950">{stats?.totalAssigned || 0}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Upcoming / active</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><ClockIcon className="h-5 w-5" /></span></div><span className="mt-5 block text-3xl font-bold text-slate-950">{stats?.upcoming || 0}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Completed sessions</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><CheckCircleIcon className="h-5 w-5" /></span></div><span className="mt-5 block text-3xl font-bold text-slate-950">{stats?.completed || 0}</span>
        </div>
      </div>

      {/* Assigned Trainings List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900">Recent assigned sessions</h3><p className="mt-1 text-xs text-slate-500">Open a session to access operational tools.</p></div><Link to="/moderator/trainings" className="text-sm font-bold text-[#1a6b3c] hover:underline">View all</Link></div>

        {trainings && trainings.length > 0 ? (
          <div className="space-y-4">
            {trainings.slice(0, 3).map((tr) => (
              <div
                key={tr._id}
                className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-500 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tr.status} />
                    <span className="text-xs font-bold text-[#1a6b3c]">
                      Day {tr.eventDay?.dayNumber}: {tr.eventDay?.theme}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-lg">{tr.title}</h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <CalendarIcon className="w-4 h-4 text-[#1a6b3c]" />
                      {tr.date ? new Date(tr.date).toLocaleDateString() : 'TBA'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <ClockIcon className="w-4 h-4 text-[#1a6b3c]" />
                      {formatTimeRange12(tr.startTime, tr.endTime)}
                    </span>
                    {tr.trainer && (
                      <span className="flex items-center gap-1 text-slate-800 font-semibold">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        Trainers: {(tr.trainers?.length ? tr.trainers : [tr.trainer]).filter(Boolean).map((trainer) => trainer.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/moderator/trainings/${tr._id}`}
                    className="px-5 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    <span>Manage Operations</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
            You currently have no training sessions assigned by the Administrator.
          </div>
        )}
      </div>

    </div>
  );
};

export default ModeratorDashboard;
