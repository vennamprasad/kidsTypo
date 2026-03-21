import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getRemoteConfig } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: "AIzaSyBL6OkNs2V-YsIzSHpUnbXdOUqAASHFlto",
  authDomain: "kiddlr.firebaseapp.com",
  projectId: "kiddlr",
  storageBucket: "kiddlr.firebasestorage.app",
  messagingSenderId: "831912111271",
  appId: "1:831912111271:web:a02e21ec87bf2a2454bf82",
  measurementId: "G-V9BKQV8FK4"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const remoteConfig = typeof window !== "undefined" ? getRemoteConfig(app) : null;

// Initialize Analytics (only in client-side)
const analyticsPromise = isSupported().then((supported) => {
  if (supported && typeof window !== "undefined") {
    return getAnalytics(app);
  }
  return null;
});

export { app, auth, db, storage, remoteConfig, analyticsPromise };
