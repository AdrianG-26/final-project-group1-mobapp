import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  // These values should match your google-services.json
  apiKey: "AIzaSyD2zYLGJGEXtnrSSTQ0HkqxvdbpW-ToFCI",
  authDomain: "group1-mobapp-database.firebaseapp.com",
  projectId: "group1-mobapp-database",
  storageBucket: "group1-mobapp-database.firebasestorage.app",
  messagingSenderId: "637018214376",
  appId: "1:637018214376:android:4fd9406e95f560a77cde5d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
