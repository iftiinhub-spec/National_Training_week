import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { trainingPath } from '../../utils/trainingLink';
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@icons';

export const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/participant/dashboard');
        if (res.success) {
          setDashData(res.data);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading participant portal..." />;

  const { stats, recentRegistrations, upcomingTrainings } = dashData || {};

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a6b3c]">Learning overview</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome back, {user?.fullName?.split(' ')[0] || 'Participant'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{stats?.totalRegistrations > 0 ? 'Track your training registrations, approval status, attendance, and earned certificates.' : 'You have not registered for a training yet. Browse the available sessions to begin.'}</p>
        </div>
        <Link to="/trainings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-semibold text-white hover:bg-[#145731]">Browse trainings <ArrowRightIcon className="h-4 w-4" /></Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Total Registrations</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.totalRegistrations || 0}</span>
            <AcademicCapIcon className="w-6 h-6 text-[#1a6b3c]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Approved Sessions</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.approvedRegistrations || 0}</span>
            <CheckBadgeIcon className="w-6 h-6 text-[#1a6b3c]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Attended (Present)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.totalAttended || 0}</span>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-[#1a6b3c]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Earned Certificates</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.totalCertificates || 0}</span>
            <CheckBadgeIcon className="w-6 h-6 text-[#1a6b3c]" />
          </div>
        </div>
      </div>

      {/* My Registrations Preview Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">My Trainings</h3>
          <Link to="/portal/trainings" className="text-xs font-bold text-[#1a6b3c] hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRegistrations && recentRegistrations.length > 0 ? (
          <div className="space-y-3">
            {recentRegistrations.map((reg) => (
              <div
                key={reg._id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={reg.status} type="registration" />
                    <span className="text-[11px] text-slate-400">
                      Enrolled {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {reg.training?.title}
                  </h4>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/portal/trainings`}
                    className="px-4 py-2 bg-slate-900 hover:bg-[#1a6b3c] text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    View Details & Meeting Info
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
            You haven't registered for any training sessions yet.{' '}
            <Link to="/trainings" className="font-bold text-[#1a6b3c] underline">Browse sessions here</Link>
          </div>
        )}
      </div>

      {/* Recommended Upcoming Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Recommended Sessions to Join</h3>
        {upcomingTrainings && upcomingTrainings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrainings.map((tr) => (
              <div key={tr._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#1a6b3c] uppercase block mb-1">
                    {tr.category?.name || 'Session'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base line-clamp-2">{tr.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5 text-[#1a6b3c]" />
                    <span>{tr.date ? new Date(tr.date).toLocaleDateString() : 'TBA'}</span>
                  </p>
                </div>
                <Link
                  to={trainingPath(tr)}
                  className="w-full text-center py-2 bg-emerald-50 hover:bg-[#1a6b3c] hover:text-white text-[#1a6b3c] font-bold rounded-lg text-xs transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 p-4">No upcoming open trainings at this moment.</div>
        )}
      </div>

    </div>
  );
};

export default ParticipantDashboard;
