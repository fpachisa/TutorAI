import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key-for-build',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-domain.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-bucket.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id'
};

// Initialize Firebase - needed for both client and server
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// Connect to emulators in development
// Connect to emulators in development (browser)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only run emulators in browser environment during development
  if (window.location.hostname === 'localhost') {
    try {
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      // Emulator may already be connected, ignore errors
      console.log('Firebase Firestore emulator already connected or not available');
    }
    
    try {
      // Connect to Auth emulator
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } catch (error) {
      // Emulator may already be connected, ignore errors
      console.log('Firebase Auth emulator already connected or not available');
    }
  }
}

// Connect to emulators in development (server) when FIRESTORE_EMULATOR_HOST is set
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const host = process.env.FIRESTORE_EMULATOR_HOST || '';
  if (host) {
    const [hostname, portStr] = host.split(':');
    const port = Number(portStr || '8080');
    try {
      connectFirestoreEmulator(db, hostname || 'localhost', port);
      // No auth emulator hookup here on server
      // eslint-disable-next-line no-console
      console.log(`[firebaseClient] Connected server Firestore to emulator at ${hostname}:${port}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[firebaseClient] Failed to connect server Firestore emulator:', (e as Error).message);
    }
  }
}

export { app };
export default app;
