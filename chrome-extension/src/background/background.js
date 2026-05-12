import { initializeApp } from "firebase/app";
import { getAuth, signOut, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { firebaseConfig } from "../lib/firebase-config.js";

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOGIN') {
    handleLogin(sendResponse);
    return true;
  }
  if (request.type === 'LOGOUT') {
    signOut(auth).then(() => sendResponse({ success: true }));
    return true;
  }
  if (request.type === 'FETCH_TASKS') {
    handleFetchTasks(request.data, sendResponse);
    return true;
  }
  if (request.type === 'GET_AUTH_STATE') {
    sendResponse({ user: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null });
    return true;
  }
});

// Chrome Identity APIを使ったログイン処理
async function handleLogin(sendResponse) {
  console.log("SyncScale: Starting chrome.identity login flow...");
  try {
    // 1. ChromeのアカウントからGoogleのトークンを取得
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome Identity Error:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      console.log("SyncScale: Successfully retrieved Google OAuth token.");

      try {
        // 2. 取得したトークンを使ってFirebase Authにログイン
        const credential = GoogleAuthProvider.credential(null, token);
        const result = await signInWithCredential(auth, credential);
        
        console.log("SyncScale: Firebase Auth Login success!");
        sendResponse({ success: true, user: { uid: result.user.uid, email: result.user.email } });
      } catch (firebaseErr) {
        console.error("Firebase Login Error:", firebaseErr);
        sendResponse({ success: false, error: firebaseErr.message });
      }
    });
  } catch (err) {
    console.error("SyncScale: handleLogin caught error:", err);
    sendResponse({ success: false, error: err.message });
  }
}

// 課題取得とFirestore保存
async function handleFetchTasks(tasks, sendResponse) {
  if (!auth.currentUser) {
    sendResponse({ success: false, error: "ログインが必要です" });
    return;
  }

  try {
    const results = await registerTasks(tasks);
    sendResponse({ success: true, results });
  } catch (err) {
    console.error("Firestore Error:", err);
    sendResponse({ success: false, error: err.message });
  }
}

async function registerTasks(tasks) {
  const userId = auth.currentUser.uid;
  const results = { added: 0, skipped: 0 };

  for (const task of tasks) {
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("title", "==", task.title)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const deadlineDate = new Date(task.deadline);
      await addDoc(collection(db, "tasks"), {
        userId,
        title: task.title,
        course: task.course,
        deadline: Timestamp.fromDate(deadlineDate),
        createdAt: Timestamp.now(),
        status: "todo"
      });
      results.added++;
    } else {
      results.skipped++;
    }
  }
  return results;
}

// 認証状態の変化を監視
auth.onAuthStateChanged((user) => {
  console.log("SyncScale Auth State Changed:", user ? user.email : "null");
});
