import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { AcademicCapIcon, CalendarIcon, ClockIcon, UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export const ModeratorDashboard = () => {
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
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Operational Workspace
        </span>
        <h1 className="text-2xl sm:text-3xl font-black mt-1">
          Session Moderator Dashboard
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">
          Manage online meeting access, send Trainer & Participant invitations, launch QR attendance, and review session evaluations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Total Assigned Trainings</span>
          <span className="text-2xl font-black text-slate-900">{stats?.totalAssigned || 0}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Upcoming / Active Sessions</span>
          <span className="text-2xl font-black text-emerald-600">{stats?.upcoming || 0}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Completed Sessions</span>
          <span className="text-2xl font-black text-purple-600">{stats?.completed || 0}</span>
        </div>
      </div>

      {/* Assigned Trainings List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Your Assigned Sessions</h3>

        {trainings && trainings.length > 0 ? (
          <div className="space-y-4">
            {trainings.map((tr) => (
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
                      {tr.startTime} - {tr.endTime}
                    </span>
                    {tr.trainer && (
                      <span className="flex items-center gap-1 text-slate-800 font-semibold">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        Trainer: {tr.trainer.name}
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
