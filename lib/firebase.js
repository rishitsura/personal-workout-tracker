import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}

let app
let auth
let db
let googleProvider

if (isFirebaseConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
  // Prompt user selection inside popup always
  googleProvider.setCustomParameters({ prompt: 'select_account' })
}

export { app, auth, db, googleProvider, signInWithPopup, signOut }
