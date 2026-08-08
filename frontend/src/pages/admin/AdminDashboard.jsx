import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/admin/reports/overview');
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <LoadingSpinner label="Loading database statistics..." />;

  const statCards = [
    { name: 'Total Participants', value: stats?.totalParticipants || 0, icon: UserGroupIcon, color: 'text-blue-600', link: '/admin/registrations' },
    { name: 'Training Sessions', value: stats?.totalTrainings || 0, icon: AcademicCapIcon, color: 'text-[#1a6b3c]', link: '/admin/trainings' },
    { name: 'Total Registrations', value: stats?.totalRegistrations || 0, icon: ClipboardDocumentCheckIcon, color: 'text-amber-600', link: '/admin/registrations' },
    { name: 'Pending Registrations', value: stats?.pendingRegistrations || 0, icon: ClipboardDocumentCheckIcon, color: 'text-rose-600', link: '/admin/registrations?status=pending' },
    { name: 'Present Check-Ins', value: stats?.totalPresent || 0, icon: ClipboardDocumentCheckIcon, color: 'text-emerald-600', link: '/admin/attendance' },
    { name: 'Certificates Issued', value: stats?.totalCertificates || 0, icon: CheckBadgeIcon, color: 'text-purple-600', link: '/admin/certificates' },
    { name: 'Trainer Profiles', value: stats?.totalTrainers || 0, icon: UserGroupIcon, color: 'text-indigo-600', link: '/admin/trainers' },
    { name: 'Moderator Accounts', value: stats?.totalModerators || 0, icon: UserGroupIcon, color: 'text-slate-700', link: '/admin/moderators' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Platform Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black mt-1">
          National Training Week Admin Command Center
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">
          Full system management, participant registrations, certificates, trainer assignments, and real-time database analytics.
        </p>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{card.name}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900">{card.value}</span>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-[#1a6b3c] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Events & Days</h3>
          <p className="text-xs text-slate-500">Manage annual editions (2026+) and themed days.</p>
          <Link to="/admin/events" className="inline-block text-xs font-bold text-[#1a6b3c] hover:underline">
            Manage Events &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Pending Approvals</h3>
          <p className="text-xs text-slate-500">Review participant enrollments requiring approval.</p>
          <Link to="/admin/registrations?status=pending" className="inline-block text-xs font-bold text-[#1a6b3c] hover:underline">
            Review Registrations &rarr;
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Reports & Analytics</h3>
          <p className="text-xs text-slate-500">Generate 10 post-event reports from live database data.</p>
          <Link to="/admin/reports" className="inline-block text-xs font-bold text-[#1a6b3c] hover:underline">
            View System Reports &rarr;
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
