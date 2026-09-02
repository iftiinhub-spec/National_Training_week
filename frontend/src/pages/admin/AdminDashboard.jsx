import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@icons';

export const AdminDashboard = () => {
  const { isDark } = useTheme();
  const chartGrid = isDark ? '#475569' : '#e2e8f0';
  const chartText = isDark ? '#b0bfd1' : '#64748b';
  const tooltipStyle = { borderRadius: 12, borderColor: chartGrid, backgroundColor: isDark ? '#172033' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' };
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
    { name: 'Participants', value: stats?.totalParticipants || 0, icon: UserGroupIcon, link: '/admin/participants' },
    { name: 'Training Sessions', value: stats?.totalTrainings || 0, icon: AcademicCapIcon, link: '/admin/trainings' },
    { name: 'Registrations', value: stats?.totalRegistrations || 0, icon: ClipboardDocumentCheckIcon, link: '/admin/registrations' },
    { name: 'Pending Review', value: stats?.pendingRegistrations || 0, icon: ClipboardDocumentCheckIcon, link: '/admin/registrations?status=pending' },
    { name: 'Present Check-ins', value: stats?.totalPresent || 0, icon: ClipboardDocumentCheckIcon, link: '/admin/attendance' },
    { name: 'Certificates Issued', value: stats?.totalCertificates || 0, icon: CheckBadgeIcon, link: '/admin/certificates' },
    { name: 'Trainer Profiles', value: stats?.totalTrainers || 0, icon: UserGroupIcon, link: '/admin/trainers' },
    { name: 'Moderators', value: stats?.totalModerators || 0, icon: UserGroupIcon, link: '/admin/moderators' },
  ];

  const activityData = [
    { name: 'Participants', value: stats?.totalParticipants || 0 },
    { name: 'Sessions', value: stats?.totalTrainings || 0 },
    { name: 'Registrations', value: stats?.totalRegistrations || 0 },
    { name: 'Attendance', value: stats?.totalPresent || 0 },
    { name: 'Certificates', value: stats?.totalCertificates || 0 },
  ];
  const registrationData = [
    { name: 'Pending', value: stats?.pendingRegistrations || 0 },
    { name: 'Processed', value: Math.max((stats?.totalRegistrations || 0) - (stats?.pendingRegistrations || 0), 0) },
  ];

  return (
    <div className="space-y-8 pb-8">
      
      {/* Real Stats Grid */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Live database</p><h2 className="mt-1 text-xl font-bold text-slate-950">Program snapshot</h2></div>
          <Link to="/admin/reports" className="hidden text-sm font-semibold text-[#1a6b3c] hover:underline sm:block">View reports</Link>
        </div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1a6b3c]/35 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{card.name}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><Icon className="h-5 w-5" /></span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <span className="text-3xl font-bold tracking-tight text-slate-950">{card.value}</span>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-[#1a6b3c] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Visual overview</p><h2 className="mt-1 text-xl font-bold text-slate-950">Program activity</h2></div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-950">Activity across the platform</h3>
            <p className="mt-1 text-xs text-slate-500">Current totals from live records</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={activityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} contentStyle={tooltipStyle} /><Bar dataKey="value" fill="#1a6b3c" radius={[8, 8, 0, 0]} maxBarSize={52} /></BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-sm font-bold text-slate-950">Registration review</h3><p className="mt-1 text-xs text-slate-500">Pending versus processed</p>
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={registrationData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4}>{registrationData.map((_, index) => <Cell key={index} fill={index === 0 ? '#94a3b8' : '#1a6b3c'} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div>
            <div className="grid grid-cols-2 gap-3">{registrationData.map((item, index) => <div key={item.name} className="rounded-xl bg-slate-50 p-3"><span className={`mb-2 block h-2 w-2 rounded-full ${index === 0 ? 'bg-slate-400' : 'bg-[#1a6b3c]'}`} /><p className="text-xl font-bold text-slate-950">{item.value}</p><p className="text-xs text-slate-500">{item.name}</p></div>)}</div>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section>
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Common workflows</p><h2 className="mt-1 text-xl font-bold text-slate-950">Quick actions</h2></div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { title: 'Events & Days', text: 'Manage annual editions, schedules, and themed program days.', link: '/admin/events', Icon: CalendarDaysIcon },
          { title: 'Pending Approvals', text: 'Review participant enrolments that require an administrator decision.', link: '/admin/registrations?status=pending', Icon: ClipboardDocumentCheckIcon },
          { title: 'Reports & Analytics', text: 'Review live participation, attendance, and certification data.', link: '/admin/reports', Icon: ChartBarIcon },
        ].map(({ title, text, link, Icon }) => (
          <Link key={title} to={link} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1a6b3c]/40 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-emerald-50" />
            <div className="relative">
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a6b3c] text-white shadow-sm"><Icon className="h-6 w-6" /></span>
              <h3 className="text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1a6b3c]">Open workspace <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ))}
      </div>
      </section>

    </div>
  );
};

export default AdminDashboard;
