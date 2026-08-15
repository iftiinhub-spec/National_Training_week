import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import PhoneInput from '../../components/common/PhoneInput';
import TrainerApply from './TrainerApply';
import { getCountries } from 'libphonenumber-js';

const SOMALIA_REGIONS = [
  'Awdal', 'Bakool', 'Banaadir', 'Bari', 'Bay', 'Galguduud', 'Gedo', 'Hiiraan',
  'Lower Juba', 'Middle Juba', 'Lower Shabelle', 'Middle Shabelle', 'Mudug',
  'Nugaal', 'Sanaag', 'Sool', 'Togdheer', 'Woqooyi Galbeed',
];
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = getCountries().map((code) => ({ code, name: countryNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));

export const SignUp = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const registrationType = searchParams.get('type') === 'trainer' ? 'trainer' : 'participant';
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    country: 'SO',
    region: '',
    city: '',
    organization: '',
    profession: '',
    participantType: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value, ...(name === 'country' ? { region: '', city: '' } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = { ...form };
      delete dataToSend.confirmPassword;
      await register(dataToSend);
      navigate('/signin');
    } catch (err) {
      // toast error handled in register()
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 text-black bg-white";

  const registrationTabs = <div className="mx-auto grid w-full max-w-md grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Registration type"><button type="button" role="tab" aria-selected={registrationType === 'participant'} onClick={() => setSearchParams({ type: 'participant' })} className={`rounded-lg px-4 py-3 text-sm font-bold transition ${registrationType === 'participant' ? 'bg-white text-[#1a6b3c] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Participant</button><button type="button" role="tab" aria-selected={registrationType === 'trainer'} onClick={() => setSearchParams({ type: 'trainer' })} className={`rounded-lg px-4 py-3 text-sm font-bold transition ${registrationType === 'trainer' ? 'bg-white text-[#1a6b3c] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Trainer</button></div>;

  if (registrationType === 'trainer') return <div className="flex min-h-[85vh] items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8"><div className="w-full max-w-5xl space-y-6">{registrationTabs}<TrainerApply /></div></div>;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[85vh] flex items-center justify-center">
      <div className="max-w-5xl w-full space-y-6">
        {registrationTabs}
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          {/* <Link to="/" className="inline-block">
            <img
              src="/logo.png"
              alt="National Training Week Logo"
              className="h-20 w-auto mx-auto object-contain"
            />
          </Link> */}
          <h2 className="text-2xl font-black text-black tracking-tight">
            Participant Account Registration
          </h2>
          <p className="text-xs text-black/70">
            Create an account to browse, register for sessions, receive invitations, and earn verified certificates.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white p-8 rounded-2xl border border-black/10 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Abdi Mohamed Hassan"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="abdi@example.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Password *
                </label>
                <div className="relative"><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" className={`${inputClass} pr-12`} required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-black/50 hover:text-[#1da156]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative"><input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className={`${inputClass} pr-12`} required />
                  <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-black/50 hover:text-[#1da156]" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Phone Number *
                </label>
                <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div><label className="block text-xs font-bold text-black uppercase mb-1">Country *</label><select name="country" value={form.country} onChange={handleChange} className={inputClass} required>{COUNTRIES.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}</select></div>

              {form.country === 'SO' ? <div><label className="block text-xs font-bold text-black uppercase mb-1">Region *</label><select name="region" value={form.region} onChange={handleChange} className={inputClass} required><option value="">Select Region</option>{SOMALIA_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}</select></div> : <div><label className="block text-xs font-bold text-black uppercase mb-1">City / Location</label><input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="e.g. Nairobi" maxLength={100} /></div>}

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Participant Type *
                </label>
                <select
                  name="participantType"
                  value={form.participantType}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Participant Type</option>
                  <option value="university_student">University Student</option>
                  <option value="highschool_graduate">Fresh High-School Graduate</option>
                  <option value="developer_it">Developer / IT Specialist</option>
                  <option value="professional">Professional</option>
                  <option value="general_public">General Public</option>
                  <option value="teacher_educator">Teacher / Educator</option>
                  <option value="entrepreneur_business">Entrepreneur / Business Owner</option>
                  <option value="health_worker">Health Worker</option>
                  <option value="community_organization">Community Organization Representative</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Organization / Institution {form.participantType === 'general_public' ? '(Optional)' : '*'}
                </label>
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="e.g. University / Institution"
                  className={inputClass}
                  required={form.participantType !== 'general_public'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Profession *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={form.profession}
                  onChange={handleChange}
                  placeholder="e.g. Student / Software Eng"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#1da156] hover:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 mt-4"
            >
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="pt-4 border-t border-black/10 text-center text-xs text-black/70 mt-4">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-[#1da156] hover:underline">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignUp;
