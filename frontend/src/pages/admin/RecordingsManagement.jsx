import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { PlusIcon, VideoCameraIcon, EyeIcon, EyeSlashIcon, ArchiveBoxArrowDownIcon, ArrowPathIcon } from '@icons';

export const RecordingsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [recordings, setRecordings] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ event: '', eventDay: '', training: '', archived: 'false' });

  const [form, setForm] = useState({
    training: '',
    title: '',
    url: '',
    thumbnail: '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [recRes, trRes] = await Promise.all([
        api.get(`/admin/recordings?${new URLSearchParams({ ...filters, limit: '100' }).toString()}`),
        api.get('/admin/trainings?limit=100'),
      ]);

      if (recRes.success) setRecordings(recRes.data || []);
      if (trRes.success) {
        setTrainings(trRes.data || []);
        if (trRes.data?.length > 0) {
          setForm((prev) => ({ ...prev, training: trRes.data[0]._id }));
        }
      }
    } catch (err) {
      toast.error('Failed to load recordings.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/recordings', form);
      toast.success('Recording added successfully!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.patch(`/admin/recordings/${id}/publish`);
      if (res.success) {
        toast.success(res.message);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Publish toggle failed');
    }
  };

  const handleArchive = async (id) => {
    if (!await confirmAction({ title: 'Archive recording?', message: 'The recording will be unpublished and removed from the public library. You can restore it later.', confirmLabel: 'Archive recording', tone: 'warning' })) return;
    try {
      await api.delete(`/admin/recordings/${id}`);
      toast.success('Recording archived safely.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Archive failed');
    }
  };

  const handleRestore = async (id) => {
    try { const res = await api.patch(`/admin/recordings/${id}/restore`); toast.success(res.message); fetchData(); }
    catch (err) { toast.error(err.message || 'Restore failed'); }
  };

  if (loading) return <LoadingSpinner label="Loading recordings library..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">Recorded Sessions Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage recorded session URLs. Per spec: Only published recordings appear on the public Recorded Sessions page.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a6b3c] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#124d2a] sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Session Recording</span>
        </button>
      </div>

      <AdminProgramFilters value={filters} onChange={setFilters} />
      <div className="flex justify-end"><select value={filters.archived} onChange={(e) => setFilters((current) => ({ ...current, archived: e.target.value }))} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"><option value="false">Active recordings</option><option value="true">Archived recordings</option><option value="all">All recordings</option></select></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordings.map((rec) => (
          <div key={rec._id} className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  rec.isArchived ? 'bg-amber-100 text-amber-800' : rec.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rec.isArchived ? 'Archived' : rec.isPublished ? 'Published' : 'Draft / Hidden'}
                </span>
                <VideoCameraIcon className="w-5 h-5 text-slate-400" />
              </div>

              <h3 className="font-bold text-slate-900 text-base">{rec.title}</h3>
              <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-mono truncate block hover:underline">
                {rec.url}
              </a>
              {rec.description && <p className="text-xs text-slate-500 line-clamp-2">{rec.description}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {!rec.isArchived && <button
                onClick={() => handleTogglePublish(rec._id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                {rec.isPublished ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                <span>{rec.isPublished ? 'Unpublish' : 'Publish'}</span>
              </button>}

              {rec.isArchived ? <button onClick={() => handleRestore(rec._id)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a6b3c] hover:bg-emerald-50"><ArrowPathIcon className="h-4 w-4" /> Restore</button> : <button onClick={() => handleArchive(rec._id)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-700"><ArchiveBoxArrowDownIcon className="h-4 w-4" /> Archive</button>}
            </div>
          </div>
        ))}
        {!recordings.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500 sm:p-12">No recordings match these filters.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">Add Training Recording Link</h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Training Session *</label>
                <select
                  value={form.training}
                  onChange={(e) => setForm({ ...form, training: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                >
                  {trainings.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Recording Title *</label>
                <input
                  type="text"
                  placeholder="e.g. AI Literacy Day Session 1 Video"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Video URL *</label>
                <input
                  type="url"
                  placeholder="YouTube URL or direct MP4/WebM/OGG URL"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">YouTube videos play inside this website and use their thumbnail automatically.</p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://example.org/session-cover.jpg"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
                <p className="mt-1 text-[11px] text-slate-500">Optional. The training cover image is used when this is empty.</p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description} placeholder="Short summary shown beside the recording"
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a6b3c] text-white font-bold rounded-lg shadow-xs"
                >
                  Save Recording
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecordingsManagement;
