import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseConfig } from "../lib/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  if (message.type === 'FIREBASE_AUTH_SIGN_IN') {
    signInWithFirebase()
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // 非同期レスポンス
  }
});

async function signInWithFirebase() {
  try {
    const provider = new GoogleAuthProvider();
    // 拡張機能内でポップアップを開く
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: { uid: result.user.uid, email: result.user.email } };
  } catch (error) {
    console.error("Offscreen Auth Error:", error);
    throw error;
  }
}
