import React, { useEffect, useMemo, useState } from 'react';
import { EyeIcon, EyeSlashIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@icons';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import ButtonSpinner from '../../components/common/ButtonSpinner';

const emptyForm = { question: '', answer: '', category: 'General', displayOrder: 0, isPublished: true };
const FAQ_CATEGORIES = ['General', 'Registration', 'Training Sessions', 'Attendance', 'Certificates', 'Trainer Applications', 'Technical Support'];
const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/15';

export default function FAQsManagement() {
  const confirmAction = useConfirmDialog();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // One FAQ row is acted on at a time, so `<id>:<action>` identifies the busy control.
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const loadFAQs = async () => {
    try {
      const response = await api.get('/admin/faqs');
      setFaqs(response.data?.faqs || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFAQs(); }, []);

  const visibleFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesStatus = status === 'all' || (status === 'published' ? faq.isPublished : !faq.isPublished);
      const matchesSearch = !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query) || faq.category?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [faqs, search, status]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const editFAQ = (faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category || 'General', displayOrder: faq.displayOrder || 0, isPublished: faq.isPublished });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveFAQ = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = editing
        ? await api.put(`/admin/faqs/${editing._id}`, form)
        : await api.post('/admin/faqs', form);
      if (response.success) {
        toast.success(editing ? 'FAQ updated.' : 'FAQ created.');
        resetForm();
        await loadFAQs();
      }
    } catch (error) {
      toast.error(error.message || 'Unable to save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (faq) => {
    setBusy(`${faq._id}:publish`);
    try {
      await api.patch(`/admin/faqs/${faq._id}/publish`, { isPublished: !faq.isPublished });
      toast.success(faq.isPublished ? 'FAQ moved to draft.' : 'FAQ published.');
      await loadFAQs();
    } catch (error) {
      toast.error(error.message || 'Unable to change FAQ status.');
    } finally {
      setBusy('');
    }
  };

  const deleteFAQ = async (faq) => {
    if (!await confirmAction({ title: 'Delete FAQ?', message: `This question will be permanently removed:\n\n${faq.question}`, confirmLabel: 'Delete FAQ' })) return;
    setBusy(`${faq._id}:delete`);
    try {
      await api.delete(`/admin/faqs/${faq._id}`);
      if (editing?._id === faq._id) resetForm();
      toast.success('FAQ deleted.');
      await loadFAQs();
    } catch (error) {
      toast.error(error.message || 'Unable to delete FAQ.');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <LoadingSpinner label="Loading FAQs..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h1>
        <p className="mt-1 text-xs text-slate-500">Create and maintain the answers displayed on the public FAQ page.</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">FAQ details</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{editing ? 'Edit FAQ' : 'Add an FAQ'}</h2>
            <p className="mt-1 text-sm text-slate-500">Write clear questions and short, helpful answers for visitors.</p>
          </div>
          {editing && <button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"><XMarkIcon className="h-4 w-4" /> Cancel edit</button>}
        </div>

        <form onSubmit={saveFAQ} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold uppercase text-slate-700 sm:col-span-2">Question *
            <input value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="e.g. How do I register for a training session?" maxLength={200} className={inputClass} required />
          </label>
          <label className="text-sm font-bold uppercase text-slate-700 sm:col-span-2">Answer *
            <textarea value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} placeholder="Provide a clear and helpful answer" rows={5} maxLength={2000} className={`${inputClass} resize-y`} required />
          </label>
          <label className="text-sm font-bold uppercase text-slate-700">Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}>
              {FAQ_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold uppercase text-slate-700">Display order
            <input type="number" min="0" max="9999" value={form.displayOrder} placeholder="e.g. 1" onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} className={inputClass} />
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="h-5 w-5 accent-[#1a6b3c]" /> Publish this FAQ on the public website
          </label>
          <div className="flex justify-end sm:col-span-2">
            <button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#124d2a] disabled:opacity-60">
              {saving ? <ButtonSpinner /> : editing ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}{saving ? 'Saving...' : editing ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-[1fr_12rem] sm:px-6">
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions, answers, or categories" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
          </select>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleFAQs.length ? visibleFAQs.map((faq) => (
            <article key={faq._id} className="p-5 transition hover:bg-slate-50/80 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${faq.isPublished ? 'bg-emerald-50 text-[#1a6b3c]' : 'bg-slate-100 text-slate-600'}`}>{faq.isPublished ? 'Published' : 'Draft'}</span>
                    <span className="text-xs font-semibold text-slate-500">{faq.category || 'General'} · Order {faq.displayOrder || 0}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => togglePublished(faq)} disabled={busy.startsWith(`${faq._id}:`)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" aria-label={faq.isPublished ? `Unpublish ${faq.question}` : `Publish ${faq.question}`}>{busy === `${faq._id}:publish` ? <ButtonSpinner /> : faq.isPublished ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</button>
                  <button type="button" onClick={() => editFAQ(faq)} disabled={busy.startsWith(`${faq._id}:`)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-[#1a6b3c]/30 hover:bg-emerald-50 hover:text-[#1a6b3c] disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Edit ${faq.question}`}><PencilIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteFAQ(faq)} disabled={busy.startsWith(`${faq._id}:`)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Delete ${faq.question}`}>{busy === `${faq._id}:delete` ? <ButtonSpinner /> : <TrashIcon className="h-4 w-4" />}</button>
                </div>
              </div>
            </article>
          )) : <div className="px-6 py-14 text-center text-sm text-slate-500">{faqs.length ? 'No FAQs match these filters.' : 'No FAQs have been added yet.'}</div>}
        </div>
      </section>
    </div>
  );
}
