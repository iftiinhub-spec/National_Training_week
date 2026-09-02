import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CameraIcon, EyeIcon, EyeSlashIcon, UserCircleIcon, XMarkIcon } from '@icons';
import api from '../../api/axios';
import PhoneInput from '../../components/common/PhoneInput';
import PhotoCropModal from '../../components/common/PhotoCropModal';

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Eng.'];
const EMPTY_FORM = { title: '', name: '', email: '', phone: '', organization: '', portfolioUrl: '', linkedinUrl: '', expertise: '', biography: '', password: '', confirmPassword: '' };
const INPUT_CLASS = 'w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm font-normal text-black outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-[#1da156]/40';
const LABEL_CLASS = 'mb-1 block text-xs font-bold uppercase text-black';

export default function TrainerApply() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { event.target.value = ''; return toast.error('Choose a JPEG, PNG, or WebP image.'); }
    if (file.size > 5 * 1024 * 1024) { event.target.value = ''; return toast.error('Profile photo must be 5 MB or smaller.'); }
    setCropSrc(URL.createObjectURL(file));
  };
  const applyCroppedPhoto = (file) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = '';
  };
  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  };
  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };
  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (key !== 'confirmPassword') data.append(key, value); });
      if (photo) data.append('photo', photo);
      await api.post('/public/trainer-applications', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Application submitted. You can sign in after approval.');
      setForm(EMPTY_FORM);
      removePhoto();
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) { toast.error(error.message || 'Application failed.'); }
    finally { setSaving(false); }
  };

  return <>
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-black tracking-tight text-black">Trainer Account Registration</h1>
      <p className="text-xs text-black/70">Apply to share your expertise. An administrator will review your application before portal access is enabled.</p>
    </div>

    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-black/10 bg-white p-8 shadow-xl">
      <div className="flex flex-col items-center">
        <span className="mb-2 text-sm font-medium text-slate-900">Profile photo</span>
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-300 transition hover:border-[#1a6b3c] focus:outline-none focus:ring-2 focus:ring-[#1a6b3c] focus:ring-offset-2" aria-label={photoPreview ? 'Change profile photo' : 'Upload profile photo'}>
          {photoPreview ? <img src={photoPreview} alt="Selected trainer profile" className="h-full w-full object-cover" /> : <UserCircleIcon className="h-12 w-12" />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100"><CameraIcon className="h-6 w-6" /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectPhoto} />
        <div className="mt-2 flex items-center gap-3"><button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-bold text-[#1a6b3c] hover:underline">{photoPreview ? 'Change photo' : 'Upload photo'}</button>{photoPreview && <button type="button" onClick={removePhoto} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><XMarkIcon className="h-4 w-4" /> Remove</button>}</div>
        <p className="mt-1 text-[11px] text-slate-400">JPEG, PNG or WebP · Max 5 MB</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title"><select className={INPUT_CLASS} value={form.title} onChange={(event) => update('title', event.target.value)}><option value="">Select your title</option>{TITLES.map((title) => <option key={title} value={title}>{title}</option>)}</select></Field>
        <Field label="Full name *"><input className={INPUT_CLASS} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Amina Mohamed Ali" required /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email address *"><input type="email" className={INPUT_CLASS} value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="e.g. amina@example.com" required /></Field>
        <Field label="Phone number *"><PhoneInput value={form.phone} onChange={(phone) => update('phone', phone)} required /></Field>
      </div>
      <Field label="Organization / affiliation *"><input className={INPUT_CLASS} value={form.organization} onChange={(event) => update('organization', event.target.value)} placeholder="e.g. Hormuud University" required /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Portfolio website"><input type="url" className={INPUT_CLASS} value={form.portfolioUrl} onChange={(event) => update('portfolioUrl', event.target.value)} placeholder="https://yourname.com" /></Field>
        <Field label="LinkedIn profile"><input type="url" className={INPUT_CLASS} value={form.linkedinUrl} onChange={(event) => update('linkedinUrl', event.target.value)} placeholder="https://www.linkedin.com/in/yourname" /></Field>
      </div>
      <Field label="Areas of expertise *"><input className={INPUT_CLASS} value={form.expertise} onChange={(event) => update('expertise', event.target.value)} placeholder="e.g. Machine Learning, Cybersecurity" required /></Field>
      <Field label="Professional biography *"><textarea className={INPUT_CLASS} rows={5} minLength={30} value={form.biography} onChange={(event) => update('biography', event.target.value)} placeholder="e.g. Describe your experience, qualifications, and teaching background." required /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField label="Password *" value={form.password} onChange={(value) => update('password', value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} placeholder="At least 8 characters" />
        <PasswordField label="Confirm password *" value={form.confirmPassword} onChange={(value) => update('confirmPassword', value)} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} placeholder="Re-enter password" />
      </div>
      <button disabled={saving} className="mt-4 w-full rounded-xl bg-[#15803d] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-black disabled:opacity-60">{saving ? 'Submitting...' : 'Submit application'}</button>
      <div className="mt-4 border-t border-black/10 pt-4 text-center text-xs text-black/70">Already applied? <Link to="/signin" className="font-bold text-[#1da156] hover:underline">Sign in</Link></div>
    </form>
    {cropSrc && <PhotoCropModal imageSrc={cropSrc} onCancel={cancelCrop} onCropped={applyCroppedPhoto} />}
  </>;
}

function Field({ label, children }) {
  return <div><label className={LABEL_CLASS}>{label}</label>{children}</div>;
}

function PasswordField({ label, value, onChange, visible, onToggle, placeholder }) {
  return <Field label={label}><div className="relative"><input type={visible ? 'text' : 'password'} minLength={8} className={`${INPUT_CLASS} pr-12`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="new-password" required /><button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-black/50 hover:text-[#1da156]" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div></Field>;
}
