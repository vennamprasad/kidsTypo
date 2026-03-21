import * as admin from 'firebase-admin';

const firebaseConfig = {
  projectId: "kiddlr",
  // In a real environment, you'd use a service account key here.
  // For this environment, we assume the environment is already authenticated or using default credentials.
};

if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
