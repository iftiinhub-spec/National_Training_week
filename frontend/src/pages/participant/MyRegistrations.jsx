import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/participant/registrations');
      if (res.success) {
        setRegistrations(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleViewMeeting = async (regId) => {
    try {
      const res = await api.get(`/participant/registrations/${regId}`);
      if (res.success && res.data) {
        if (res.data.meeting) {
          setSelectedMeeting(res.data.meeting);
          setModalOpen(true);
        } else {
          toast.error('Meeting details have not been released by the Moderator yet.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch meeting info.');
    }
  };

  const handleCancel = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel your registration for this session?')) return;
    try {
      const res = await api.patch(`/participant/registrations/${regId}/cancel`);
      if (res.success) {
        toast.success('Registration cancelled.');
        fetchRegistrations();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading your registered trainings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Registered Trainings</h1>
        <p className="text-xs text-slate-500 mt-1">
          View your training enrollment statuses, access released meeting links, or manage registrations.
        </p>
      </div>

      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const tr = reg.training || {};
            return (
              <div
                key={reg._id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={reg.status} type="registration" />
                    <span className="text-xs text-slate-400">
                      Enrolled: {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{tr.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <CalendarIcon className="w-4 h-4 text-[#1a6b3c]" />
                      <span>{tr.date ? new Date(tr.date).toLocaleDateString() : 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <ClockIcon className="w-4 h-4 text-[#1a6b3c]" />
                      <span>{tr.startTime} - {tr.endTime}</span>
                    </div>
                    {tr.trainer && (
                      <span className="text-slate-700 font-semibold">
                        Trainer: {tr.trainer.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {reg.status === 'approved' && (
                    <button
                      onClick={() => handleViewMeeting(reg._id)}
                      className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      <span>View Online Meeting</span>
                    </button>
                  )}

                  {['pending', 'approved'].includes(reg.status) && (
                    <button
                      onClick={() => handleCancel(reg._id)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={AcademicCapIcon}
          title="No registered training sessions"
          message="Browse the published trainings and click register to participate."
        />
      )}

      {/* Meeting Details Modal */}
      {modalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <VideoCameraIcon className="w-5 h-5 text-[#1a6b3c]" />
                Online Meeting Access Details
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs uppercase font-bold text-[#1a6b3c] block">Platform</span>
                <span className="font-bold text-slate-900 capitalize">{selectedMeeting.platform}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Meeting Joining Link</span>
                <a
                  href={selectedMeeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs break-all hover:underline"
                >
                  {selectedMeeting.meetingUrl}
                </a>
              </div>

              {selectedMeeting.meetingId && (
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-500">Meeting ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedMeeting.meetingId}</span>
                </div>
              )}

              {selectedMeeting.passcode && (
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-500">Passcode:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedMeeting.passcode}</span>
                </div>
              )}

              {selectedMeeting.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong>Notes:</strong> {selectedMeeting.notes}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={selectedMeeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-sm transition-colors"
              >
                Launch & Join Meeting Now
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRegistrations;
