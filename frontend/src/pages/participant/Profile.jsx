import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CameraIcon, CheckIcon, EyeIcon, EyeSlashIcon, KeyIcon, PencilIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PhoneInput from '../../components/common/PhoneInput';
import { getCountries } from 'libphonenumber-js';

const REGIONS = ['Awdal', 'Bakool', 'Banaadir', 'Bari', 'Bay', 'Galguduud', 'Gedo', 'Hiiraan', 'Lower Juba', 'Middle Juba', 'Lower Shabelle', 'Middle Shabelle', 'Mudug', 'Nugaal', 'Sanaag', 'Sool', 'Togdheer', 'Woqooyi Galbeed'];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = getCountries().map((code) => ({ code, name: countryNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
const photoUrl = (path) => path ? (path.startsWith('http') ? path : `/${path.replace(/^\//, '')}`) : null;
const participantLabel = (value) => ({ university_student: 'University Student', highschool_graduate: 'Fresh High-School Graduate', developer_it: 'Developer / IT Specialist', professional: 'Professional', general_public: 'General Public', teacher_educator: 'Teacher / Educator', entrepreneur_business: 'Entrepreneur / Business Owner', health_worker: 'Health Worker', community_organization: 'Community Organization Representative', other: 'Other' }[value] || 'Not provided');

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(photoUrl(user?.profilePhoto));
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false });
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', gender: user?.gender || '', country: user?.country || 'SO', region: user?.region || '', city: user?.city || '', organization: user?.organization || '', profession: user?.profession || '', participantType: user?.participantType || 'university_student' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const cancelEdit = () => {
    setProfileForm({ fullName: user?.fullName || '', phone: user?.phone || '', gender: user?.gender || '', country: user?.country || 'SO', region: user?.region || '', city: user?.city || '', organization: user?.organization || '', profession: user?.profession || '', participantType: user?.participantType || 'university_student' });
    setProfilePhoto(null);
    setPhotoPreview(photoUrl(user?.profilePhoto));
    setEditing(false);
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(profileForm).forEach(([key, value]) => data.append(key, value));
      if (profilePhoto) data.append('profilePhoto', profilePhoto);
      const updated = await updateProfile(data);
      setPhotoPreview(photoUrl(updated?.profilePhoto));
      setProfilePhoto(null);
      setEditing(false);
    } finally { setProfileSubmitting(false); }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match.');
    if (passwordForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters.');
    setPasswordSubmitting(true);
    try {
      const res = await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      if (res.success) { toast.success('Password updated successfully.'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setChangingPassword(false); }
    } catch (error) { toast.error(error.message || 'Password update failed.'); }
    finally { setPasswordSubmitting(false); }
  };

  const fields = [
    ['Full name', user?.fullName], ['Email address', user?.email], ['Phone number', user?.phone],
    ['Gender', user?.gender?.replaceAll('_', ' ')], ['Country', countryNames.of(user?.country || 'SO')], [user?.country === 'SO' || !user?.country ? 'Region' : 'City / Location', user?.country === 'SO' || !user?.country ? user?.region : user?.city], ['Participant type', participantLabel(user?.participantType)],
    ['University / School', user?.organization], ['Profession', user?.profession],
  ];
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950';

  return <div className="mx-auto max-w-6xl space-y-6 pb-8">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-6 border-b border-slate-200 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <div className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#1a6b3c] text-3xl font-bold text-white shadow-md">
            {photoPreview ? <img src={photoPreview} alt={user?.fullName || 'Profile'} className="h-full w-full object-cover" /> : (user?.fullName || 'P').charAt(0).toUpperCase()}
            <button type="button" onClick={() => { if (!editing) setEditing(true); fileRef.current?.click(); }} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label={photoPreview ? 'Update profile photo' : 'Upload profile photo'}><CameraIcon className="h-7 w-7" /></button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1a6b3c]">Participant profile</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{user?.fullName}</h1><p className="mt-1 text-sm text-slate-500">{user?.email}</p><p className="mt-2 text-xs text-slate-400">Hover over the avatar to update your photo</p></div>
        </div>
        {!editing ? <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a6b3c] px-5 text-sm font-semibold text-white hover:bg-[#145731]"><PencilIcon className="h-4 w-4" /> Edit profile</button> : <button type="button" onClick={cancelEdit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600"><XMarkIcon className="h-4 w-4" /> Cancel</button>}
      </div>

      {!editing ? <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 min-h-5 text-sm font-semibold capitalize text-slate-800">{value || 'Not provided'}</p></div>)}</div> :
      <form onSubmit={handleProfileSubmit} className="space-y-6 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label>Full name *<input className={`${inputClass} mt-2`} value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required /></label>
          <label>Email address<input className={`${inputClass} mt-2 cursor-not-allowed bg-slate-100 text-slate-500`} value={user?.email || ''} disabled /></label>
          <label>Phone number<PhoneInput className="mt-2" value={profileForm.phone} onChange={(phone) => setProfileForm({ ...profileForm, phone })} /></label>
          <label>Gender<select className={`${inputClass} mt-2`} value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label>
          <label>Country<select className={`${inputClass} mt-2`} value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value, region: '', city: '' })}>{COUNTRIES.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}</select></label>
          {profileForm.country === 'SO' ? <label>Region<select className={`${inputClass} mt-2`} value={profileForm.region} onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}><option value="">Select region</option>{REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label> : <label>City / Location<input className={`${inputClass} mt-2`} value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} /></label>}
          <label>Participant type<select className={`${inputClass} mt-2`} value={profileForm.participantType} onChange={(e) => setProfileForm({ ...profileForm, participantType: e.target.value })}><option value="university_student">University Student</option><option value="highschool_graduate">Fresh High-School Graduate</option><option value="developer_it">Developer / IT Specialist</option><option value="professional">Professional</option><option value="general_public">General Public</option><option value="teacher_educator">Teacher / Educator</option><option value="entrepreneur_business">Entrepreneur / Business Owner</option><option value="health_worker">Health Worker</option><option value="community_organization">Community Organization Representative</option><option value="other">Other</option></select></label>
          <label>University / School<input className={`${inputClass} mt-2`} value={profileForm.organization} onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })} /></label>
          <label>Profession<input className={`${inputClass} mt-2`} value={profileForm.profession} onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })} /></label>
        </div>
        <button disabled={profileSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1a6b3c] px-6 text-sm font-bold text-white disabled:opacity-60"><CheckIcon className="h-5 w-5" />{profileSubmitting ? 'Saving…' : 'Save profile'}</button>
      </form>}
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#1a6b3c]"><ShieldCheckIcon className="h-6 w-6" /></span><div><h2 className="text-lg font-bold text-slate-950">Password & security</h2><p className="mt-1 text-sm text-slate-500">Use a strong, unique password to protect your account.</p></div></div>{!changingPassword && <button type="button" onClick={() => setChangingPassword(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><KeyIcon className="h-5 w-5" /> Change password</button>}</div>
      {changingPassword && <form onSubmit={handlePasswordSubmit} className="mt-7 grid grid-cols-1 gap-5 border-t border-slate-100 pt-7 lg:grid-cols-3">{[['currentPassword', 'Current password', 'current', 'Enter your current password'], ['newPassword', 'New password', 'next', 'At least 8 characters'], ['confirmPassword', 'Confirm new password', 'confirm', 'Re-enter your new password']].map(([key, label, visibility, placeholder]) => <label key={key}>{label}<div className="relative mt-2"><input type={visiblePasswords[visibility] ? 'text' : 'password'} value={passwordForm[key]} onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })} placeholder={placeholder} className={`${inputClass} pr-12`} required /><button type="button" onClick={() => setVisiblePasswords({ ...visiblePasswords, [visibility]: !visiblePasswords[visibility] })} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400" aria-label={visiblePasswords[visibility] ? `Hide ${label}` : `Show ${label}`}>{visiblePasswords[visibility] ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div></label>)}<div className="flex gap-3 lg:col-span-3"><button disabled={passwordSubmitting} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{passwordSubmitting ? 'Updating…' : 'Update password'}</button><button type="button" onClick={() => setChangingPassword(false)} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button></div></form>}
    </section>
  </div>;
};

export default Profile;
