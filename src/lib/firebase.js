import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let auth = null;

if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
    } catch (err) {
      console.error('Failed to initialize Firebase client SDK:', err);
    }
  } else {
    console.warn('Firebase public configuration (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. Phone verification will be inactive.');
  }
}

export { app, auth };
