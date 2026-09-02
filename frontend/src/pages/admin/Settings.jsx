import React, { useEffect, useState } from 'react';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, GlobeAltIcon, PencilIcon, PhotoIcon, ShieldCheckIcon, TrashIcon, XMarkIcon } from '@icons';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ButtonSpinner from '../../components/common/ButtonSpinner';

const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition enabled:focus:border-[#1a6b3c] enabled:focus:ring-2 enabled:focus:ring-emerald-100 disabled:cursor-default disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-700';
const initial = { organizerName: '', contactEmail: '', replyToEmail: '', location: '', facebookUrl: '', tiktokUrl: '', instagramUrl: '', linkedinUrl: '', xUrl: '', emailSenderName: '', smtpUser: '', smtpPassword: '', hasSmtpPassword: false, certificateSignature: '', certificateSignatoryName: 'Authorized Signatory', certificateSignatoryTitle: 'National Training Week' };
const socialFields = [
  ['facebookUrl', 'Facebook page URL', 'https://facebook.com/your-page'],
  ['tiktokUrl', 'TikTok profile URL', 'https://tiktok.com/@your-profile'],
  ['instagramUrl', 'Instagram profile URL', 'https://instagram.com/your-profile'],
  ['linkedinUrl', 'LinkedIn page URL', 'https://linkedin.com/company/your-page'],
  ['xUrl', 'X profile URL', 'https://x.com/your-profile'],
];

const Settings = () => {
  const [form, setForm] = useState(initial);
  const [savedForm, setSavedForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [signatureBusy, setSignatureBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((response) => {
      const settings = { ...initial, ...response.data?.settings, smtpPassword: '' };
      setForm(settings);
      setSavedForm(settings);
    }).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#certificate-signature') {
      Array.from(document.querySelectorAll('h2')).find((heading) => heading.textContent === 'Certificate signature')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await api.put('/admin/settings', form);
      const settings = { ...initial, ...response.data?.settings, smtpPassword: '' };
      setForm(settings);
      setSavedForm(settings);
      setEditing(false);
      toast.success('Settings updated successfully.');
    } catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };
  const sendTest = async () => {
    if (!testEmail) return toast.error('Enter a test recipient email.');
    setTestingEmail(true);
    try { await api.post('/admin/settings/test-email', { email: testEmail }); toast.success('Test email sent successfully.'); }
    catch (error) { toast.error(error.message); } finally { setTestingEmail(false); }
  };
  const uploadSignature = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('certificateSignature', file);
    setSignatureBusy(true);
    try {
      const response = await api.post('/admin/settings/certificate-signature', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const settings = { ...form, ...response.data?.settings, smtpPassword: '' };
      setForm(settings); setSavedForm(settings); toast.success('Certificate signature uploaded.');
    } catch (error) { toast.error(error.message); } finally { setSignatureBusy(false); event.target.value = ''; }
  };
  const removeSignature = async () => {
    setSignatureBusy(true);
    try {
      const response = await api.delete('/admin/settings/certificate-signature');
      const settings = { ...form, ...response.data?.settings, smtpPassword: '' };
      setForm(settings); setSavedForm(settings); toast.success('Certificate signature removed.');
    } catch (error) { toast.error(error.message); } finally { setSignatureBusy(false); }
  };

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading settings...</div>;

  return <div className="mx-auto max-w-5xl space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a6b3c]">System administration</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Website & email settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage the contact details shown publicly and the identity participants see in system emails.</p></div>{!editing && <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#145c32] sm:self-auto"><PencilIcon className="h-4 w-4" /> Edit settings</button>}</div>
    <form onSubmit={save} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <section className="p-6 sm:p-8"><div className="mb-6 flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><GlobeAltIcon className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-950">Public information</h2><p className="mt-1 text-sm text-slate-500">These details and configured social profiles appear in the public website footer.</p></div></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Organizer name *<input name="organizerName" value={form.organizerName} placeholder="e.g. Hormuud University" onChange={change} className={inputClass} disabled={!editing} required /></label><label className="text-sm font-semibold text-slate-700">Location *<input name="location" value={form.location} placeholder="e.g. Mogadishu, Somalia" onChange={change} className={inputClass} disabled={!editing} required /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Public contact email *<input type="email" name="contactEmail" value={form.contactEmail} onChange={change} placeholder="contact@example.org" className={inputClass} disabled={!editing} required /></label><div className="border-t border-slate-200 pt-5 sm:col-span-2"><h3 className="font-bold text-slate-950">Social media links</h3><p className="mt-1 text-xs text-slate-500">Use the complete HTTPS profile URL. Leave a platform blank to hide it from the footer.</p></div>{socialFields.map(([name, label, placeholder]) => <label key={name} className="text-sm font-semibold text-slate-700">{label}<input type="url" name={name} value={form[name]} onChange={change} placeholder={editing ? placeholder : 'Not configured'} className={inputClass} disabled={!editing} /></label>)}</div></section>
      <section className="border-t border-slate-200 bg-slate-50/60 p-6 sm:p-8"><div className="mb-6 flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a6b3c] shadow-sm"><EnvelopeIcon className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-950">Email delivery</h2><p className="mt-1 text-sm text-slate-500">Configure the Gmail account used to send registration, approval, meeting, and certificate messages.</p></div></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Sender display name *<input name="emailSenderName" value={form.emailSenderName} onChange={change} placeholder="National Training Week" className={inputClass} disabled={!editing} required /></label><label className="text-sm font-semibold text-slate-700">Reply-to email *<input type="email" name="replyToEmail" value={form.replyToEmail} onChange={change} placeholder="support@example.org" className={inputClass} disabled={!editing} required /></label><label className="text-sm font-semibold text-slate-700">Gmail sender address<input type="email" name="smtpUser" value={form.smtpUser} onChange={change} placeholder="notifications@gmail.com" className={inputClass} disabled={!editing} /><span className="mt-1.5 block text-xs font-normal text-slate-400">The Google account that owns the App Password.</span></label><label className="text-sm font-semibold text-slate-700">Google App Password<div className="relative"><input type={showPassword ? 'text' : 'password'} name="smtpPassword" value={form.smtpPassword} onChange={change} placeholder={form.hasSmtpPassword ? 'Saved securely — enter only to replace' : 'Enter the 16-character App Password'} className={`${inputClass} pr-12`} disabled={!editing} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={!editing} aria-label={showPassword ? 'Hide App Password' : 'Show App Password'} className="absolute inset-y-2 right-0 flex w-11 items-center justify-center text-slate-400 disabled:hidden">{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div><span className="mt-1.5 block text-xs font-normal text-slate-400">Leave blank to keep the currently saved password.</span></label></div><div className="mt-6 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Your App Password is encrypted.</strong> It is never sent back to this page after saving. If you change the Gmail address, enter an App Password generated by that same Google account.</p></div></section>
      <section className="border-t border-slate-200 p-6 sm:p-8"><div className="mb-6 flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a6b3c]"><PhotoIcon className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-950">Certificate signature</h2><p className="mt-1 text-sm text-slate-500">Upload the authorized signature printed on certificates. A transparent PNG gives the best result.</p></div></div><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">{form.certificateSignature ? <img src={`/${form.certificateSignature.replace(/^\//, '')}`} alt="Current certificate signature" className="max-h-24 max-w-full object-contain" /> : <div className="text-center text-sm text-slate-400"><PhotoIcon className="mx-auto mb-2 h-8 w-8" />No signature uploaded</div>}</div><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Signatory name *<input name="certificateSignatoryName" value={form.certificateSignatoryName} placeholder="e.g. Dr. Ahmed Yusuf" onChange={change} className={inputClass} disabled={!editing} required /></label><label className="text-sm font-semibold text-slate-700">Signatory title *<input name="certificateSignatoryTitle" value={form.certificateSignatoryTitle} placeholder="e.g. Vice Chancellor" onChange={change} className={inputClass} disabled={!editing} required /></label></div><div className="flex flex-wrap gap-3"><label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white ${signatureBusy ? 'pointer-events-none opacity-60' : 'hover:bg-[#145c32]'}`}>{signatureBusy ? <ButtonSpinner /> : <PhotoIcon className="h-5 w-5" />}{signatureBusy ? 'Processing...' : form.certificateSignature ? 'Replace signature' : 'Upload signature'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSignature} className="sr-only" disabled={signatureBusy} /></label>{form.certificateSignature && <button type="button" onClick={removeSignature} disabled={signatureBusy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">{signatureBusy ? <ButtonSpinner /> : <TrashIcon className="h-4 w-4" />} Remove</button>}</div><p className="text-xs leading-5 text-slate-400">Accepted: PNG, JPEG, or WebP, up to 5 MB. Crop empty space around the signature for the cleanest result.</p></div></div></section>
      <div className="border-t border-slate-200 bg-white p-6 sm:px-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-slate-700">Test recipient email<input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="recipient@example.com" className={inputClass} /></label><button type="button" onClick={sendTest} disabled={testingEmail} className="min-h-11 rounded-xl border border-[#1a6b3c] px-5 text-sm font-bold text-[#1a6b3c] hover:bg-emerald-50 disabled:opacity-60">{testingEmail ? <><ButtonSpinner /> Sending...</> : 'Send test email'}</button></div></div>
      {editing && <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-6 sm:flex-row sm:justify-end sm:px-8"><button type="button" onClick={() => { setForm(savedForm); setShowPassword(false); setEditing(false); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><XMarkIcon className="h-4 w-4" /> Cancel</button><button disabled={saving} className="min-h-11 rounded-xl bg-[#1a6b3c] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#145c32] disabled:opacity-60">{saving ? <><ButtonSpinner /> Saving...</> : 'Save changes'}</button></div>}
    </form>
  </div>;
};

export default Settings;
