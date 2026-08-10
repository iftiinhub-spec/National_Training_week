import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PhotoIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const CertificatesManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchCertificates = async () => {
    try {
      const [certRes, trRes] = await Promise.all([
        api.get('/admin/certificates'),
        api.get('/admin/trainings?status=completed'),
      ]);

      if (certRes.success) setCertificates(certRes.data || []);
      if (trRes.success) {
        setTrainings(trRes.data || []);
        if (trRes.data?.length > 0) setSelectedTraining(trRes.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load certificates data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleBulkGenerate = async () => {
    if (!selectedTraining) {
      toast.error('Select a completed training to bulk generate certificates.');
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await api.post('/admin/certificates/bulk-generate', { trainingId: selectedTraining });
      if (res.success) {
        toast.success(res.message || 'Bulk certificate issuance complete!');
        fetchCertificates();
      }
    } catch (err) {
      toast.error(err.message || 'Bulk issuance failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleRevoke = async (event) => {
    event.preventDefault();
    if (revokeReason.trim().length < 5) return toast.error('Please provide a clear reason of at least 5 characters.');
    setRevoking(true);
    try {
      const res = await api.patch(`/admin/certificates/${revokeTarget._id}/revoke`, { reason: revokeReason.trim() });
      if (res.success) {
        toast.success('Certificate revoked.');
        setRevokeTarget(null);
        setRevokeReason('');
        fetchCertificates();
      }
    } catch (err) {
      toast.error(err.message || 'Revocation failed.');
    } finally { setRevoking(false); }
  };

  if (loading) return <LoadingSpinner label="Loading certificate management..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Certificates Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce eligibility (Approved + Present + Completed), bulk issue digital certificates, and revoke credentials.
          </p>
        </div>
        <Link to="/admin/settings#certificate-signature" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1a6b3c] px-4 text-sm font-bold text-[#1a6b3c] hover:bg-emerald-50"><PhotoIcon className="h-5 w-5" /> Upload certificate signature</Link>
      </div>

      {/* Bulk Issuance Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-emerald-600" />
          Bulk Issue Certificates for Completed Training
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedTraining}
            onChange={(e) => setSelectedTraining(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          >
            <option value="">Select Completed Training Session</option>
            {trainings.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>

          <button
            onClick={handleBulkGenerate}
            disabled={bulkSubmitting || !selectedTraining}
            className="px-6 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {bulkSubmitting ? 'Issuing Certificates...' : 'Run Bulk Certificate Generator'}
          </button>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Recipient Name</th>
                <th className="p-4">Training Title</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {certificates.map((cert) => (
                <tr key={cert._id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-900">{cert.certificateId}</td>
                  <td className="p-4 font-bold">{cert.participant?.fullName}</td>
                  <td className="p-4 text-[#1a6b3c] font-semibold">{cert.training?.title}</td>
                  <td className="p-4">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      cert.isRevoked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {cert.isRevoked ? 'Revoked' : 'Active / Valid'}
                    </span>
                  </td>
                  <td className="p-4">
                    {!cert.isRevoked && (
                      <button
                        onClick={() => setRevokeTarget(cert)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px]"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {revokeTarget && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRevokeTarget(null); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="revoke-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-rose-600">Permanent credential action</p><h2 id="revoke-title" className="mt-1 text-xl font-bold text-slate-950">Revoke certificate?</h2></div><button type="button" aria-label="Close revocation dialog" onClick={() => setRevokeTarget(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><XMarkIcon className="h-5 w-5" /></button></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Public verification will immediately show <strong>{revokeTarget.certificateId}</strong> as revoked. Record a clear administrative reason.</p>
          <form onSubmit={handleRevoke} className="mt-5"><label htmlFor="revoke-reason" className="text-sm font-bold text-slate-800">Revocation reason</label><textarea id="revoke-reason" autoFocus required minLength={5} maxLength={300} rows={4} value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="e.g. Issued using an incorrect participant record" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100" /><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setRevokeTarget(null)} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={revoking} className="min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white disabled:opacity-60">{revoking ? 'Revoking…' : 'Revoke certificate'}</button></div></form>
        </section>
      </div>}

    </div>
  );
};

export default CertificatesManagement;
