import { initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/constants';

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Email link authentication settings
export const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true
}

export const sendSignInEmail = async (email) => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    window.localStorage.setItem('emailForSignIn', email)
    return true
  } catch (error) {
    console.error('Error sending sign in email:', error)
    throw error
  }
}

export default app
