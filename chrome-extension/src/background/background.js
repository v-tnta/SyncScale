import { app, auth, db } from '../lib/firebase-config.js';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_AUTH") {
    const user = auth.currentUser;
    sendResponse({ user: user ? { email: user.email || 'Google User' } : null });
    return true;
  }

  if (message.action === "LOGIN") {
    handleLogin(sendResponse);
    return true;
  }

  if (message.action === "LOGOUT") {
    auth.signOut().then(() => {
      // Chromeのキャッシュトークンもクリアする
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token: token }, () => {
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: true });
        }
      });
    });
    return true;
  }

  if (message.action === "FETCH_TASKS") {
    handleFetchTasks();
    sendResponse({ success: true });
    return true;
  }
});

async function handleLogin(sendResponse) {
  try {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        console.error("Auth Error:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      if (!token) {
        sendResponse({ success: false, error: "トークンが取得できませんでした" });
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(null, token);
        const userCredential = await signInWithCredential(auth, credential);
        sendResponse({ 
          success: true, 
          user: { email: userCredential.user.email } 
        });
      } catch (error) {
        console.error("Firebase Login Error:", error);
        sendResponse({ success: false, error: error.message });
      }
    });
  } catch (error) {
    console.error("Login Handler Error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleFetchTasks() {
  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification("エラー", "先にログインしてください");
      return;
    }

    // 設定からドメインを取得
    chrome.storage.sync.get({ manabaDomain: 'manaba.ibaraki.ac.jp' }, async (items) => {
      const domain = items.manabaDomain;
      const url = `https://${domain}/ct/home_library_query`;

      // 新しいタブでmanabaを開く
      const tab = await chrome.tabs.create({ url: url, active: true });

      // タブのロード完了を待つ
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          // リスナーを解除
          chrome.tabs.onUpdated.removeListener(listener);

          // スクリプト実行まで少し待機
          setTimeout(async () => {
            try {
              const response = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_TASKS" });
              if (response && response.success) {
                const newCount = await registerTasks(user.uid, response.tasks);
                showNotification("取得完了", `${newCount}件の課題を新規登録しました（既に登録済みのものはスキップしました）`);
              } else {
                showNotification("エラー", "課題の取得に失敗しました。ページが完全に読み込まれているか確認してください。");
              }
            } catch (err) {
              console.error(err);
              showNotification("エラー", "拡張機能の通信に失敗しました。");
            }
          }, 1500);
        }
      });
    });
  } catch (error) {
    showNotification("エラー", error.message);
  }
}

function showNotification(title, message) {
  // アイコンがなくても動作するように、拡張機能のデフォルトアイコンが表示される
  chrome.notifications.create({
    type: "basic",
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent png
    title: "SyncScale: " + title,
    message: message
  });
}

async function registerTasks(userId, scrapedTasks) {
  const existingQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('source', '==', 'chrome_ext')
  );
  const existingSnap = await getDocs(existingQuery);
  const existingIds = new Set(
    existingSnap.docs.map(doc => doc.data().manabaAssignmentId)
  );
  
  let newCount = 0;
  
  for (const task of scrapedTasks) {
    if (existingIds.has(task.manabaAssignmentId)) {
      continue;
    }
    
    await addDoc(collection(db, 'tasks'), {
      userId: userId,
      manabaAssignmentId: task.manabaAssignmentId,
      manabaCourseId: task.manabaCourseId,
      courseName: task.courseName,
      title: task.title,
      type: task.type,
      deadline: parseDeadline(task.deadline),
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

function parseDeadline(deadlineStr) {
  // 例: "2026-05-21 16:15"
  const date = new Date(deadlineStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return Timestamp.fromDate(date);
}
