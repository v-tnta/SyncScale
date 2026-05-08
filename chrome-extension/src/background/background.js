import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { firebaseConfig } from "../lib/firebase-config.js";

console.log("SyncScale: Background service worker initialized");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let creating; 
async function setupOffscreenDocument(path) {
  if (await chrome.offscreen.hasDocument()) return;
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: 'Firebase Auth popup',
    });
    await creating;
    creating = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "LOGIN") {
    handleLogin(sendResponse);
    return true;
  }
  
  if (message.action === "LOGOUT") {
    signOut(auth).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === "CHECK_AUTH") {
    const user = auth.currentUser;
    sendResponse({ user: user ? { uid: user.uid, email: user.email } : null });
    return false;
  }

  if (message.action === "FETCH_TASKS") {
    handleFetchTasks(sendResponse);
    return true;
  }
});

async function handleLogin(sendResponse) {
  try {
    await setupOffscreenDocument('src/offscreen/offscreen.html');
    const response = await chrome.runtime.sendMessage({
      type: 'FIREBASE_AUTH_SIGN_IN',
      target: 'offscreen'
    });
    
    if (response && response.success) {
      sendResponse(response);
    } else {
      sendResponse({ success: false, error: response?.error || "ログイン失敗" });
    }
  } catch (err) {
    console.error("Login error:", err);
    sendResponse({ success: false, error: err.message });
  }
}

async function handleFetchTasks(sendResponse) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return sendResponse({ success: false, error: "ログインしてください" });
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return sendResponse({ success: false, error: "manabaのページを開いてください" });
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_TASKS" });
    
    if (!response || !response.success) {
      return sendResponse({ success: false, error: response?.error || "ページから課題を取得できませんでした。" });
    }

    if (response.tasks.length === 0) {
      return sendResponse({ success: true, count: 0 });
    }

    const newCount = await registerTasks(user.uid, response.tasks);
    sendResponse({ success: true, count: newCount });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    sendResponse({ success: false, error: "通信エラーが発生しました: " + error.message });
  }
}

async function registerTasks(userId, scrapedTasks) {
  const existingQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('source', '==', 'chrome_ext')
  );
  
  let existingTitles = new Set();
  try {
    const existingSnap = await getDocs(existingQuery);
    existingTitles = new Set(existingSnap.docs.map(doc => doc.data().title));
  } catch (e) {
    console.warn("SyncScale: Error fetching existing tasks:", e);
  }
  
  let newCount = 0;
  
  for (const task of scrapedTasks) {
    if (existingTitles.has(task.title)) {
      continue;
    }
    
    const deadlineDate = new Date(task.deadline.replace(/-/g, '/')); 
    const deadlineTimestamp = !isNaN(deadlineDate.getTime()) ? Timestamp.fromDate(deadlineDate) : null;

    await addDoc(collection(db, 'tasks'), {
      userId: userId,
      title: task.title,
      deadline: deadlineTimestamp,
      estimatedMinutes: 0,
      status: 'TODO',
      isVisible: true,
      sizeLabel: null,
      source: 'chrome_ext',
      startedAt: null,
      completedAt: null,
      createdAt: Timestamp.now(),
    });
    
    newCount++;
  }
  
  return newCount;
}

auth.onAuthStateChanged((user) => {
  console.log("SyncScale Auth State Changed:", user ? user.uid : "null");
});
