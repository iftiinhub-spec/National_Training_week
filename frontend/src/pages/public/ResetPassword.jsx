import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@icons';
import api from '../../api/axios';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      toast.success(res.message || 'Password reset successful. Please sign in.');
      navigate('/signin', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="National Training Week Logo" className="mx-auto h-20 w-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-black">Reset Password</h2>
          <p className="text-xs text-black/70">Choose a new password for your National Training Week account.</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-black/10 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-black">New Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-10 pr-12 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-black/45 transition-colors hover:text-[#1da156] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1da156]"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-black">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={8}
                  className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-10 pr-12 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-black/45 transition-colors hover:text-[#1da156] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1da156]"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-black disabled:opacity-50"
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="border-t border-black/10 pt-4 text-center">
            <Link to="/signin" className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#1da156] hover:underline">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
