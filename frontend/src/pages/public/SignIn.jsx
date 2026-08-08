import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LockClosedIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'moderator') {
        navigate('/moderator');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      // toast error handled in login()
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#155289] text-white flex items-center justify-center mx-auto font-black text-xl shadow-md">
            HU
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to National Training Week
          </h2>
          <p className="text-xs text-slate-500">
            Account access for Participants, Moderators, and Administrators
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Password
                </label>
              </div>
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Signing In...' : 'Sign In to Portal'}
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
            <p>
              Don't have a participant account?{' '}
              <Link to="/signup" className="font-bold text-[#1a6b3c] hover:underline">
                Sign Up Here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignIn;
