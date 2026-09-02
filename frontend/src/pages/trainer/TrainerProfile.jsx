import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CameraIcon, CheckIcon, PencilIcon, UserCircleIcon, XMarkIcon } from '@icons';
import api from '../../api/axios';
import PhoneInput from '../../components/common/PhoneInput';

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Eng.'];
const photoUrl = (path) => path ? (path.startsWith('http') ? path : `/${path.replace(/^\//, '')}`) : null;
const toForm = (trainer) => ({ title: trainer.title || '', name: trainer.name || '', phone: trainer.phone || '', organization: trainer.organization || '', portfolioUrl: trainer.portfolioUrl || '', linkedinUrl: trainer.linkedinUrl || '', expertise: (trainer.expertise || []).join(', '), biography: trainer.biography || '' });

export default function TrainerProfile() {
  const [trainer, setTrainer] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { api.get('/trainer/dashboard').then(({ data }) => { setTrainer(data.trainer); setForm(toForm(data.trainer)); setPreview(photoUrl(data.trainer.photo)); }).catch((error) => toast.error(error.message)); }, []);
  if (!trainer || !form) return <p className="text-sm text-slate-500">Loading profile...</p>;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const cancel = () => { setForm(toForm(trainer)); setPhoto(null); setPreview(photoUrl(trainer.photo)); setEditing(false); if (fileRef.current) fileRef.current.value = ''; };
  const selectPhoto = (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { event.target.value = ''; return toast.error('Profile photo must be 5 MB or smaller.'); } setPhoto(file); setPreview(URL.createObjectURL(file)); };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try { const payload = new FormData(); Object.entries(form).forEach(([key, value]) => payload.append(key, value)); if (photo) payload.append('photo', photo); const response = await api.put('/trainer/profile', payload, { headers: { 'Content-Type': 'multipart/form-data' } }); const updated = response.data.trainer; setTrainer(updated); setForm(toForm(updated)); setPreview(photoUrl(updated.photo)); setPhoto(null); setEditing(false); toast.success('Profile updated.'); }
    catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };
  const field = 'mt-1 w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-black outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#1da156]/40';

  return <div className="mx-auto max-w-4xl"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-wide text-[#1a6b3c]">Trainer account</p><h1 className="text-3xl font-black text-slate-950">Professional profile</h1><p className="mt-2 text-sm text-slate-500">Your public trainer information. Select Edit only when you need to make changes.</p></div>
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 sm:p-8"><div className="flex min-w-0 items-center gap-4">{preview ? <img src={preview} alt={trainer.name} className="h-20 w-20 shrink-0 rounded-full object-cover" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100"><UserCircleIcon className="h-12 w-12 text-slate-300" /></span>}<div className="min-w-0"><h2 className="truncate text-xl font-bold text-slate-950">{trainer.title} {trainer.name}</h2><p className="truncate text-sm text-slate-500">{trainer.email}</p><span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-[#1a6b3c]">{trainer.accessStatus}</span></div></div>{editing ? <button type="button" onClick={cancel} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"><XMarkIcon className="h-4 w-4" /> Cancel</button> : <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#1a6b3c] px-3 py-2 text-sm font-bold text-white"><PencilIcon className="h-4 w-4" /> Edit</button>}</div>
      {!editing ? <div className="grid gap-px bg-slate-100 sm:grid-cols-2"><ProfileItem label="Phone number" value={trainer.phone} /><ProfileItem label="Organization / affiliation" value={trainer.organization} /><ProfileLink label="Portfolio website" value={trainer.portfolioUrl} /><ProfileLink label="LinkedIn profile" value={trainer.linkedinUrl} /><ProfileItem label="Areas of expertise" value={(trainer.expertise || []).join(', ')} wide /><ProfileItem label="Professional biography" value={trainer.biography} wide /></div>
      : <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 [&>label]:text-xs [&>label]:font-bold [&>label]:uppercase [&>label]:text-black">
        <div className="flex flex-col items-center sm:col-span-2"><button type="button" onClick={() => fileRef.current?.click()} className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100">{preview ? <img src={preview} alt="Profile preview" className="h-full w-full object-cover" /> : <UserCircleIcon className="h-full w-full p-5 text-slate-300" />}<span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100"><CameraIcon className="h-6 w-6" /></span></button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectPhoto} /><button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs font-bold text-[#1a6b3c]">Change photo</button></div>
        <label>Title<select className={field} value={form.title} onChange={(e) => update('title', e.target.value)}><option value="">Select your title</option>{TITLES.map((title) => <option key={title}>{title}</option>)}</select></label>
        <label>Full name *<input className={field} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Amina Mohamed Ali" required /></label>
        <label>Phone number *<PhoneInput className="mt-1" value={form.phone} onChange={(phone) => update('phone', phone)} required /></label>
        <label>Organization / affiliation *<input className={field} value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="e.g. Hormuud University" required /></label>
        <label>Portfolio website<input type="url" className={field} value={form.portfolioUrl} onChange={(e) => update('portfolioUrl', e.target.value)} placeholder="https://yourname.com" /></label>
        <label>LinkedIn profile<input type="url" className={field} value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://www.linkedin.com/in/yourname" /></label>
        <label className="sm:col-span-2">Areas of expertise *<input className={field} value={form.expertise} onChange={(e) => update('expertise', e.target.value)} placeholder="e.g. Machine Learning, Cybersecurity" required /></label>
        <label className="sm:col-span-2">Professional biography *<textarea rows={5} className={field} value={form.biography} onChange={(e) => update('biography', e.target.value)} placeholder="Describe your experience, qualifications, and teaching background." required /></label>
        <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={cancel} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1a6b3c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"><CheckIcon className="h-5 w-5" />{saving ? 'Saving...' : 'Save changes'}</button></div>
      </form>}
    </section>
  </div>;
}

function ProfileItem({ label, value, wide = false }) { return <div className={`bg-white p-6 ${wide ? 'sm:col-span-2' : ''}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{value || 'Not provided'}</p></div>; }
function ProfileLink({ label, value }) { return <div className="bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>{value ? <a href={value} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-sm font-semibold leading-6 text-[#1a6b3c] hover:underline">{value}</a> : <p className="mt-2 text-sm font-medium text-slate-800">Not provided</p>}</div>; }
