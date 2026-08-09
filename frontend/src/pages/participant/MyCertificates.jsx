import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { CheckBadgeIcon, ArrowDownTrayIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/participant/certificates');
        if (res.success) {
          setCertificates(res.data.certificates || []);
        }
      } catch (err) {
        console.error('Error loading certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const handleDownload = async (certId, certificateIdString) => {
    try {
      const response = await fetch(`/api/participant/certificates/${certId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ntw_token')}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateIdString}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download certificate PDF.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading your earned certificates..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Certificates</h1>
        <p className="text-xs text-slate-500 mt-1">
          Official National Training Week certificates earned through verified session attendance.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-2xl p-6 border-2 border-emerald-500/80 shadow-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-[#1a6b3c] px-2.5 py-1 rounded-md">
                    {cert.certificateId}
                  </span>
                  <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Training Completed</span>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{cert.training?.title}</h3>
                </div>

                <p className="text-xs text-slate-500">
                  Issued on {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleDownload(cert._id, cert.certificateId)}
                  className="w-full py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckBadgeIcon}
          title="No certificates earned yet"
          message="Certificates are automatically issued after a training session is marked Completed and your attendance is logged Present."
        />
      )}

    </div>
  );
};

export default MyCertificates;
