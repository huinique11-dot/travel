const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const hasFirebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const MAPS_KEY = env.VITE_GOOGLE_MAPS_API_KEY || '';
export const MAP_ID = env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
export const hasMaps = Boolean(MAPS_KEY);
