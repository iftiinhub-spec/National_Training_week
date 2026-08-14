import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowDownTrayIcon, UserGroupIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#1a6b3c', '#2f855a', '#68a67d', '#94a3b8', '#334155', '#0f172a'];

export const Reports = () => {
  const { isDark } = useTheme();
  const chartGrid = isDark ? '#475569' : '#e2e8f0';
  const chartText = isDark ? '#b0bfd1' : '#64748b';
  const tooltipStyle = { borderRadius: 12, borderColor: chartGrid, backgroundColor: isDark ? '#172033' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' };
  const [overview, setOverview] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '' });

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (filters.event) query.set('eventId', filters.event);
        if (filters.eventDay) query.set('eventDayId', filters.eventDay);
        if (filters.training) query.set('trainingId', filters.training);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        const [ovRes, regRes, typeRes, attRes, dailyRes, fbRes] = await Promise.all([
          api.get(`/admin/reports/overview${suffix}`), api.get(`/admin/reports/participants-by-region${suffix}`),
          api.get(`/admin/reports/participants-by-type${suffix}`), api.get(`/admin/reports/attendance${suffix}`),
          api.get(`/admin/reports/daily-attendance${suffix}`), api.get(`/admin/reports/feedback${suffix}`),
        ]);
        if (ovRes.success) setOverview(ovRes.data);
        if (regRes.success) setRegionData(regRes.data.byRegion || []);
        if (typeRes.success) setTypeData(typeRes.data.byType || []);
        if (attRes.success) setAttendanceData(attRes.data);
        if (dailyRes.success) setDailyData(dailyRes.data.dailySummary || []);
        if (fbRes.success) setFeedbackData(fbRes.data);
      } catch {
        toast.error('Failed to load report aggregations.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [filters.event, filters.eventDay, filters.training]);

  const exportCsv = () => {
    const rows = [
      ['National Training Week Report'], ['Generated', new Date().toLocaleString()], [],
      ['Metric', 'Value'], ['Total Participants', overview?.totalParticipants || 0],
      ['Attendance Rate', `${attendanceData?.attendanceRate || 0}%`],
      ['Certificates Issued', overview?.totalCertificates || 0],
      ['Average Content Rating', feedbackData?.summary?.avgContent?.toFixed(1) || '0.0'], [],
      ['Participants by Region'], ['Region', 'Participants'],
      ...regionData.map((item) => [item._id || 'Not specified', item.count]), [],
      ['Participants by Audience Type'], ['Audience Type', 'Participants'],
      ...typeData.map((item) => [item._id || 'Not specified', item.count]), [],
      ['Daily Attendance'], ['Event Day', 'Date', 'Present', 'Enrolled', 'Attendance Rate'],
      ...dailyData.map((item) => [item.day, new Date(item.date).toLocaleDateString(), item.present, item.total, `${item.rate}%`]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `national-training-week-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner label="Aggregating live database report statistics..." />;

  const summaryCards = [
    { label: 'Total Participants', value: overview?.totalParticipants || 0, Icon: UserGroupIcon },
    { label: 'Attendance Rate', value: `${attendanceData?.attendanceRate || 0}%`, Icon: ClipboardDocumentCheckIcon },
    { label: 'Certificates Issued', value: overview?.totalCertificates || 0, Icon: CheckBadgeIcon },
    { label: 'Average Rating', value: `${feedbackData?.summary?.avgContent?.toFixed(1) || '0.0'} / 5`, Icon: StarIcon },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Live analytics</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Reports & Analytics</h1><p className="mt-1 text-sm text-slate-500">Program performance calculated from current database records.</p></div>
        <div className="flex flex-col gap-2 min-[420px]:flex-row">
          <button type="button" onClick={exportCsv} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-4 text-sm font-semibold text-white hover:bg-[#145731]"><ArrowDownTrayIcon className="h-5 w-5" /> Export CSV</button>
        </div>
      </div>

      <AdminProgramFilters value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, Icon }) => <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><Icon className="h-5 w-5" /></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p></div>)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-950">Regional distribution</h2><p className="mt-1 text-xs text-slate-500">Participants grouped by region</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={regionData} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} /><XAxis dataKey="_id" tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#1a6b3c" radius={[8, 8, 0, 0]} maxBarSize={52} /></BarChart></ResponsiveContainer></div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-950">Audience categories</h2><p className="mt-1 text-xs text-slate-500">Participant composition by type</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeData} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={54} outerRadius={92} paddingAngle={3}>{typeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div></div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-950">Attendance trend</h2><p className="mt-1 text-xs text-slate-500">Daily attendance rate across scheduled event days</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={dailyData} margin={{ left: -20, right: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="rate" stroke="#1a6b3c" strokeWidth={3} dot={{ fill: '#1a6b3c', r: 4 }} /></LineChart></ResponsiveContainer></div></div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Daily attendance details</h2><p className="mt-1 text-xs text-slate-500">Check-ins and participation rates by event day</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Event day</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Present</th><th className="px-6 py-4">Enrolled</th><th className="px-6 py-4">Attendance</th></tr></thead><tbody className="divide-y divide-slate-100">{dailyData.length ? dailyData.map((item, index) => <tr key={index} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold text-slate-950">{item.day}</td><td className="px-6 py-4 text-slate-600">{new Date(item.date).toLocaleDateString()}</td><td className="px-6 py-4 font-semibold text-[#1a6b3c]">{item.present}</td><td className="px-6 py-4 text-slate-600">{item.total}</td><td className="px-6 py-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#1a6b3c]">{item.rate}%</span></td></tr>) : <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No daily attendance data is available yet.</td></tr>}</tbody></table></div></div>
    </div>
  );
};

export default Reports;
