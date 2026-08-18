import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowDownTrayIcon, UserGroupIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#1a6b3c', '#2f855a', '#68a67d', '#94a3b8', '#334155', '#0f172a'];
const PARTICIPANT_TYPE_LABELS = { university_student: 'University Student', highschool_graduate: 'High-School Graduate', developer_it: 'Developer / IT Specialist', professional: 'Professional', general_public: 'General Public', teacher_educator: 'Teacher / Educator', entrepreneur_business: 'Entrepreneur / Business Owner', health_worker: 'Health Worker', community_organization: 'Community Organization Representative', other: 'Other' };

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
  const [registrationData, setRegistrationData] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [sessionData, setSessionData] = useState([]);
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
        const [ovRes, regionRes, regRes, typeRes, attRes, dailyRes, fbRes, certRes, trainingRes] = await Promise.all([
          api.get(`/admin/reports/overview${suffix}`), api.get(`/admin/reports/participants-by-region${suffix}`), api.get(`/admin/reports/registrations${suffix}`),
          api.get(`/admin/reports/participants-by-type${suffix}`), api.get(`/admin/reports/attendance${suffix}`),
          api.get(`/admin/reports/daily-attendance${suffix}`), api.get(`/admin/reports/feedback${suffix}`), api.get(`/admin/reports/certificates${suffix}`), api.get(`/admin/trainings?limit=100${filters.event ? `&event=${filters.event}` : ''}${filters.eventDay ? `&eventDay=${filters.eventDay}` : ''}`),
        ]);
        if (ovRes.success) setOverview(ovRes.data);
        if (regionRes.success) setRegionData(regionRes.data.byRegion || []);
        if (regRes.success) setRegistrationData(regRes.data);
        if (typeRes.success) setTypeData((typeRes.data.byType || []).map((item) => ({ ...item, _id: PARTICIPANT_TYPE_LABELS[item._id] || item._id || 'Not specified' })));
        if (attRes.success) setAttendanceData(attRes.data);
        if (dailyRes.success) setDailyData(dailyRes.data.dailySummary || []);
        if (fbRes.success) setFeedbackData(fbRes.data);
        if (certRes.success) setCertificateData(certRes.data);
        if (trainingRes.success) setSessionData(trainingRes.data || []);
      } catch {
        toast.error('Failed to load report aggregations.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [filters.event, filters.eventDay, filters.training]);

  const sessionRows = useMemo(() => {
    const registrations = Object.fromEntries((registrationData?.byTraining || []).map((item) => [String(item.trainingId), item]));
    const attendance = Object.fromEntries((attendanceData?.byTraining || []).map((item) => [String(item.trainingId), item]));
    const feedback = Object.fromEntries((feedbackData?.byTraining || []).map((item) => [String(item.trainingId), item]));
    const certificates = Object.fromEntries((certificateData?.byTraining || []).map((item) => [String(item.trainingId), item.count]));
    return sessionData.filter((session) => !filters.training || String(session._id) === String(filters.training)).map((session) => ({ ...session, registrations: registrations[session._id]?.total || 0, approved: registrations[session._id]?.approved || 0, pending: registrations[session._id]?.pending || 0, rejected: registrations[session._id]?.rejected || 0, cancelled: registrations[session._id]?.cancelled || 0, attendance: attendance[session._id]?.statuses?.find((item) => item.status === 'present')?.count || 0, feedback: feedback[session._id]?.count || 0, rating: feedback[session._id]?.avgContent, trainerRating: feedback[session._id]?.avgTrainer, organizationRating: feedback[session._id]?.avgOrg, certificates: certificates[session._id] || 0 }));
  }, [sessionData, registrationData, attendanceData, feedbackData, certificateData, filters.training]);

  const staffWorkload = useMemo(() => {
    const trainers = {}; const moderators = {};
    sessionRows.forEach((session) => { const trainer = session.trainer?.name || 'Unassigned'; const moderator = session.moderator?.fullName || 'Unassigned'; trainers[trainer] = (trainers[trainer] || 0) + 1; moderators[moderator] = (moderators[moderator] || 0) + 1; });
    return { trainers: Object.entries(trainers).sort((a, b) => b[1] - a[1]), moderators: Object.entries(moderators).sort((a, b) => b[1] - a[1]) };
  }, [sessionRows]);

  const exportCsv = () => {
    const rows = [
      ['National Training Week Report'], ['Generated', new Date().toLocaleString()], [],
      ['Metric', 'Value'], ['Total Participants', overview?.totalParticipants || 0],
      ['Total Registrations', overview?.totalRegistrations || 0],
      ['Attendance Rate', `${attendanceData?.attendanceRate || 0}%`],
      ['Active Certificates', certificateData?.active ?? (overview?.totalCertificates || 0)],
      ['Revoked Certificates', certificateData?.revoked || 0],
      ['Average Content Rating', feedbackData?.summary?.avgContent?.toFixed(1) || '0.0'], [],
      ['Registration Status'], ['Status', 'Count'],
      ...(registrationData?.byStatus || []).map((item) => [item._id, item.count]), [],
      ['Participants by Region'], ['Region', 'Participants'],
      ...regionData.map((item) => [item._id || 'Not specified', item.count]), [],
      ['Participants by Audience Type'], ['Audience Type', 'Participants'],
      ...typeData.map((item) => [item._id || 'Not specified', item.count]), [],
      ['Session Details'], ['Session', 'Trainer', 'Moderator', 'Registrations', 'Approved', 'Present', 'Feedback', 'Rating', 'Certificates'],
      ...sessionRows.map((item) => [item.title, item.trainer?.name || 'Unassigned', item.moderator?.fullName || 'Unassigned', item.registrations, item.approved, item.pending, item.rejected, item.cancelled, item.attendance, item.feedback, item.rating?.toFixed?.(1) || '—', item.trainerRating?.toFixed?.(1) || '—', item.organizationRating?.toFixed?.(1) || '—', item.certificates]), [],
      ['Trainer Workload'], ['Trainer', 'Sessions'], ...staffWorkload.trainers.map(([name, count]) => [name, count]), [],
      ['Moderator Workload'], ['Moderator', 'Sessions'], ...staffWorkload.moderators.map(([name, count]) => [name, count]), [],
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
    { label: 'Active Certificates', value: certificateData?.active ?? (overview?.totalCertificates || 0), Icon: CheckBadgeIcon },
    { label: 'Average Rating', value: `${feedbackData?.summary?.avgContent?.toFixed(1) || '0.0'} / 5`, Icon: StarIcon },
    { label: 'Trainer Rating', value: `${feedbackData?.summary?.avgTrainer?.toFixed(1) || '0.0'} / 5`, Icon: StarIcon },
    { label: 'Organization Rating', value: `${feedbackData?.summary?.avgOrg?.toFixed(1) || '0.0'} / 5`, Icon: StarIcon },
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Registration status</h2><p className="mt-1 text-xs text-slate-500">Current registrations within the selected scope</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Count</th></tr></thead><tbody className="divide-y divide-slate-100">{registrationData?.byStatus?.length ? registrationData.byStatus.map((item) => <tr key={item._id}><td className="px-5 py-3 font-semibold capitalize text-slate-800">{item._id}</td><td className="px-5 py-3 text-right font-bold text-[#1a6b3c]">{item.count}</td></tr>) : <tr><td colSpan="2" className="px-5 py-8 text-center text-slate-500">No registration data is available yet.</td></tr>}</tbody></table></div></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Certificates</h2><p className="mt-1 text-xs text-slate-500">Active and revoked certificate totals</p></div><div className="grid grid-cols-3 gap-3 p-5 text-center"><div><p className="text-2xl font-black text-[#1a6b3c]">{certificateData?.active || 0}</p><p className="mt-1 text-xs text-slate-500">Active</p></div><div><p className="text-2xl font-black text-rose-600">{certificateData?.revoked || 0}</p><p className="mt-1 text-xs text-slate-500">Revoked</p></div><div><p className="text-2xl font-black text-slate-900">{certificateData?.total || 0}</p><p className="mt-1 text-xs text-slate-500">Total</p></div></div></div></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Session performance</h2><p className="mt-1 text-xs text-slate-500">Registrations, attendance, feedback, and certificates by session</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Session</th><th className="px-5 py-3">Trainer</th><th className="px-5 py-3">Moderator</th><th className="px-5 py-3">Registrations</th><th className="px-5 py-3">Present</th><th className="px-5 py-3">Feedback</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Certificates</th></tr></thead><tbody className="divide-y divide-slate-100">{sessionRows.length ? sessionRows.map((item) => <tr key={item._id}><td className="max-w-56 truncate px-5 py-3 font-bold text-slate-900">{item.title}</td><td className="px-5 py-3 text-xs text-slate-600">{item.trainer?.name || 'Unassigned'}</td><td className="px-5 py-3 text-xs text-slate-600">{item.moderator?.fullName || 'Unassigned'}</td><td className="px-5 py-3 font-semibold">{item.approved} / {item.registrations}</td><td className="px-5 py-3 text-[#1a6b3c]">{item.attendance}</td><td className="px-5 py-3">{item.feedback}</td><td className="px-5 py-3">{item.rating ? `${item.rating.toFixed(1)} / 5` : '—'}</td><td className="px-5 py-3">{item.certificates}</td></tr>) : <tr><td colSpan="8" className="px-5 py-10 text-center text-slate-500">No session data is available for the selected filters.</td></tr>}</tbody></table></div></div><div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Trainer workload</h2></div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100">{staffWorkload.trainers.map(([name, count]) => <tr key={name}><td className="px-5 py-3">{name}</td><td className="px-5 py-3 text-right font-bold text-[#1a6b3c]">{count}</td></tr>)}</tbody></table></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Moderator workload</h2></div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100">{staffWorkload.moderators.map(([name, count]) => <tr key={name}><td className="px-5 py-3">{name}</td><td className="px-5 py-3 text-right font-bold text-[#1a6b3c]">{count}</td></tr>)}</tbody></table></div></div>
      {sessionRows.some((item) => !item.trainer || !item.moderator) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Unassigned sessions need attention</p><p className="mt-1">{sessionRows.filter((item) => !item.trainer || !item.moderator).map((item) => `${item.title} (${!item.trainer ? 'trainer' : ''}${!item.trainer && !item.moderator ? ' and ' : ''}${!item.moderator ? 'moderator' : ''})`).join(', ')}</p></div>}
    </div>
  );
};

export default Reports;
