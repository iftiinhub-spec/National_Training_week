import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { CheckCircleIcon, ExclamationTriangleIcon, QrCodeIcon } from '@icons';

const QRCheckIn = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const trainingId = searchParams.get('t')?.trim() || '';
  const sessionToken = searchParams.get('s')?.trim() || '';
  const code = searchParams.get('c')?.trim() || '';
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const returnPath = `/qr-checkin?t=${encodeURIComponent(trainingId)}&s=${encodeURIComponent(sessionToken)}&c=${encodeURIComponent(code)}`;

  const checkIn = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/participant/qr-checkin', { trainingId, sessionToken, code });
      if (res.success) setResult(res.data?.attendance || true);
    } catch (err) {
      setError(err.message || 'Check-in failed. The QR session may be closed or expired.');
    } finally { setSubmitting(false); }
  };

  if (loading) return null;
  const invalid = !trainingId || !sessionToken || !code;

  return <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-16">
    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-[#1a6b3c] px-6 py-8 text-center text-white"><QrCodeIcon className="mx-auto h-11 w-11" /><p className="mt-4 text-sm font-bold text-white/75">Live session attendance</p><h1 className="mt-2 text-2xl font-bold">QR Check-In</h1></div>
      <div className="p-6 sm:p-8">
        {invalid ? <div className="text-center"><ExclamationTriangleIcon className="mx-auto h-10 w-10 text-amber-500" /><h2 className="mt-3 font-bold text-slate-950">Invalid QR code</h2><p className="mt-2 text-sm leading-6 text-slate-500">This link does not contain valid session details. Scan the current QR code displayed by your moderator.</p></div>
        : !isAuthenticated ? <div className="text-center"><h2 className="text-lg font-bold text-slate-950">Sign in to continue</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your QR details are ready. Sign in with the participant account used for this training registration.</p><Link to={`/signin?redirect=${encodeURIComponent(returnPath)}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1a6b3c] px-6 text-sm font-bold text-white">Sign in and return</Link></div>
        : user?.role !== 'participant' ? <div className="text-center"><ExclamationTriangleIcon className="mx-auto h-10 w-10 text-amber-500" /><h2 className="mt-3 font-bold text-slate-950">Participant account required</h2><p className="mt-2 text-sm text-slate-500">Attendance check-in is available only to approved participant accounts.</p></div>
        : result ? <div className="text-center"><CheckCircleIcon className="mx-auto h-14 w-14 text-[#1a6b3c]" /><h2 className="mt-4 text-xl font-bold text-slate-950">Attendance confirmed</h2><p className="mt-2 text-sm text-slate-500">You have been marked present for this training session.</p><Link to="/portal/attendance" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-700">View attendance record</Link></div>
        : <div><h2 className="text-lg font-bold text-slate-950">Confirm your attendance</h2><p className="mt-2 text-sm leading-6 text-slate-500">Signed in as <strong>{user.fullName}</strong>. The system will verify that your registration is approved and that this QR session is still active.</p>{error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}<button type="button" onClick={checkIn} disabled={submitting} className="mt-6 w-full rounded-xl bg-[#1a6b3c] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Verifying attendance…' : 'Confirm check-in'}</button></div>}
      </div>
    </div>
  </div>;
};

export default QRCheckIn;
