import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const CategoriesManagement = () => {
  const confirmAction = useConfirmDialog();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = editingCategory
        ? await api.put(`/admin/categories/${editingCategory._id}`, { name, description })
        : await api.post('/admin/categories', { name, description });
      if (res.success) {
        toast.success(editingCategory ? 'Category updated.' : 'Category created.');
        resetForm();
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setDescription(category.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({ title: 'Delete category?', message: 'This category will be permanently removed. Categories connected to training sessions may not be deletable.', confirmLabel: 'Delete category' })) return;
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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Category details</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{editingCategory ? 'Edit category' : 'Add a category'}</h2>
            <p className="mt-1 text-sm text-slate-500">Categories help participants browse related training sessions.</p>
          </div>
          {editingCategory && (
            <button type="button" onClick={resetForm} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <XMarkIcon className="h-4 w-4" /> Cancel edit
            </button>
          )}
        </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 items-end gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(20rem,1.4fr)_auto]">
            <div className="self-stretch">
              <label className="mb-2 block uppercase">Category name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Artificial Intelligence"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                required
              />
            </div>
            <div className="self-stretch">
              <label className="mb-2 block uppercase">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this category covers"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#124d2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingCategory ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              {submitting ? 'Saving…' : editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-950">Existing categories</h2>
              <p className="mt-0.5 text-xs text-slate-500">{categories.length} {categories.length === 1 ? 'category' : 'categories'} available</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-6 py-4">Category name</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length > 0 ? categories.map((cat) => (
                  <tr key={cat._id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-bold text-slate-950">{cat.name}</td>
                    <td className="max-w-2xl px-6 py-4 leading-6 text-slate-500">{cat.description || 'No description provided.'}</td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-2">
                      <button type="button" onClick={() => handleEdit(cat)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-[#1a6b3c]/30 hover:bg-emerald-50 hover:text-[#1a6b3c]" aria-label={`Edit ${cat.name}`}><PencilIcon className="h-4 w-4" /></button>
                      <button type="button" onClick={() => handleDelete(cat._id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${cat.name}`}><TrashIcon className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="px-6 py-12 text-center text-sm text-slate-500">No categories have been added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
};

export default CategoriesManagement;
