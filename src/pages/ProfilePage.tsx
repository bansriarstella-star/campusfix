import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  LogIn,
  LogOut,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { SetupRequiredBanner } from '../components/SetupRequiredBanner';
import { useAuth } from '../context/AuthContext';
import { getReadableFirebaseError, isFirebaseConfigured } from '../lib/firebase';
import { DGU_HOSTEL_SUGGESTIONS, VALIDATION_LIMITS } from '../types/campusfix';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const {
    firebaseUser,
    profile,
    providerAccount,
    isAdmin,
    isProvider,
    effectiveRole,
    authReady,
    authBusy,
    authError,
    signInWithGoogle,
    signOutUser,
    updateMyProfileDetails,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [hostelBuilding, setHostelBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setHostelBuilding(profile.hostelBuilding || '');
      setRoomNumber(profile.roomNumber || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  if (!isFirebaseConfigured) {
    return <SetupRequiredBanner />;
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await updateMyProfileDetails({
        displayName,
        hostelBuilding,
        roomNumber,
        phone,
      });
      setSaveMessage('Saved hostel defaults to your profile.');
    } catch (err) {
      setSaveError(getReadableFirebaseError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!authReady) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="mt-4 h-20 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1F3D]">
            Sign in to CampusFix
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Use your Google account to create service requests, save your DGU hostel/PG location, and track updates. New accounts always start as students.
          </p>
        </div>

        {authError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-sm text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={authBusy}
          onClick={() => signInWithGoogle()}
          className="min-h-[48px] px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{authBusy ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Signed-in Identity Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {firebaseUser.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={profile?.displayName || firebaseUser.displayName || 'User avatar'}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <UserIcon className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-[#0F1F3D] truncate">
              {profile?.displayName || firebaseUser.displayName || 'DGU Student'}
            </h1>
            <p className="text-sm text-slate-600 truncate">{firebaseUser.email}</p>
            <p className="mt-1 text-xs text-slate-500">
              Role:{' '}
              <span className="font-semibold text-[#0F1F3D] capitalize">
                {effectiveRole}
              </span>
              {isProvider && providerAccount && (
                <span> · Assigned to {providerAccount.providerName}</span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={authBusy}
          onClick={() => signOutUser()}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-sm font-semibold text-[#0F1F3D] inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </section>

      {/* Role Workspaces (when authorized by backend rules) */}
      {(isProvider || isAdmin) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isProvider && (
            <button
              type="button"
              onClick={() => onNavigate('/provider')}
              className="text-left bg-white border border-slate-200 hover:border-teal-600 rounded-2xl p-5 shadow-sm transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>Provider Console</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                View and update requests assigned to {providerAccount?.providerName}.
              </p>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="text-left bg-white border border-slate-200 hover:border-teal-600 rounded-2xl p-5 shadow-sm transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#0F1F3D] font-semibold text-sm">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>Admin Console</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Seed demo catalog, manage providers/services, and review all requests.
              </p>
            </button>
          )}
        </section>
      )}

      {/* Editable Hostel / PG Defaults */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#0F1F3D]">
          Saved hostel or PG defaults
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Optional details used to pre-fill booking requests. Ordinary users cannot edit their access role.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="prof-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={VALIDATION_LIMITS.displayNameMax}
                required
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
              />
            </div>

            <div>
              <label
                htmlFor="prof-phone"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Phone number (optional)
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={VALIDATION_LIMITS.phoneMax}
                placeholder="e.g. +91 98XXXXXXXX"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-building"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Default hostel / PG building
              </label>
              <input
                id="prof-building"
                type="text"
                list="profile-dgu-hostels"
                value={hostelBuilding}
                onChange={(e) => setHostelBuilding(e.target.value)}
                maxLength={VALIDATION_LIMITS.hostelBuildingMax}
                placeholder="e.g. DGU Boys Hostel — Block A"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
              />
              <datalist id="profile-dgu-hostels">
                {DGU_HOSTEL_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="prof-room"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Default room / pickup point
              </label>
              <input
                id="prof-room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                maxLength={VALIDATION_LIMITS.roomNumberMax}
                placeholder="e.g. Room 214"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0F1F3D]"
              />
            </div>
          </div>

          {saveError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F1F3D] hover:bg-[#1E3354] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save profile details'}
          </button>
        </form>
      </section>

      {/* Account UID Reference (useful for one-time Firebase Console role assignment) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-[#0F1F3D]">Account UID reference</p>
        <p>
          Signed-in Firebase UID:{' '}
          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#0F1F3D] select-all">
            {firebaseUser.uid}
          </code>
        </p>
        <p>
          Provider and administrator roles are enforced by Firestore security rules (<code className="font-mono">admins/{'{uid}'}</code> and <code className="font-mono">providerAccounts/{'{uid}'}</code>), not by client-side selection.
        </p>
      </section>
    </div>
  );
}
