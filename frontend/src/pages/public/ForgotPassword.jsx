import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, EnvelopeIcon } from '@icons';
import api from '../../api/axios';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(res.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.message || 'Unable to send reset link');
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
          <h2 className="text-2xl font-black tracking-tight text-black">Forgot Password</h2>
          <p className="text-xs text-black/70">
            Enter your email address and we will send a secure reset link if the account exists.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-black/10 bg-white p-8 shadow-xl">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1da156]/10">
                <EnvelopeIcon className="h-6 w-6 text-[#1da156]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-black">Check your email</h3>
                <p className="mt-2 text-sm leading-6 text-black/70">
                  If an account uses that email, a password reset link has been sent. The link expires in one hour.
                </p>
              </div>
              <Link to="/signin" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#1da156] hover:underline">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-black">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1da156]/40"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-black disabled:opacity-50"
              >
                {submitting ? 'Sending Link...' : 'Send Reset Link'}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
