import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const SignUp = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    region: 'Banadir / Mogadishu',
    organization: '',
    profession: '',
    participantType: 'university_student',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...dataToSend } = form;
      await register(dataToSend);
      navigate('/portal');
    } catch (err) {
      // toast error handled in register()
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 text-black bg-white";

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[85vh] flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img
              src="/logo.png"
              alt="National Training Week Logo"
              className="h-30 w-auto mx-auto object-contain"
            />
          </Link>
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
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+252 61..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer Not To Say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="e.g. Banadir"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option value="university_student">University Student</option>
                  <option value="highschool_graduate">Fresh High-School Graduate</option>
                  <option value="developer_it">Developer / IT Specialist</option>
                  <option value="professional">Professional</option>
                  <option value="general_public">General Public</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  University / School
                </label>
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="e.g. University / Institution"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">
                  Profession
                </label>
                <input
                  type="text"
                  name="profession"
                  value={form.profession}
                  onChange={handleChange}
                  placeholder="e.g. Student / Software Eng"
                  className={inputClass}
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
