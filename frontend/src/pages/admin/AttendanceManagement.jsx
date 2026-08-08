import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AttendanceManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await api.get('/admin/trainings');
        if (res.success && res.data?.length > 0) {
          setTrainings(res.data);
          setSelectedTraining(res.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load trainings.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, []);

  const fetchAttendance = async (trainingId) => {
    if (!trainingId) return;
    try {
      const res = await api.get(`/admin/trainings/${trainingId}/attendance`);
      if (res.success) {
        setRecords(res.data.records || []);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load attendance records.');
    }
  };

  useEffect(() => {
    if (selectedTraining) {
      fetchAttendance(selectedTraining);
    }
  }, [selectedTraining]);

  const handleUpdateStatus = async (attendanceId, newStatus) => {
    try {
      const res = await api.patch(`/admin/trainings/${selectedTraining}/attendance/${attendanceId}`, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Attendance updated to ${newStatus}`);
        fetchAttendance(selectedTraining);
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading attendance management..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin attendance override & correction console across all training sessions.
          </p>
        </div>

        <select
          value={selectedTraining}
          onChange={(e) => setSelectedTraining(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
        >
          {trainings.map((t) => (
            <option key={t._id} value={t._id}>{t.title}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-500 block">Total</span><span className="text-xl font-bold text-slate-900">{stats.total}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-emerald-600 block">Present</span><span className="text-xl font-bold text-emerald-600">{stats.present}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-rose-600 block">Absent</span><span className="text-xl font-bold text-rose-600">{stats.absent}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-amber-600 block">Late</span><span className="text-xl font-bold text-amber-600">{stats.late}</span></div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Participant</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Check-in Time</th>
                <th className="p-4">Method</th>
                <th className="p-4">Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {records.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{rec.participant?.fullName}</td>
                  <td className="p-4 text-slate-500">{rec.participant?.email}</td>
                  <td className="p-4"><StatusBadge status={rec.status} type="attendance" /></td>
                  <td className="p-4">{rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString() : '—'}</td>
                  <td className="p-4 uppercase text-[10px] font-bold text-slate-400">{rec.method}</td>
                  <td className="p-4">
                    <select
                      value={rec.status}
                      onChange={(e) => handleUpdateStatus(rec._id, e.target.value)}
                      className="p-1 rounded border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="not_marked">Not Marked</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AttendanceManagement;
