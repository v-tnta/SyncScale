// Firebaseの初期化設定ファイル

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInAnonymously, linkWithPopup } from "firebase/auth";

// Firebaseコンソールから取得した設定をここに貼り付けます
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Firestoreのインスタンスをエクスポートして、他のファイルで使えるようにします
export const db = getFirestore(app);

// AuthのインスタンスとGoogleプロバイダをエクスポートします
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInAnonymously, linkWithPopup }; // 匿名ログインとアカウント連携用に追加
