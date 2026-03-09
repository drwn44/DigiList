import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants'

const {extra} = Constants.expoConfig;

const firebaseConfig = {
    apiKey: extra.firebaseApiKey,
    authDomain: "digilist-19aa4.firebaseapp.com",
    projectId: "digilist-19aa4",
    storageBucket: "digilist-19aa4.firebasestorage.app",
    messagingSenderId: "430919264998",
    appId: "1:430919264998:web:60abf4c716fcdeab19e927",
    measurementId: "G-7QJ1W7QZK1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('auth init:', auth);