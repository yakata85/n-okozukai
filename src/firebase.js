// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDp0gD-H90BgjxJpJR5hZLWlAF2a70xsDfI",
  authDomain: "n-okozukai.firebaseapp.com",
  projectId: "n-okozukai",
  storageBucket: "n-okozukai.appspot.com",
  messagingSenderId: "52410786728",
  appId: "1:52410786728:web:8292c41ae6655a9ce3e1d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);