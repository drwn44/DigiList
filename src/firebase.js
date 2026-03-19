import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import Constants from 'expo-constants'
import AsyncStorage from "@react-native-async-storage/async-storage";

const {extra} = Constants.expoConfig;

const firebaseConfig = {
    apiKey: extra.firebaseApiKey,
    authDomain: extra.firebaseAuthDomain,
    projectId: extra.firebaseProjectId,
    storageBucket: extra.firebaseStorageBucket,
    messagingSenderId: extra.firebaseMessagingSenderId,
    appId: extra.firebaseAppId,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});