import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ButtonSpinner from '../../components/common/ButtonSpinner';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import {
  VideoCameraIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  LinkIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@icons';

export const SessionOperation = () => {
  const confirmAction = useConfirmDialog();
  const { trainingId } = useParams();
  const [training, setTraining] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meeting');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [completing, setCompleting] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [invitingTrainer, setInvitingTrainer] = useState(false);
  const [invitingParticipants, setInvitingParticipants] = useState(false);
  const [qrPending, setQrPending] = useState(false);
  const [copying, setCopying] = useState(false);
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState('');

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
  const [checkUrl, setCheckUrl] = useState('');
  const [qrFullscreen, setQrFullscreen] = useState(false);

  const fetchSessionData = useCallback(async () => {
    try {
      const [trRes, meetRes, attRes, qrRes] = await Promise.all([
        api.get(`/moderator/trainings/${trainingId}`),
        api.get(`/moderator/trainings/${trainingId}/meeting`).catch(() => ({ success: false })),
        api.get(`/moderator/trainings/${trainingId}/attendance`).catch(() => ({ success: false })),
        api.get(`/moderator/trainings/${trainingId}/qr-session/current`).catch(() => ({ success: false })),
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
      if (attRes.success) setAttendance(attRes.data.records || []);
      if (qrRes.success) {
        setQrSession({ isOpen: true, expiresAt: qrRes.data.expiresAt });
        setQrDataUrl(qrRes.data.qrDataUrl);
        setCheckUrl(qrRes.data.checkUrl || '');
      }
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
    setSavingMeeting(true);
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
    } finally {
      setSavingMeeting(false);
    }
  };

  // Send Trainer Email Invitation
  const handleSendTrainerInvite = async () => {
    setInvitingTrainer(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/invitations/trainer`);
      if (res.success) {
        toast.success(res.message || 'Trainer invitation email sent!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send trainer invitation.');
    } finally {
      setInvitingTrainer(false);
    }
  };

  // Send participant invitations manually; reminders are automatic.
  const handleSendParticipantInvitation = async () => {
    setInvitingParticipants(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/invitations/participants`, { type: 'invitation' });
      if (res.success) {
        toast.success(res.message || 'Emails sent to approved participants!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send participant emails.');
    } finally {
      setInvitingParticipants(false);
    }
  };

  // Open QR Session
  const handleOpenQR = async () => {
    setQrPending(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/qr-session/open`);
      if (res.success) {
        setQrSession(res.data.session);
        setQrDataUrl(res.data.qrDataUrl);
        setCheckUrl(res.data.checkUrl || '');
        toast.success('QR Attendance session opened!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to open QR session.');
    } finally {
      setQrPending(false);
    }
  };

  // Close QR Session
  const handleCloseQR = async () => {
    setQrPending(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/qr-session/close`);
      if (res.success) {
        setQrSession(null);
        setQrDataUrl('');
        setCheckUrl('');
        setQrFullscreen(false);
        toast.success('QR Session closed.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close QR session.');
    } finally {
      setQrPending(false);
    }
  };

  useEffect(() => {
    if (!qrFullscreen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setQrFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [qrFullscreen]);

  const copyCheckUrl = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(checkUrl);
      toast.success('Check-in link copied.');
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    } finally {
      setCopying(false);
    }
  };

  // Roster filtered by the moderator's search so a participant can be found
  // quickly when marking attendance manually.
  const visibleAttendance = useMemo(() => {
    const term = attendanceSearch.trim().toLowerCase();
    if (!term) return attendance;
    return attendance.filter((rec) =>
      `${rec.participant?.fullName || ''} ${rec.participant?.email || ''}`.toLowerCase().includes(term)
    );
  }, [attendance, attendanceSearch]);

  // Update Manual Attendance
  const handleUpdateAttendance = async (attendanceId, newStatus) => {
    setUpdatingAttendanceId(attendanceId);
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
    } finally {
      setUpdatingAttendanceId('');
    }
  };

  const handleCompleteTraining = async () => {
    const presentCount = attendance.filter((record) => record.status === 'present').length;
    const confirmed = await confirmAction({ title: 'Complete this session?', message: `Attendance will be locked. Certificates will be issued to ${presentCount} approved participant${presentCount === 1 ? '' : 's'} marked present, and the trainer will receive a Certificate of Appreciation. This session cannot be reopened.`, confirmLabel: 'Complete session', tone: 'warning' });
    if (!confirmed) return;
    setCompleting(true);
    try {
      const res = await api.post(`/moderator/trainings/${trainingId}/complete`);
      if (res.success) {
        setTraining(res.data.training);
        setQrSession(null);
        setQrDataUrl('');
        setCheckUrl('');
        setQrFullscreen(false);
        toast.success(res.message || 'Training completed and certificate delivery queued.');
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
  const assignedTrainers = training.trainers?.length ? training.trainers : training.trainer ? [training.trainer] : [];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="space-y-2">
        <Link to="/moderator" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a6b3c] hover:underline">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <StatusBadge status={training.status} />
              <span className="text-xs font-bold text-slate-500">
                Day {training.eventDay?.dayNumber}: {training.eventDay?.theme}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{training.title}</h1>
          </div>
          {training.status !== 'completed' ? (
            <button type="button" onClick={handleCompleteTraining} disabled={completing}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1a6b3c] px-5 text-xs font-black text-white transition hover:bg-[#124d2a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {completing ? <ButtonSpinner /> : <CheckCircleIcon className="h-5 w-5" />}{completing ? 'Completing…' : 'End Training Session'}
            </button>
          ) : (
            <span className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xs font-black text-[#1a6b3c] sm:w-auto sm:text-left"><CheckCircleIcon className="h-5 w-5 shrink-0" />Attendance locked · Certificates issued</span>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'meeting', name: 'Meeting Details', icon: VideoCameraIcon },
          { id: 'invitations', name: 'Invitations & Communications', icon: PaperAirplaneIcon },
          { id: 'attendance', name: 'QR & Manual Attendance', icon: QrCodeIcon },
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
              disabled={savingMeeting}
              className="inline-flex min-h-11 items-center justify-center gap-2 py-2.5 px-6 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingMeeting && <ButtonSpinner />}
              {savingMeeting ? 'Saving…' : meeting ? 'Update Meeting Details' : 'Create Meeting Details'}
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
              {assignedTrainers.length ? (
                <div className="space-y-2">
                  {assignedTrainers.map((trainer) => <div key={trainer._id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1"><p className="font-bold text-slate-900">{trainer.name}</p><p className="text-slate-500">{trainer.email || 'No email address'}</p></div>)}
                </div>
              ) : (
                <p className="text-xs text-rose-600 font-bold">No trainer assigned yet by Administrator.</p>
              )}

              <button
                onClick={handleSendTrainerInvite}
                disabled={!assignedTrainers.length || !meeting || invitingTrainer}
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 py-2.5 bg-[#155289] hover:bg-[#11426e] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invitingTrainer && <ButtonSpinner />}
                {invitingTrainer ? 'Sending…' : 'Send Trainer Meeting Invitations'}
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
                  onClick={handleSendParticipantInvitation}
                  disabled={!meeting || invitingParticipants}
                  className="inline-flex w-full min-h-11 items-center justify-center gap-2 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {invitingParticipants && <ButtonSpinner />}
                  {invitingParticipants ? 'Sending…' : 'Send Invitation Email to Approved Participants'}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: QR & MANUAL ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Live check-in */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <QrCodeIcon className="h-5 w-5 text-[#1a6b3c]" />
                  Live check-in
                </h3>
                <p className="mt-1 text-xs text-slate-500">Participants scan this code to mark themselves present.</p>
              </div>

              <div className="flex items-center gap-2">
                {training.status === 'completed' ? (
                  <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">Attendance locked</span>
                ) : qrSession ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#1a6b3c]">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#1a6b3c]" />
                      Live
                    </span>
                    <button type="button" onClick={handleCloseQR} disabled={qrPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                      {qrPending && <ButtonSpinner size="xs" />}
                      {qrPending ? 'Closing…' : 'Close session'}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleOpenQR} disabled={qrPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#124d2a] disabled:cursor-not-allowed disabled:opacity-60">
                    {qrPending && <ButtonSpinner size="xs" />}
                    {qrPending ? 'Starting…' : 'Start check-in'}
                  </button>
                )}
              </div>
            </div>

            {qrSession && qrDataUrl ? (
              <div className="p-6">
                <div className="mx-auto flex flex-col items-center justify-center gap-7 sm:flex-row sm:items-center">
                  {/* The quiet zone must stay light in both themes or scanners struggle to lock on. */}
                  <div className="shrink-0 rounded-2xl border border-slate-200 p-5 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                    <img src={qrDataUrl} alt="Check-in code for this session" className="h-60 w-60" />
                  </div>

                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-slate-900">Check-in is active</p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                      This code does not refresh. It expires at {new Date(qrSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                    </p>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      {checkUrl && (
                        <button type="button" onClick={copyCheckUrl} disabled={copying} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                          {copying ? <ButtonSpinner size="md" /> : <LinkIcon className="h-5 w-5" />}
                          {copying ? 'Copying…' : 'Copy link'}
                        </button>
                      )}
                      <button type="button" onClick={() => setQrFullscreen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white transition-colors hover:bg-[#124d2a]">
                        <QrCodeIcon className="h-5 w-5" />
                        Show fullscreen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-6 text-xs text-slate-500">
                {training.status === 'completed'
                  ? 'This session is complete, so check-in is closed.'
                  : 'Start check-in to display a scannable code for this session.'}
              </p>
            )}
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-900">Session Attendance Roster</h3>
              {attendance.length > 0 && (
                <div className="relative w-full sm:max-w-xs">
                  <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    aria-label="Search participants by name or email"
                    placeholder="Search participants..."
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15"
                  />
                </div>
              )}
            </div>

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
                    {visibleAttendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{rec.participant?.fullName}</td>
                        <td className="p-3 text-slate-500">{rec.participant?.email}</td>
                        <td className="p-3"><StatusBadge status={rec.status} type="attendance" /></td>
                        <td className="p-3 text-slate-500">{rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString() : '—'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={rec.status}
                              onChange={(e) => handleUpdateAttendance(rec._id, e.target.value)}
                              disabled={training.status === 'completed' || updatingAttendanceId === rec._id}
                              className="p-1 rounded border border-slate-300 text-xs font-semibold bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                              <option value="not_marked">Not Marked</option>
                            </select>
                            {updatingAttendanceId === rec._id && <ButtonSpinner size="xs" className="text-[#1a6b3c]" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleAttendance.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">No participant matches &ldquo;{attendanceSearch}&rdquo;.</div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">No attendance records generated yet.</div>
            )}
          </div>

        </div>
      )}

      {qrFullscreen && qrDataUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen check-in code"
          onClick={() => setQrFullscreen(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 p-6"
          style={{ backgroundColor: '#ffffff' }}
        >
          <p className="text-center text-2xl font-black text-slate-900 sm:text-3xl">{training.title}</p>
          <img src={qrDataUrl} alt="Check-in code for this session" className="h-[min(70vh,70vw)] w-[min(70vh,70vw)]" />
          <p className="text-center text-sm font-semibold text-slate-600">Scan to check in</p>
          <button
            type="button"
            onClick={() => setQrFullscreen(false)}
            className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      )}

    </div>
  );
};

export default SessionOperation;
