// API Endpoints
export const MEME_API_BASE_URL = import.meta.env.VITE_MEME_API_BASE_URL || 'https://api.memegen.link';
export const IMGFLIP_API_URL = import.meta.env.VITE_IMGFLIP_API_URL || 'https://api.imgflip.com';

// API Keys
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Firebase Config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
