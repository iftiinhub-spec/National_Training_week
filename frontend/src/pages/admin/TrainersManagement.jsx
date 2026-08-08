import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';

export const TrainersManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: 'Dr.',
    organization: 'Hormuud University',
    biography: '',
    expertise: '',
  });

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/admin/trainers');
      if (res.success) setTrainers(res.data || []);
    } catch (err) {
      toast.error('Failed to load trainers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => formData.append(k, form[k]));
      if (photoFile) formData.append('photo', photoFile);

      if (editingTrainer) {
        await api.put(`/admin/trainers/${editingTrainer._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer updated!');
      } else {
        await api.post('/admin/trainers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer profile created!');
      }

      setShowModal(false);
      setEditingTrainer(null);
      setPhotoFile(null);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trainer profile?')) return;
    try {
      await api.delete(`/admin/trainers/${id}`);
      toast.success('Trainer profile deleted');
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading trainer profiles..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trainer / Speaker Profiles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Managed profiles for session speakers. Per spec: Trainers do NOT require a system login account.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTrainer(null);
            setForm({ name: '', email: '', phone: '', title: 'Dr.', organization: 'Hormuud University', biography: '', expertise: '' });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Trainer Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((tr) => (
          <div key={tr._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {tr.photo ? (
                  <img src={`/${tr.photo}`} alt={tr.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1a6b3c] flex items-center justify-center font-bold text-xl shrink-0">
                    {tr.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tr.title ? `${tr.title} ` : ''}{tr.name}</h3>
                  <p className="text-xs text-[#155289] font-semibold">{tr.organization || 'Guest Trainer'}</p>
                  <p className="text-xs text-slate-400">{tr.email}</p>
                </div>
              </div>

              {tr.biography && <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{tr.biography}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDelete(tr._id)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 text-xs"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingTrainer ? 'Edit Trainer Profile' : 'Create Trainer Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Organization / Affiliation</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Photo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainersManagement;
