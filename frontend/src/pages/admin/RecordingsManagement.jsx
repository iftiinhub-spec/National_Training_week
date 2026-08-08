import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon, VideoCameraIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';

export const RecordingsManagement = () => {
  const [recordings, setRecordings] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    training: '',
    title: '',
    url: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      const [recRes, trRes] = await Promise.all([
        api.get('/admin/recordings'),
        api.get('/admin/trainings'),
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete recording reference?')) return;
    try {
      await api.delete(`/admin/recordings/${id}`);
      toast.success('Recording deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading recordings library..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Recorded Sessions Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage recorded session URLs. Per spec: Only published recordings appear on the public Recorded Sessions page.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Session Recording</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordings.map((rec) => (
          <div key={rec._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  rec.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rec.isPublished ? 'Published' : 'Draft / Hidden'}
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
              <button
                onClick={() => handleTogglePublish(rec._id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                {rec.isPublished ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                <span>{rec.isPublished ? 'Unpublish' : 'Publish'}</span>
              </button>

              <button onClick={() => handleDelete(rec._id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
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
                <label className="block font-bold uppercase text-slate-700 mb-1">Video URL (YouTube/Vimeo/Drive) *</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
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
