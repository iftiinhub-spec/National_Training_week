import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

export const AttendanceManagement = () => {
  const confirmAction = useConfirmDialog();
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await api.get('/admin/trainings?limit=100');
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

  const filteredTrainings = useMemo(() => trainings.filter((item) => (!filters.event || String(item.event?._id || item.event) === filters.event) && (!filters.eventDay || String(item.eventDay?._id || item.eventDay) === filters.eventDay)), [trainings, filters.event, filters.eventDay]);
  useEffect(() => {
    if (filters.training) setSelectedTraining(filters.training);
    else setSelectedTraining(filteredTrainings[0]?._id || '');
  }, [filters.training, filteredTrainings]);

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
    } else {
      setRecords([]);
      setStats(null);
    }
  }, [selectedTraining]);

  const handleUpdateStatus = async (record, newStatus) => {
    // On a completed session the only permitted change is an unmarked participant to present,
    // and it cannot be undone afterwards — so confirm it explicitly.
    if (attendanceLocked) {
      if (newStatus !== 'present') return;
      if (!await confirmAction({
        title: `Mark ${record.participant?.fullName || 'this participant'} present?`,
        message: 'This session is already completed, so the record locks once it is set and cannot be changed back here. Their certificate will be issued and emailed.',
        confirmLabel: 'Mark present',
      })) return;
    }

    try {
      const res = await api.patch(`/admin/trainings/${selectedTraining}/attendance/${record._id}`, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(res.message || `Attendance updated to ${newStatus}`);
        fetchAttendance(selectedTraining);
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((rec) => (
      (rec.participant?.fullName || '').toLowerCase().includes(term)
      || (rec.participant?.email || '').toLowerCase().includes(term)
    ));
  }, [records, search]);

  const activeTraining = useMemo(
    () => trainings.find((item) => item._id === selectedTraining),
    [trainings, selectedTraining],
  );
  const attendanceLocked = activeTraining?.status === 'completed';

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

      </div>

      <AdminProgramFilters value={filters} onChange={setFilters} />

      {stats && (
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-500 block">Total</span><span className="text-xl font-bold text-slate-900">{stats.total}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-emerald-600 block">Present</span><span className="text-xl font-bold text-emerald-600">{stats.present}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-rose-600 block">Absent</span><span className="text-xl font-bold text-rose-600">{stats.absent}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-amber-600 block">Late</span><span className="text-xl font-bold text-amber-600">{stats.late}</span></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-400 block">Not Marked</span><span className="text-xl font-bold text-slate-500">{stats.not_marked}</span></div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants by name or email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium"
          />
        </div>
        {attendanceLocked && (
          <p className="text-[11px] font-medium text-slate-500 sm:max-w-sm sm:text-right">
            This session is completed. You can still mark a <span className="font-bold">Not Marked</span> participant present — everyone already marked stays locked.
          </p>
        )}
      </div>

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
                <th className="p-4">{attendanceLocked ? 'Correction (locked)' : 'Correction'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {visibleRecords.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{rec.participant?.fullName}</td>
                  <td className="p-4 text-slate-500">{rec.participant?.email}</td>
                  <td className="p-4"><StatusBadge status={rec.status} type="attendance" /></td>
                  <td className="p-4">{rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString() : '—'}</td>
                  <td className="p-4 uppercase text-[10px] font-bold text-slate-400">{rec.method}</td>
                  <td className="p-4">
                    <select
                      value={rec.status}
                      onChange={(e) => handleUpdateStatus(rec, e.target.value)}
                      disabled={attendanceLocked && rec.status !== 'not_marked'}
                      title={attendanceLocked
                        ? (rec.status === 'not_marked'
                          ? 'This session is completed. You can mark this participant present, but the record locks afterwards.'
                          : 'This session is completed and this participant is already marked, so the record is locked.')
                        : undefined}
                      className="p-1 rounded border border-slate-300 text-xs font-semibold bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="present">Present</option>
                      {(!attendanceLocked || rec.status === 'absent') && <option value="absent">Absent</option>}
                      {(!attendanceLocked || rec.status === 'late') && <option value="late">Late</option>}
                      <option value="not_marked">Not Marked</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!selectedTraining && <p className="p-12 text-center text-sm text-slate-500">No training session matches these filters.</p>}
          {selectedTraining && !visibleRecords.length && (
            <p className="p-12 text-center text-sm text-slate-500">
              {search ? `No participant matches "${search}".` : 'No attendance records for this session yet.'}
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default AttendanceManagement;
