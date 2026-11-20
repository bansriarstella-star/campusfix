import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  getReadableFirebaseError,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  VALIDATION_LIMITS,
  type ProviderAccount,
  type UserProfile,
  type UserRole,
} from '../types/campusfix';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  providerAccount: ProviderAccount | null;
  isAdmin: boolean;
  isProvider: boolean;
  effectiveRole: UserRole;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  offlineWarning: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateMyProfileDetails: (patch: {
    displayName: string;
    hostelBuilding: string;
    roomNumber: string;
    phone: string;
  }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [providerAccount, setProviderAccount] = useState<ProviderAccount | null>(null);
  const [hasAdminMarker, setHasAdminMarker] = useState(false);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [offlineWarning, setOfflineWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    testConnection().then((res) => {
      if (!cancelled && !res.ok && res.offlineError) {
        setOfflineWarning(res.offlineError);
      }
    });

    let unsubUserDoc: (() => void) | null = null;
    let unsubProviderDoc: (() => void) | null = null;
    let unsubAdminDoc: (() => void) | null = null;

    const cleanupDocListeners = () => {
      unsubUserDoc?.();
      unsubProviderDoc?.();
      unsubAdminDoc?.();
      unsubUserDoc = null;
      unsubProviderDoc = null;
      unsubAdminDoc = null;
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      cleanupDocListeners();
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setProviderAccount(null);
        setHasAdminMarker(false);
        setAuthReady(true);
        return;
      }

      const uid = user.uid;
      const userRef = doc(db!, 'users', uid);

      try {
        const existingSnap = await getDoc(userRef);
        if (!existingSnap.exists()) {
          const isBootAdmin =
            user.emailVerified && user.email === BOOTSTRAPPED_ADMIN_EMAIL;
          await setDoc(userRef, {
            uid,
            displayName: (user.displayName || 'DGU Student').slice(
              0,
              VALIDATION_LIMITS.displayNameMax,
            ),
            email: (user.email || '').slice(0, VALIDATION_LIMITS.emailMax),
            photoURL: (user.photoURL || '').slice(0, VALIDATION_LIMITS.photoUrlMax),
            role: isBootAdmin ? 'admin' : 'student',
            providerId: '',
            hostelBuilding: '',
            roomNumber: '',
            phone: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        // Surface readable error without breaking sign-in state
        setAuthError(getReadableFirebaseError(error));
      }

      unsubUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setAuthReady(true);
        },
        (error) => {
          setAuthReady(true);
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        },
      );

      const providerAccRef = doc(db!, 'providerAccounts', uid);
      unsubProviderDoc = onSnapshot(
        providerAccRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as ProviderAccount;
            setProviderAccount(data.active ? data : null);
          } else {
            setProviderAccount(null);
          }
        },
        () => {
          // Non-provider users or uncreated docs simply have no provider account
          setProviderAccount(null);
        },
      );

      const adminRef = doc(db!, 'admins', uid);
      unsubAdminDoc = onSnapshot(
        adminRef,
        (snap) => {
          setHasAdminMarker(snap.exists());
        },
        () => {
          setHasAdminMarker(false);
        },
      );
    });

    return () => {
      cancelled = true;
      cleanupDocListeners();
      unsubAuth();
    };
  }, []);

  const isBootAdmin = Boolean(
    firebaseUser?.emailVerified && firebaseUser?.email === BOOTSTRAPPED_ADMIN_EMAIL,
  );
  const isAdmin = isBootAdmin || hasAdminMarker;
  const isProvider = Boolean(providerAccount && providerAccount.active);
  const effectiveRole: UserRole = isAdmin ? 'admin' : isProvider ? 'provider' : 'student';

  async function signInWithGoogle() {
    if (!auth) {
      setAuthError('Firebase Authentication is not configured.');
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(getReadableFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOutUser() {
    if (!auth) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setProfile(null);
      setProviderAccount(null);
      setHasAdminMarker(false);
    } catch (error) {
      setAuthError(getReadableFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function updateMyProfileDetails(patch: {
    displayName: string;
    hostelBuilding: string;
    roomNumber: string;
    phone: string;
  }) {
    if (!db || !firebaseUser) {
      throw new Error('Sign in required to update your profile.');
    }
    const cleanName = patch.displayName.trim().slice(0, VALIDATION_LIMITS.displayNameMax);
    if (!cleanName) {
      throw new Error('Display name is required.');
    }
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        displayName: cleanName,
        hostelBuilding: patch.hostelBuilding.trim().slice(0, VALIDATION_LIMITS.hostelBuildingMax),
        roomNumber: patch.roomNumber.trim().slice(0, VALIDATION_LIMITS.roomNumberMax),
        phone: patch.phone.trim().slice(0, VALIDATION_LIMITS.phoneMax),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        providerAccount,
        isAdmin,
        isProvider,
        effectiveRole,
        authReady,
        authBusy,
        authError,
        offlineWarning,
        signInWithGoogle,
        signOutUser,
        updateMyProfileDetails,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
}
