import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.success) setCategories(res.data.categories || []);
    } catch (err) {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/categories', { name, description });
      if (res.success) {
        toast.success('Category created!');
        setName('');
        setDescription('');
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Creation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading categories..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Training Categories</h1>
        <p className="text-xs text-slate-500 mt-1">
          Reusable classifications for organizing training sessions across event days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Create Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 text-sm uppercase">Add New Category</h3>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Artificial Intelligence"
                className="w-full p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-lg shadow-xs"
            >
              Add Category
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Existing Categories ({categories.length})
          </div>
          <ul className="divide-y divide-slate-100 text-xs">
            {categories.map((cat) => (
              <li key={cat._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                  {cat.description && <p className="text-slate-500 mt-0.5">{cat.description}</p>}
                </div>
                <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default CategoriesManagement;
