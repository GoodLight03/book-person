import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8n5UlDhwUQxvJI20gFis_QDHIFKtMRqw",
  authDomain: "bcaodky.firebaseapp.com",
  databaseURL: "https://bcaodky-default-rtdb.firebaseio.com",
  projectId: "bcaodky",
  storageBucket: "bcaodky.firebasestorage.app",
  messagingSenderId: "679950041561",
  appId: "1:679950041561:web:4ed4eca5ccc71a0174d9c8",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
