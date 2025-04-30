// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfgoCCaUhG4pfhgtLaAhAHa6bbUTsVMEw",
  authDomain: "invoicify-q1uzp.firebaseapp.com",
  projectId: "invoicify-q1uzp",
  storageBucket: "invoicify-q1uzp.firebasestorage.app",
  messagingSenderId: "966783409208",
  appId: "1:966783409208:web:cefeed3c12c72a30c6dacd"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);
auth = getAuth(app);
storage = getStorage(app);

export { db, auth, app, storage };
