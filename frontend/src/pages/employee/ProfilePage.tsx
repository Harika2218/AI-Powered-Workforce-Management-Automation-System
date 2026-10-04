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
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
          My Employee Profile
        </h2>
        <p className="text-xs text-[#78756F] mt-1">
          Review your official organizational designation and maintain contact details
        </p>
      </div>

      {/* Main details banner */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#46513F] text-white flex items-center justify-center text-xl font-bold">
            {employee?.first_name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#242321]">{employee?.full_name}</h3>
            <p className="text-xs text-[#78756F] mt-0.5">
              {employee?.designation} • {employee?.department}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-[#EAE6DE] text-[#242321]">
                ID: {employee?.employee_id}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#71806B]/15 text-[#46513F] font-bold">
                {employee?.employment_status}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#F7F5F0] border border-[#D8D4CC] text-[#78756F]">
                {employee?.employment_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-[#242321] mb-1">Personal Contact Information</h4>
        <p className="text-xs text-[#78756F] mb-4">You may update your contact number, location, and listed competencies</p>

        {profileMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              profileMsg.type === 'success'
                ? 'bg-[#71806B]/15 border-[#71806B]/30 text-[#46513F]'
                : 'bg-[#C8755A]/15 border-[#C8755A]/30 text-[#C8755A]'
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
              <label className="block font-semibold mb-1 text-[#242321]">Corporate Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={employee?.email || user?.email || ''}
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#EAE6DE]/40 text-[#78756F] outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#242321]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#242321]">Current Location / Office</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#242321]">Date of Joining (Read Only)</label>
              <input
                type="text"
                disabled
                value={employee?.date_of_joining || '—'}
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#EAE6DE]/40 text-[#78756F] outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#242321]">Skills (Comma separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="Python, React, SQL, Project Management..."
              className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-[#78756F]" />
          <h4 className="text-sm font-bold text-[#242321]">Account Password & Security</h4>
        </div>
        <p className="text-xs text-[#78756F] mb-4">Ensure your account uses a strong password of at least 8 characters</p>

        {passwordMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              passwordMsg.type === 'success'
                ? 'bg-[#71806B]/15 border-[#71806B]/30 text-[#46513F]'
                : 'bg-[#C8755A]/15 border-[#C8755A]/30 text-[#C8755A]'
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
            <label className="block font-semibold mb-1 text-[#242321]">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#242321]">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#242321]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-4 py-2 bg-[#71806B] text-white text-xs font-bold rounded-lg hover:bg-[#46513F] cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
