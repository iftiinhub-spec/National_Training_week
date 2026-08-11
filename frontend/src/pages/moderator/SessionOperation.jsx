import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export const SessionOperation = () => {
  const { trainingId } = useParams();
  const [training, setTraining] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meeting');
  const [completing, setCompleting] = useState(false);

  // Meeting Form
  const [meetingForm, setMeetingForm] = useState({
    platform: 'zoom',
    meetingUrl: '',
    meetingId: '',
    passcode: '',
    notes: '',
  });

  // QR Session State
  const [qrSession, setQrSession] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const fetchSessionData = useCallback(async () => {
    try {
      const [trRes, meetRes, partRes, attRes, fbRes] = await Promise.all([
        api.get(`/moderator/trainings/${trainingId}`),
        api.get(`/moderator/trainings/${trainingId}/meeting`).catch(() => ({ success: false })),
        api.get(`/moderator/trainings/${trainingId}/participants`).catch(() => ({ success: false })),
        api.get(`/moderator/trainings/${trainingId}/attendance`).catch(() => ({ success: false })),
        api.get(`/moderator/trainings/${trainingId}/feedback`).catch(() => ({ success: false })),
      ]);

      if (trRes.success) setTraining(trRes.data.training);
      if (meetRes.success && meetRes.data?.meeting) {
        setMeeting(meetRes.data.meeting);
        setMeetingForm({
          platform: meetRes.data.meeting.platform || 'zoom',
          meetingUrl: meetRes.data.meeting.meetingUrl || '',
          meetingId: meetRes.data.meeting.meetingId || '',
          passcode: meetRes.data.meeting.passcode || '',
          notes: meetRes.data.meeting.notes || '',
        });
      }
      if (partRes.success) setParticipants(partRes.data.registrations || []);
      if (attRes.success) setAttendance(attRes.data.records || []);
      if (fbRes.success) setFeedback(fbRes.data);
    } catch (err) {
      toast.error('Failed to load session data.');
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Save / Update Meeting
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    try {
      const endpoint = meeting ? `/moderator/trainings/${trainingId}/meeting` : `/moderator/trainings/${trainingId}/meeting`;
      const method = meeting ? 'put' : 'post';
      const res = await api[method](endpoint, meetingForm);
      if (res.success) {
        toast.success(meeting ? 'Meeting updated!' : 'Meeting created!');
        setMeeting(res.data.meeting);
      }
    } catch (err) {
      toast.error(err.message || 'Meeting save failed.');
    }
  };

  // Release Meeting to Participants
  const handleToggleRelease = async () => {
    try {
      const res = await api.patch(`/moderator/trainings/${trainingId}/meeting/release`, {
        isReleased: !meeting?.isReleased,
      });
      if (res.success) {
        toast.success(res.message);
        setMeeting(res.data.meeting);
      }
    } catch (err) {
      toast.error(err.message || 'Release status update failed.');
    }
  };

  // Send Trainer Email Invitation
  const handleSendTrainerInvite = async () => {
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/invitations/trainer`);
      if (res.success) {
        toast.success(res.message || 'Trainer invitation email sent!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send trainer invitation.');
    }
  };

  // Send Participant Email Invitations / Reminders
  const handleSendParticipantInvites = async (type = 'invitation') => {
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/invitations/participants`, { type });
      if (res.success) {
        toast.success(res.message || 'Emails sent to approved participants!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send participant emails.');
    }
  };

  // Open QR Session
  const handleOpenQR = async () => {
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/qr-session/open`);
      if (res.success) {
        setQrSession(res.data.session);
        setQrDataUrl(res.data.qrDataUrl);
        toast.success('QR Attendance session opened!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to open QR session.');
    }
  };

  // Close QR Session
  const handleCloseQR = async () => {
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/qr-session/close`);
      if (res.success) {
        setQrSession(null);
        setQrDataUrl('');
        toast.success('QR Session closed.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close QR session.');
    }
  };

  // Update Manual Attendance
  const handleUpdateAttendance = async (attendanceId, newStatus) => {
    try {
      const res = await api.patch(`/moderator/trainings/${trainingId}/attendance/${attendanceId}`, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Status updated to ${newStatus.toUpperCase()}`);
        fetchSessionData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance.');
    }
  };

  const handleCompleteTraining = async () => {
    const presentCount = attendance.filter((record) => record.status === 'present').length;
    const confirmed = window.confirm(`End this training session now? Attendance will be locked and certificates will be issued immediately to ${presentCount} approved participant${presentCount === 1 ? '' : 's'} currently marked present. This cannot be reopened.`);
    if (!confirmed) return;
    setCompleting(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/complete`);
      if (res.success) {
        setTraining(res.data.training);
        setQrSession(null);
        setQrDataUrl('');
        toast.success(res.message || 'Training completed and certificates generated.');
        fetchSessionData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete the training session.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading session operational controls..." />;
  if (!training) return <div className="p-8 text-center">Session not found.</div>;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="space-y-2">
        <Link to="/moderator" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a6b3c] hover:underline">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={training.status} />
              <span className="text-xs font-bold text-slate-500">
                Day {training.eventDay?.dayNumber}: {training.eventDay?.theme}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{training.title}</h1>
          </div>
          {training.status !== 'completed' ? (
            <button type="button" onClick={handleCompleteTraining} disabled={completing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-xs font-black text-white transition hover:bg-[#124d2a] disabled:cursor-not-allowed disabled:opacity-60">
              <CheckCircleIcon className="h-5 w-5" />{completing ? 'Completing…' : 'End Training Session'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-[#1a6b3c]"><CheckCircleIcon className="h-5 w-5" />Attendance locked · Certificates issued</span>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'meeting', name: 'Meeting Details', icon: VideoCameraIcon },
          { id: 'invitations', name: 'Invitations & Communications', icon: PaperAirplaneIcon },
          { id: 'attendance', name: 'QR & Manual Attendance', icon: QrCodeIcon },
          { id: 'participants', name: 'Approved Participants', icon: UserGroupIcon },
          { id: 'feedback', name: 'Session Evaluations', icon: ChatBubbleLeftEllipsisIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#1a6b3c] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEETING DETAILS */}
      {activeTab === 'meeting' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Meeting Configuration</h3>
              <p className="text-xs text-slate-500">Enter the meeting details supplied by Zoom, Teams, Google Meet, or your selected provider.</p>
            </div>
            {meeting && (
              <button
                onClick={handleToggleRelease}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  meeting.isReleased
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {meeting.isReleased ? 'Hide from Participants' : 'Release to Participants'}
              </button>
            )}
          </div>

          <form onSubmit={handleSaveMeeting} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Platform</label>
                <select
                  value={meetingForm.platform}
                  onChange={(e) => setMeetingForm({ ...meetingForm, platform: e.target.value, ...(e.target.value === 'google_meet' ? { meetingId: '', passcode: '' } : {}) })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                  required
                >
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other Online Platform</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting Link URL *</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={meetingForm.meetingUrl}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingUrl: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  required
                />
              </div>
            </div>

            {meetingForm.platform !== 'google_meet' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting ID <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. 845 1234 5678"
                  value={meetingForm.meetingId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Copy this from the scheduled {meetingForm.platform === 'zoom' ? 'Zoom' : meetingForm.platform === 'teams' ? 'Microsoft Teams' : 'online'} meeting. It is not generated by this system.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Passcode <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={meetingForm.passcode}
                  onChange={(e) => setMeetingForm({ ...meetingForm, passcode: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Enter the passcode provided with the meeting invitation. Leave it empty when the provider does not use one.</p>
              </div>
            </div>}

            {meetingForm.platform === 'google_meet' && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><strong>Google Meet normally needs only the meeting link.</strong> Meeting ID and passcode are therefore not requested for this platform.</div>}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Joining Instructions & Notes</label>
              <textarea
                rows={3}
                placeholder="Instructions for participants joining online..."
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {meeting ? 'Update Meeting Details' : 'Create Meeting Details'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: INVITATIONS & COMMUNICATIONS */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Communication & Invitation Center</h3>
            <p className="text-xs text-slate-500">Send meeting links directly to Trainer and approved participants via email.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Trainer Invitation Box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                Trainer / Speaker Email Invitation
              </h4>
              <p className="text-xs text-slate-600">
                Per requirement: Trainer is a managed profile (no system login needed). Sends official invitation email containing meeting link.
              </p>
              {training.trainer ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{training.trainer.name}</p>
                  <p className="text-slate-500">{training.trainer.email}</p>
                </div>
              ) : (
                <p className="text-xs text-rose-600 font-bold">No trainer assigned yet by Administrator.</p>
              )}

              <button
                onClick={handleSendTrainerInvite}
                disabled={!training.trainer || !meeting}
                className="w-full py-2.5 bg-[#155289] hover:bg-[#11426e] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                Send Trainer Meeting Invitation
              </button>
            </div>

            {/* Participant Invitations Box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PaperAirplaneIcon className="w-5 h-5 text-[#1a6b3c]" />
                Participant Broadcast Emails
              </h4>
              <p className="text-xs text-slate-600">
                Invitations include meeting access. Reminders include the exact remaining time but intentionally exclude meeting links and credentials.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleSendParticipantInvites('invitation')}
                  disabled={!meeting}
                  className="w-full py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  Send Invitation Email to Approved Participants
                </button>

                <button
                  onClick={() => handleSendParticipantInvites('reminder')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  Send Session Reminder Email
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: QR & MANUAL ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* QR Session Controls */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <QrCodeIcon className="w-5 h-5 text-[#1a6b3c]" />
                  Live Session QR Attendance Scanner
                </h3>
                <p className="text-xs text-slate-500">
                  Open a time-limited QR session to allow participants to check in live.
                </p>
              </div>

              {training.status === 'completed' ? (
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">Attendance locked</span>
              ) : qrSession ? (
                <button
                  onClick={handleCloseQR}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                >
                  Close Active QR Session
                </button>
              ) : (
                <button
                  onClick={handleOpenQR}
                  className="px-5 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Launch Live QR Session
                </button>
              )}
            </div>

            {/* Display Active QR Code & Token */}
            {qrSession && qrDataUrl && (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
                <span className="text-xs uppercase font-bold text-[#1a6b3c]">ACTIVE QR ATTENDANCE SESSION</span>
                <div className="bg-white p-4 inline-block rounded-xl shadow-md mx-auto">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-700">Training ID: <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded">{trainingId}</span></p>
                  <p className="font-bold text-slate-700">Session Token: <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded">{qrSession.sessionToken}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Session Attendance Roster</h3>
            
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="p-3">Participant Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Check-in Time</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{rec.participant?.fullName}</td>
                        <td className="p-3 text-slate-500">{rec.participant?.email}</td>
                        <td className="p-3"><StatusBadge status={rec.status} type="attendance" /></td>
                        <td className="p-3 text-slate-500">{rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString() : '—'}</td>
                        <td className="p-3">
                          <select
                            value={rec.status}
                            onChange={(e) => handleUpdateAttendance(rec._id, e.target.value)}
                            disabled={training.status === 'completed'}
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
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">No attendance records generated yet.</div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: PARTICIPANTS LIST */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Enrolled Participants Roster</h3>
          {participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((reg) => (
                    <tr key={reg._id}>
                      <td className="p-3 font-bold text-slate-900">{reg.participant?.fullName}</td>
                      <td className="p-3 text-slate-500">{reg.participant?.email}</td>
                      <td className="p-3 capitalize">{reg.participant?.participantType?.replace(/_/g, ' ')}</td>
                      <td className="p-3">{reg.participant?.organization || '—'}</td>
                      <td className="p-3"><StatusBadge status={reg.status} type="registration" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">No participant registrations yet.</div>
          )}
        </div>
      )}

      {/* TAB 5: SESSION FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Participant Feedback & Ratings</h3>
          {feedback && feedback.feedback?.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-center text-xs font-bold text-slate-700">
                <div>Content Avg: {feedback.stats?.avgContent} ★</div>
                <div>Trainer Avg: {feedback.stats?.avgTrainer} ★</div>
                <div>Org Avg: {feedback.stats?.avgOrganization} ★</div>
              </div>
              <div className="space-y-3">
                {feedback.feedback.map((fb) => (
                  <div key={fb._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-900 text-xs">{fb.participant?.fullName}</span>
                    {fb.comments && <p className="text-xs text-slate-600 italic">"{fb.comments}"</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">No evaluation feedback submitted yet.</div>
          )}
        </div>
      )}

    </div>
  );
};

export default SessionOperation;
