import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckBadgeIcon, SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline';

export const CertificatesManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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

  const handleRevoke = async (id) => {
    const reason = window.prompt('Enter reason for revoking this certificate:');
    if (!reason) return;

    try {
      const res = await api.patch(`/admin/certificates/${id}/revoke`, { reason });
      if (res.success) {
        toast.success('Certificate revoked.');
        fetchCertificates();
      }
    } catch (err) {
      toast.error(err.message || 'Revocation failed.');
    }
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
                        onClick={() => handleRevoke(cert._id)}
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

    </div>
  );
};

export default CertificatesManagement;
