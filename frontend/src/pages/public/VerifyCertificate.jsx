import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
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
    <div className="bg-white min-h-screen">
      
      {/* Hero */}
      <section className="relative py-20 text-white text-center bg-[#1da156]">
        <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 z-10">
          <div className="w-12 h-12 rounded-full bg-white text-[#1da156] flex items-center justify-center mx-auto mb-3">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            Certificate Verification
          </h1>
          <p className="text-white text-sm max-w-xl mx-auto leading-relaxed">
            Verify the authenticity of a National Training Week Certificate by entering the unique Certificate ID.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Input Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/10 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 text-black/50 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. NTW-2026-A1B2C3D4"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 uppercase bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#1da156] hover:bg-black text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </button>
          </form>
        </div>

        {/* Results Box */}
        {loading && <LoadingSpinner label="Checking certificate record..." />}

        {result && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#1da156] shadow-xl space-y-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-[#1da156]">
              <CheckCircleIcon className="w-8 h-8 text-[#1da156] shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-black">Valid Certificate Record</h3>
                <p className="text-xs text-[#1da156]">Official National Training Week Credential</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-black text-sm">
              <div className="space-y-1">
                <span className="text-xs text-black/50 uppercase font-bold">Certificate ID</span>
                <p className="font-mono font-bold text-black text-base">{result.certificateId}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-black/50 uppercase font-bold">Recipient Name</span>
                <p className="font-bold text-black text-base flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-[#1da156]" />
                  {result.participantName}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs text-black/50 uppercase font-bold">Training Session</span>
                <p className="font-bold text-lg text-[#1da156]">"{result.trainingTitle}"</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-black/50 uppercase font-bold">Event Edition</span>
                <p className="font-medium text-black">{result.eventName || 'NTW 2026'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-black/50 uppercase font-bold">Issue Date</span>
                <p className="font-medium text-black flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#1da156]" />
                  {new Date(result.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white border-2 border-black/20 rounded-2xl p-6 text-center space-y-3">
            <XCircleIcon className="w-10 h-10 text-black mx-auto" />
            <h3 className="text-lg font-bold text-black">Certificate Invalid or Not Found</h3>
            <p className="text-xs text-black/70 max-w-md mx-auto">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyCertificate;
