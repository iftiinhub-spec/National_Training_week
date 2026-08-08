import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const VerifyCertificate = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [certificateId, setCertificateId] = useState(initialId);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (idToVerify) => {
    const targetId = idToVerify || certificateId;
    if (!targetId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.get(`/public/verify/${targetId.trim()}`);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Certificate verification failed. The provided ID may be invalid or revoked.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1a6b3c] flex items-center justify-center mx-auto mb-2">
          <ShieldCheckIcon className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Public Certificate Verification
        </h1>
        <p className="text-slate-600 text-sm">
          Verify the authenticity of a Hormuud University National Training Week Certificate by entering the unique Certificate ID.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="e.g. HU-NTW-2026-A1B2C3D4"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>
      </div>

      {/* Results Box */}
      {loading && <LoadingSpinner label="Checking certificate record..." />}

      {result && (
        <div className="bg-white rounded-2xl p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <CheckCircleIcon className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Valid Certificate Record</h3>
              <p className="text-xs text-emerald-700">Official Hormuud University National Training Week Credential</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-slate-700 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Certificate ID</span>
              <p className="font-mono font-bold text-slate-900 text-base">{result.certificateId}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Recipient Name</span>
              <p className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-[#1a6b3c]" />
                {result.participantName}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs text-slate-400 uppercase font-bold">Training Session</span>
              <p className="font-bold text-slate-900 text-lg text-[#1a6b3c]">"{result.trainingTitle}"</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Event Edition</span>
              <p className="font-medium text-slate-800">{result.eventName || 'Hormuud University NTW 2026'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Issue Date</span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#1a6b3c]" />
                {new Date(result.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <XCircleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900">Certificate Invalid or Not Found</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </div>
      )}

    </div>
  );
};

export default VerifyCertificate;
