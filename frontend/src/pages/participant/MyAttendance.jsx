import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import QRScanModal from './QRScanModal';
import { QrCodeIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export const MyAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/participant/attendance');
      if (res.success) {
        setRecords(res.data.attendance || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) return <LoadingSpinner label="Loading attendance records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Read-only log of your marked session attendance (Present / Absent / Late).
          </p>
        </div>

        <button
          onClick={() => setQrModalOpen(true)}
          className="px-5 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <QrCodeIcon className="w-4 h-4" />
          <span>Enter Check-In Code</span>
        </button>
      </div>

      {records.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="p-4">Training Session</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4">Check-in Time</th>
                  <th className="p-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {rec.training?.title || 'Session'}
                    </td>
                    <td className="p-4">
                      {rec.training?.date ? new Date(rec.training.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={rec.status} type="attendance" />
                    </td>
                    <td className="p-4">
                      {rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString() : '—'}
                    </td>
                    <td className="p-4 uppercase font-semibold text-[10px] text-slate-500">
                      {rec.method || 'manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardDocumentCheckIcon}
          title="No attendance records marked yet"
          message="Once you attend sessions and your check-in is logged by the Moderator, records will appear here."
        />
      )}

      <QRScanModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSuccess={fetchAttendance}
      />

    </div>
  );
};

export default MyAttendance;
