import { cert, getApps, initializeApp, AppOptions, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // If using emulator, allow initialization without service account
  const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

  // During build time, environment variables may not be available
  // Return a dummy app that will cause graceful failures
  if (!clientEmail || !privateKey) {
    if (usingEmulator && projectId) {
      // Initialize a minimal app for emulator usage
      adminApp = getApps().length ? getApps()[0] : initializeApp({ projectId }, 'admin');
      return adminApp;
    }
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Firebase Admin SDK environment variables not available during build. Using placeholder.');
      // Create a minimal app that won't crash during build
      try {
        adminApp = getApps().find(app => app.name === 'admin') || getApps()[0];
        if (adminApp) return adminApp;
      } catch (e) {
        // Ignore errors during build
      }
      throw new Error('Firebase Admin not initialized - environment variables missing');
    }
    throw new Error(
      'Missing Firebase Admin SDK environment variables. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
  }

  const options: AppOptions = {
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
    }),
    projectId,
  };

  // Initialize Firebase Admin only once
  adminApp = getApps().length ? getApps()[0] : initializeApp(options, 'admin');
  return adminApp;
}

// Lazy initialization functions
export function getAdminDb(): Firestore {
  if (!adminDb) {
    try {
      adminDb = getFirestore(getAdminApp());
    } catch (error) {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        // During build, throw a build-safe error
        throw new Error('Firebase Admin DB not available during build');
      }
      throw error;
    }
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    try {
      adminAuth = getAuth(getAdminApp());
    } catch (error) {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        // During build, throw a build-safe error
        throw new Error('Firebase Admin Auth not available during build');
      }
      throw error;
    }
  }
  return adminAuth;
}

// Export instances for backward compatibility
export { getAdminDb as adminDb };
export { getAdminAuth as adminAuth };

// Utility function to verify ID token
export async function verifyIdToken(idToken: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid token');
  }
}

// Utility function to get user by UID
export async function getUserByUid(uid: string) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('User not found');
  }
}

export default getAdminApp;
