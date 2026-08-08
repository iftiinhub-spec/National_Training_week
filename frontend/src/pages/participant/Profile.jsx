import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

export const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    region: user?.region || '',
    organization: user?.organization || '',
    profession: user?.profession || '',
    participantType: user?.participantType || 'university_student',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      await updateProfile(profileForm);
    } catch (err) {
      // toast error handled in updateProfile
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        toast.success('Password updated successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.message || 'Password update failed.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <UserCircleIcon className="w-6 h-6 text-[#1a6b3c]" />
          <h2 className="text-xl font-bold text-slate-900">Update Personal Profile</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (Read Only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer Not To Say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Region</label>
              <input
                type="text"
                value={profileForm.region}
                onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Participant Type</label>
              <select
                value={profileForm.participantType}
                onChange={(e) => setProfileForm({ ...profileForm, participantType: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">University / School</label>
              <input
                type="text"
                value={profileForm.organization}
                onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Profession</label>
              <input
                type="text"
                value={profileForm.profession}
                onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSubmitting}
            className="py-2.5 px-6 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {profileSubmitting ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Password Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <KeyIcon className="w-6 h-6 text-[#155289]" />
          <h2 className="text-xl font-bold text-slate-900">Change Account Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {passwordSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
