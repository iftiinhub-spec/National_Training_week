import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpTrayIcon,
  BuildingOffice2Icon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

const CATEGORIES = ['Strategic Partner', 'Platinum Sponsor', 'Gold Sponsor', 'Silver Sponsor', 'Supporting Partner', 'Media Partner'];
const EMPTY_FORM = {
  event: '', name: '', category: 'Supporting Partner', websiteUrl: '', description: '',
  displayOrder: 0, isActive: true, isFeatured: false,
};
const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1a6b3c] focus:ring-2 focus:ring-emerald-100';
const imageUrl = (path) => path ? (path.startsWith('http') ? path : `/${path.replace(/^\//, '')}`) : '';

export const SponsorsManagement = () => {
  const confirmAction = useConfirmDialog();
  const [sponsors, setSponsors] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  const currentEvent = useMemo(() => events.find((event) => event.status !== 'completed') || events[0], [events]);

  const loadData = async () => {
    try {
      const [sponsorRes, eventRes] = await Promise.all([api.get('/admin/sponsors'), api.get('/admin/events')]);
      if (sponsorRes.success) setSponsors(sponsorRes.data.sponsors || []);
      if (eventRes.success) setEvents(eventRes.data.events || eventRes.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load sponsors.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, event: currentEvent?._id || '' });
    setLogo(null);
    setPreview('');
    setShowForm(true);
  };

  const openEdit = (sponsor) => {
    setEditing(sponsor);
    setForm({
      event: sponsor.event?._id || sponsor.event,
      name: sponsor.name,
      category: sponsor.category,
      websiteUrl: sponsor.websiteUrl || '',
      description: sponsor.description || '',
      displayOrder: sponsor.displayOrder || 0,
      isActive: sponsor.isActive,
      isFeatured: sponsor.isFeatured,
    });
    setLogo(null);
    setPreview(imageUrl(sponsor.logo));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setLogo(null);
    setPreview('');
  };

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = '';
      return toast.error('Logo must be 5 MB or smaller.');
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!editing && !logo) return toast.error('Select a sponsor logo.');
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    if (logo) data.append('sponsorLogo', logo);
    setSaving(true);
    try {
      const response = editing
        ? await api.put(`/admin/sponsors/${editing._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/admin/sponsors', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(response.message);
      closeForm();
      await loadData();
    } catch (error) { toast.error(error.message || 'Failed to save sponsor.'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (sponsor) => {
    try {
      const response = await api.patch(`/admin/sponsors/${sponsor._id}/status`, { isActive: !sponsor.isActive });
      toast.success(response.message);
      await loadData();
    } catch (error) { toast.error(error.message || 'Failed to update sponsor.'); }
  };

  const remove = async (sponsor) => {
    if (!await confirmAction({ title: `Delete ${sponsor.name}?`, message: 'The sponsor record and its uploaded logo will be permanently removed.', confirmLabel: 'Delete sponsor' })) return;
    try {
      const response = await api.delete(`/admin/sponsors/${sponsor._id}`);
      toast.success(response.message);
      await loadData();
    } catch (error) { toast.error(error.message || 'Failed to delete sponsor.'); }
  };

  if (loading) return <LoadingSpinner label="Loading sponsors and partners..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#1a6b3c]">Public website</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Sponsors & Partners</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Upload partner logos, associate them with an event edition, and control how they appear on the Home page.</p>
        </div>
        <button onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white hover:bg-[#145c32]"><PlusIcon className="h-5 w-5" /> Add Sponsor</button>
      </div>

      {sponsors.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Logo</th><th className="px-4 py-3">Sponsor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{sponsors.map((sponsor) => <tr key={sponsor._id} className="align-middle hover:bg-slate-50/70"><td className="px-4 py-3"><img src={imageUrl(sponsor.logo)} alt={`${sponsor.name} logo`} className="h-12 w-20 object-contain" /></td><td className="px-4 py-3 font-black text-slate-950">{sponsor.name}{sponsor.isFeatured && <StarIcon className="ml-2 inline h-4 w-4 text-amber-500" title="Featured sponsor" />}</td><td className="px-4 py-3 text-xs font-semibold text-[#1a6b3c]">{sponsor.category}</td><td className="px-4 py-3 text-xs text-slate-500">{sponsor.event?.name || 'Event'}</td><td className="px-4 py-3 text-xs text-slate-500">{sponsor.displayOrder}</td><td className="px-4 py-3"><button onClick={() => toggleStatus(sponsor)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${sponsor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{sponsor.isActive ? 'Visible' : 'Hidden'}</button></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => openEdit(sponsor)} aria-label={`Edit ${sponsor.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1a6b3c]"><PencilSquareIcon className="h-5 w-5" /></button><button onClick={() => remove(sponsor)} aria-label={`Delete ${sponsor.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-5 w-5" /></button></div></td></tr>)}</tbody></table>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><BuildingOffice2Icon className="mx-auto h-11 w-11 text-slate-300" /><h2 className="mt-4 text-lg font-black text-slate-900">No sponsors added yet</h2><p className="mt-2 text-sm text-slate-500">Add the first organization to publish the Home-page sponsor section.</p></div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="sponsor-form-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#1a6b3c]">Sponsor details</p><h2 id="sponsor-form-title" className="mt-1 text-xl font-black text-slate-950">{editing ? 'Edit sponsor' : 'Add sponsor'}</h2></div><button onClick={closeForm} aria-label="Close sponsor form" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-6 w-6" /></button></div>
            <form onSubmit={submit} className="space-y-6 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">Event edition *<select className={inputClass} value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} required><option value="">Select event</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name} ({event.year})</option>)}</select></label>
                <label className="text-sm font-bold text-slate-700">Sponsor name *<input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required /></label>
                <label className="text-sm font-bold text-slate-700">Category *<select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="text-sm font-bold text-slate-700">Website URL<input type="url" className={inputClass} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.org" /></label>
                <label className="text-sm font-bold text-slate-700">Display order<input type="number" min="0" max="9999" className={inputClass} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></label>
                <div className="flex flex-wrap items-end gap-5 pb-2"><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#1a6b3c]" /> Visible on Home</label><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 accent-[#1a6b3c]" /> Featured</label></div>
              </div>
              <label className="block text-sm font-bold text-slate-700">Short description<textarea rows="3" maxLength={500} className={`${inputClass} py-3`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <div><p className="text-sm font-bold text-slate-700">Sponsor logo {editing ? '' : '*'}</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex min-h-40 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 hover:border-[#1a6b3c]">{preview ? <img src={preview} alt="Sponsor logo preview" className="max-h-28 max-w-full object-contain" /> : <span className="flex flex-col items-center gap-2 text-sm font-semibold text-slate-500"><ArrowUpTrayIcon className="h-8 w-8" />Choose PNG, JPEG, or WebP</span>}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} className="sr-only" /><p className="mt-2 text-xs text-slate-400">Transparent PNG or WebP works best. Maximum 5 MB.</p></div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700">Cancel</button><button disabled={saving} className="min-h-11 rounded-xl bg-[#1a6b3c] px-6 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Sponsor'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default SponsorsManagement;
