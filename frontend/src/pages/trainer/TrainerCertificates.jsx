import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, CheckBadgeIcon, ShieldCheckIcon } from '@icons';
import api from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TrainerCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/trainer/certificates')
      .then((response) => setCertificates(response.data?.certificates || []))
      .catch((error) => toast.error(error.message || 'Unable to load certificates.'))
      .finally(() => setLoading(false));
  }, []);

  const download = async (certificate) => {
    setDownloading(certificate._id);
    try {
      const response = await fetch(`/api/trainer/certificates/${certificate._id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ntw_token')}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const url = window.URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `trainer-certificate-${certificate.certificateId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded.');
    } catch {
      toast.error('Unable to download the certificate PDF.');
    } finally { setDownloading(null); }
  };

  if (loading) return <LoadingSpinner label="Loading your appreciation certificates..." />;

  return <div className="space-y-6">
    <header>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a6b3c]">Trainer recognition</p>
      <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">My certificates</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your Certificate of Appreciation is issued automatically after each assigned session is completed.</p>
    </header>

    {certificates.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {certificates.map((certificate) => <article key={certificate._id} className="flex flex-col rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4"><span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold text-[#1a6b3c]">{certificate.certificateId}</span><ShieldCheckIcon className="h-7 w-7 shrink-0 text-[#1da156]" /></div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Certificate of Appreciation</p>
        <h2 className="mt-1 text-lg font-bold leading-snug text-slate-950">{certificate.training?.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{certificate.training?.event?.name || 'National Training Week'}</p>
        <p className="mt-4 text-xs text-slate-400">Issued {new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <button type="button" onClick={() => download(certificate)} disabled={downloading === certificate._id} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-4 text-sm font-bold text-white transition hover:bg-[#124d2a] disabled:cursor-wait disabled:opacity-60"><ArrowDownTrayIcon className="h-5 w-5" />{downloading === certificate._id ? 'Preparing PDF...' : 'Download certificate'}</button>
      </article>)}
    </div> : <EmptyState icon={CheckBadgeIcon} title="No certificates yet" message="A Certificate of Appreciation will appear here automatically after one of your assigned sessions is marked completed." />}
  </div>;
}
