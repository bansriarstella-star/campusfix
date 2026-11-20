import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const configModules = import.meta.glob('../../firebase-applet-config.json', {
  eager: true,
}) as Record<string, { default?: Partial<FirebaseClientConfig> }>;

const appletJsonConfig: Partial<FirebaseClientConfig> =
  Object.values(configModules)[0]?.default ?? {};

const envConfig: Partial<FirebaseClientConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined,
};

export const firebaseConfig: FirebaseClientConfig = {
  apiKey: envConfig.apiKey ?? appletJsonConfig.apiKey ?? '',
  authDomain: envConfig.authDomain ?? appletJsonConfig.authDomain ?? '',
  projectId: envConfig.projectId ?? appletJsonConfig.projectId ?? '',
  storageBucket: envConfig.storageBucket ?? appletJsonConfig.storageBucket ?? '',
  messagingSenderId: envConfig.messagingSenderId ?? appletJsonConfig.messagingSenderId ?? '',
  appId: envConfig.appId ?? appletJsonConfig.appId ?? '',
  firestoreDatabaseId:
    envConfig.firestoreDatabaseId ?? appletJsonConfig.firestoreDatabaseId ?? '(default)',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes('MY_') &&
    !firebaseConfig.projectId.includes('remixed-project-id'),
);

export const BOOTSTRAPPED_ADMIN_EMAIL = 'bansriarstella@gmail.com';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  appInstance = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  authInstance = getAuth(appInstance);
  const databaseId = firebaseConfig.firestoreDatabaseId;
  dbInstance =
    databaseId && databaseId !== '(default)'
      ? getFirestore(appInstance, databaseId)
      : getFirestore(appInstance);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  const currentUser = auth?.currentUser;
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serialized);
  throw new Error(serialized);
}

export function getReadableFirebaseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  let message = raw;
  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      message = parsed.error;
    }
  } catch {
    // Plain error string
  }

  const lower = message.toLowerCase();
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'Permission denied: your account is not authorized to perform this action.';
  }
  if (lower.includes('quota exceeded')) {
    return 'Firestore daily quota exceeded. Please try again tomorrow or upgrade your Firebase plan.';
  }
  if (lower.includes('the client is offline') || lower.includes('unavailable')) {
    return 'Cannot reach Cloud Firestore. Check your internet connection and Firebase project configuration.';
  }
  if (lower.includes('popup-closed-by-user')) {
    return 'Google sign-in popup was closed before finishing.';
  }
  if (lower.includes('unauthorized-domain')) {
    return 'This hostname is not authorized in Firebase Authentication. Add this domain under Firebase Console -> Authentication -> Settings -> Authorized domains.';
  }
  if (lower.includes('failed-precondition') && lower.includes('index')) {
    return 'Firestore composite index required for this query. Publish firestore.indexes.json to your Firebase project.';
  }
  return message;
}

export async function testConnection(): Promise<{ ok: boolean; offlineError?: string }> {
  if (!db) {
    return { ok: false, offlineError: 'Firebase is not configured.' };
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { ok: false, offlineError: 'Please check your Firebase configuration.' };
    }
    // A permission-denied response from server still confirms live connectivity.
    return { ok: true };
  }
}
