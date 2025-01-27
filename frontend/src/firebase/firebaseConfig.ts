// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_storageBucket,
  messagingSenderId: process.env.NEXT_messagingSenderId,
  appId: "1:117231980399:web:b797a15671d9549e80629a",
  measurementId: process.env.NEXT_measurementId,
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only on client side
let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && getAnalytics(app));
}

// Export the Firebase Auth instance with the correct type
export const auth: Auth = getAuth(app);



export default app;
