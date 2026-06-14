import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLEnhC545LNW9GyKfWaJPJCrOKUotYqpY",
  authDomain: "nt-earn-hub.firebaseapp.com",
  databaseURL: "https://nt-earn-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nt-earn-hub",
  storageBucket: "nt-earn-hub.firebasestorage.app",
  messagingSenderId: "606638253911",
  appId: "1:606638253911:web:77a1c0323c2e70afcc4012",
  measurementId: "G-MV1M11X3ST"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const dbInstance = getDatabase(app);
export const authInstance = getAuth(app);
export const storageInstance = getStorage(app);
export { app };
