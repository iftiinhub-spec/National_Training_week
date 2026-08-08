import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1a6b3c] to-[#155289] text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          Learning Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-black mt-1">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
          National Training Week 2026 — Artificial Intelligence for National Transformation.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <span className="text-2xl font-black text-emerald-600">{stats?.approvedRegistrations || 0}</span>
            <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Attended (Present)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600">{stats?.totalAttended || 0}</span>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Earned Certificates</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-purple-600">{stats?.totalCertificates || 0}</span>
            <CheckBadgeIcon className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* My Registrations Preview Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">My Registered Training Sessions</h3>
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
                  to={`/trainings/${tr._id}`}
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
