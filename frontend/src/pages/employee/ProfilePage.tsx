import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesApi } from '../../api/employees';
import { apiClient } from '../../api/client';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, employee, updateEmployeeState } = useAuth();

  const [phone, setPhone] = useState(employee?.phone || '');
  const [location, setLocation] = useState(employee?.location || '');
  const [skillsStr, setSkillsStr] = useState((employee?.skills || []).join(', '));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await employeesApi.updateOwnProfile({
        phone,
        location,
        skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      });
      updateEmployeeState(updated);
      setProfileMsg({ text: 'Personal profile details updated successfully.', type: 'success' });
    } catch (err: any) {
      setProfileMsg({
        text: err.response?.data?.detail || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordMsg({ text: 'Account password updated successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({
        text: err.response?.data?.detail || 'Password change failed. Verify your current password.',
        type: 'error',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-[#E2E8F0]">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
          My Employee Profile
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Review your official organizational designation and maintain contact details
        </p>
      </div>

      {/* Main details banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-blue-500/20">
            {employee?.first_name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172033]">{employee?.full_name}</h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              {employee?.designation} • {employee?.department}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] font-semibold border border-blue-200">
                ID: {employee?.employee_id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] font-bold border border-emerald-200">
                {employee?.employment_status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[#64748B] font-medium font-sans">
                {employee?.employment_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-[#172033] mb-1">Personal Contact Information</h4>
        <p className="text-xs text-[#64748B] mb-4 font-medium">You may update your contact number, location, and listed competencies</p>

        {profileMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                : 'bg-red-50 border-red-200 text-[#DC2626]'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">Corporate Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={employee?.email || user?.email || ''}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B] outline-none cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">Current Location / Office</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">Date of Joining (Read Only)</label>
              <input
                type="text"
                disabled
                value={employee?.date_of_joining || '—'}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#64748B] outline-none cursor-not-allowed font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#172033]">Skills (Comma separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="Python, React, SQL, Project Management..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-[#2563EB]" />
          <h4 className="text-sm font-bold text-[#172033]">Account Password & Security</h4>
        </div>
        <p className="text-xs text-[#64748B] mb-4 font-medium">Ensure your account uses a strong password of at least 8 characters</p>

        {passwordMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                : 'bg-red-50 border-red-200 text-[#DC2626]'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#172033]">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#172033]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 transition-all shadow-sm shadow-blue-500/20 active:scale-[0.98]"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
