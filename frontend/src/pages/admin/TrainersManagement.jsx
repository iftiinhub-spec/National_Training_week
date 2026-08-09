import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminModalClose from '../../components/common/AdminModalClose';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, CameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';

// Resolve the photo URL — Vite proxies /uploads → backend in dev; same origin in prod
const photoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `/${path.replace(/^\//,'')}`;
};

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  title: 'Dr.',
  organization: '',
  biography: '',
  expertise: '',
};

export const TrainersManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState(EMPTY_FORM);

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

  useEffect(() => { fetchTrainers(); }, []);

  const openCreateModal = () => {
    setEditingTrainer(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (tr) => {
    setEditingTrainer(tr);
    setForm({
      name: tr.name || '',
      email: tr.email || '',
      phone: tr.phone || '',
      title: tr.title || 'Dr.',
      organization: tr.organization || '',
      biography: tr.biography || '',
      expertise: tr.expertise || '',
    });
    setPhotoFile(null);
    // Show existing saved photo as preview
    setPhotoPreview(photoUrl(tr.photo));
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    // Local object URL preview before upload
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => formData.append(k, form[k]));
      if (photoFile) formData.append('photo', photoFile);

      if (editingTrainer) {
        await api.put(`/admin/trainers/${editingTrainer._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer profile updated!');
      } else {
        await api.post('/admin/trainers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Trainer profile created!');
      }

      setShowModal(false);
      setEditingTrainer(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trainer profile?')) return;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trainer / Speaker Profiles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Managed profiles for session speakers — trainers do NOT require a system login account.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Trainer Profile</span>
        </button>
      </div>

      {/* Cards Grid */}
      {trainers.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          No trainer profiles yet. Click <strong>Add Trainer Profile</strong> to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((tr) => {
            const imgSrc = photoUrl(tr.photo);
            return (
              <div
                key={tr._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Photo banner */}
                <div className="relative h-36 bg-gradient-to-br from-[#1a6b3c]/10 to-[#155289]/10 flex items-center justify-center">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={tr.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-100 text-[#1a6b3c] flex items-center justify-center border-4 border-white shadow-md text-4xl font-black">
                      {tr.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col space-y-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {tr.title ? `${tr.title} ` : ''}{tr.name}
                    </h3>
                    {tr.organization && (
                      <p className="text-xs text-[#155289] font-semibold mt-0.5">{tr.organization}</p>
                    )}
                    {tr.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{tr.email}</p>
                    )}
                    {tr.expertise && (
                      <p className="text-xs text-emerald-700 font-medium mt-1">
                        🎯 {tr.expertise}
                      </p>
                    )}
                  </div>
                  {tr.biography && (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {tr.biography}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 mt-auto">
                    <button
                      onClick={() => openEditModal(tr)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
                      title="Edit trainer profile"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tr._id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                      title="Delete trainer profile"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onMouseDown={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8" onMouseDown={(e) => e.stopPropagation()}>
            <AdminModalClose onClick={() => setShowModal(false)} />
            <h3 className="text-lg font-bold text-slate-900">
              {editingTrainer ? 'Edit Trainer Profile' : 'Create Trainer Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              {/* Photo Upload with Preview */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative w-28 h-28 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1a6b3c] group transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-14 h-14 text-slate-300 group-hover:text-[#1a6b3c] transition-colors" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <CameraIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-[#1a6b3c] font-semibold hover:underline"
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-[10px] text-slate-400">JPEG, PNG or WebP · Max 5 MB</p>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Dr."
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ibrahim Ahmed Abdirahman"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ibrahim@example.com"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +252 61 234 5678"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Organization / Affiliation</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. Somali National University"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Area of Expertise</label>
                <input
                  type="text"
                  value={form.expertise}
                  onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  placeholder="e.g. Machine Learning, Cybersecurity"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c]"
                />
              </div>

              {/* Biography */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Biography</label>
                <textarea
                  rows={3}
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  placeholder="Short professional bio..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1a6b3c] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setPhotoPreview(null); }}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-lg shadow-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
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
