import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Reports = () => {
  const [overview, setOverview] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const [ovRes, regRes, typeRes, attRes, dailyRes, fbRes] = await Promise.all([
        api.get('/admin/reports/overview'),
        api.get('/admin/reports/participants-by-region'),
        api.get('/admin/reports/participants-by-type'),
        api.get('/admin/reports/attendance'),
        api.get('/admin/reports/daily-attendance'),
        api.get('/admin/reports/feedback'),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (regRes.success) setRegionData(regRes.data.byRegion || []);
      if (typeRes.success) setTypeData(typeRes.data.byType || []);
      if (attRes.success) setAttendanceData(attRes.data);
      if (dailyRes.success) setDailyData(dailyRes.data.dailySummary || []);
      if (fbRes.success) setFeedbackData(fbRes.data);
    } catch (err) {
      toast.error('Failed to load report aggregations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner label="Aggregating live database report statistics..." />;

  const COLORS = ['#1a6b3c', '#155289', '#2563eb', '#9333ea', '#d97706', '#dc2626'];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">National Training Week System Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          All 10 documented post-event reports calculated live from database records.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Participants</span>
          <p className="text-3xl font-black text-slate-900 mt-1">{overview?.totalParticipants || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-[#1a6b3c] uppercase">Attendance Rate</span>
          <p className="text-3xl font-black text-[#1a6b3c] mt-1">{attendanceData?.attendanceRate || 0}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-purple-600 uppercase">Certificates Issued</span>
          <p className="text-3xl font-black text-purple-600 mt-1">{overview?.totalCertificates || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-amber-600 uppercase">Avg Content Rating</span>
          <p className="text-3xl font-black text-amber-600 mt-1">{feedbackData?.summary?.avgContent?.toFixed(1) || '0.0'} ★</p>
        </div>
      </div>

      {/* Chart Row 1: Participants by Region & Participant Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Region Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">1. Participants by Regional Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData}>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1a6b3c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Participant Type Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">2. Participants by Audience Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry._id}
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Daily Attendance Summary Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">3. Daily Attendance & Participation Rates (6 Event Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Event Day Theme</th>
                <th className="p-3">Date</th>
                <th className="p-3">Present Check-Ins</th>
                <th className="p-3">Total Enrolled</th>
                <th className="p-3">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {dailyData.map((d, i) => (
                <tr key={i}>
                  <td className="p-3 font-bold text-slate-900">{d.day}</td>
                  <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-emerald-600">{d.present}</td>
                  <td className="p-3">{d.total}</td>
                  <td className="p-3 font-bold text-[#1a6b3c]">{d.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
