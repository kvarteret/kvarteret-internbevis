import { FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const SHARED_FRONTEND_EVENTSIDE_CONFIG: FirebaseOptions = {
    apiKey: "AIzaSyBpatog9K4wgBpXy5XE-YHcmTwALjlOBUA",
    authDomain: "kvarteret-events.firebaseapp.com",
    projectId: "kvarteret-events",
    storageBucket: "kvarteret-events.firebasestorage.app",
    messagingSenderId: "915628626345",
    appId: "1:915628626345:web:93fb93170dd30e67ce74b8",
}

const readEnvOrFallback = (key: string, fallback: string): string => {
    const value = process.env[key]?.trim()
    return value && value.length > 0 ? value : fallback
}

export const getFirebaseConfig = (): FirebaseOptions => ({
    apiKey: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_API_KEY",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.apiKey ?? "",
    ),
    authDomain: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.authDomain ?? "",
    ),
    projectId: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.projectId ?? "",
    ),
    storageBucket: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.storageBucket ?? "",
    ),
    messagingSenderId: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.messagingSenderId ?? "",
    ),
    appId: readEnvOrFallback(
        "EXPO_PUBLIC_FIREBASE_APP_ID",
        SHARED_FRONTEND_EVENTSIDE_CONFIG.appId ?? "",
    ),
})

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig())

export const db = getFirestore(firebaseApp)
