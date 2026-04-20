// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyBaqViQpUFzJfbst2YEV4JnbJOXAEruUGU",
  authDomain:        "splitsmart-3e23d.firebaseapp.com",
  projectId:         "splitsmart-3e23d",
  storageBucket:     "splitsmart-3e23d.firebasestorage.app",
  messagingSenderId: "942655765272",
  appId:             "1:942655765272:web:017a0fb39dae8078effc6d",
}

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

if (window.location.hostname !== 'localhost') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline mode works only in one tab at a time.')
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence.')
    } else {
      console.error("Offline mode failed to initialize:", err)
    }
  })
}