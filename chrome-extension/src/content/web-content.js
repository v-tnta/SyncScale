// web-content.js
// SyncScale Webアプリのページに注入されるContent Script

let isAckReceived = false;
let isSending = false;

// 拡張機能のコンテキストが有効かチェックする関数
function isExtensionValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

function trySendTasks() {
  if (!isExtensionValid()) return;
  if (isAckReceived || isSending) return;
  isSending = true;
  
  try {
    chrome.storage.local.get(['pendingImportTasks'], (result) => {
      if (!isExtensionValid()) return;
      if (chrome.runtime.lastError) {
        console.warn("[SyncScale] ストレージの読み込みエラー:", chrome.runtime.lastError);
        isSending = false;
        return;
      }
      
      if (result.pendingImportTasks && result.pendingImportTasks.length > 0 && !isAckReceived) {
        console.log("[SyncScale] Webアプリへタスク転送を試みます...");
        window.postMessage({
          type: "SYNC_SCALE_IMPORT_TASKS",
          tasks: result.pendingImportTasks
        }, "*");
        
        // 数秒後にリトライ可能にする（ACKが来なかった場合）
        setTimeout(() => { 
          if (isExtensionValid()) {
            isSending = false; 
          }
        }, 2000);
      } else {
        isSending = false;
      }
    });
  } catch (e) {
    console.warn("[SyncScale] 送信処理中に例外が発生しました（拡張機能無効化の可能性）:", e);
    isSending = false;
  }
}

// 拡張機能側から新しくタスクがセットされた時の監視
// タブが既に開かれたままの状態で、裏でスクレイピングが行われた場合に対処
if (isExtensionValid()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (!isExtensionValid()) return;
    if (areaName === 'local' && changes.pendingImportTasks && changes.pendingImportTasks.newValue) {
      console.log("[SyncScale] 新しいスクレイピングデータを検知しました。");
      isAckReceived = false;
      trySendTasks();
    }
  });
}

// Webアプリ側からのメッセージを受け取る
function handleWindowMessage(event) {
  if (!isExtensionValid()) {
    // 拡張機能が無効化された場合、リスナーを削除してエラーの発生を防ぐ
    window.removeEventListener("message", handleWindowMessage);
    return;
  }
  
  // アプリ側が準備完了した時
  if (event.data && event.data.type === 'SYNC_SCALE_APP_READY') {
    console.log("[SyncScale] Webアプリの準備完了を受信。タスクを送信します。");
    trySendTasks();
  }
  
  // アプリ側がタスクを受け取った時
  if (event.data && event.data.type === 'SYNC_SCALE_IMPORT_ACK') {
    if (!isAckReceived) {
      console.log("[SyncScale] Webアプリがタスクを受信完了。ストレージをクリアします。");
      isAckReceived = true;
      try {
        chrome.storage.local.remove(['pendingImportTasks']);
      } catch (e) {
        console.warn("[SyncScale] ストレージクリア中に例外が発生しました:", e);
      }
    }
  }
}
window.addEventListener("message", handleWindowMessage);

// バックアップとして、注入後少し待ってからも送信を試みる
// （既にAppがロードされている場合など）
setTimeout(() => { if (isExtensionValid()) trySendTasks(); }, 1000);
setTimeout(() => { if (isExtensionValid()) trySendTasks(); }, 2500);
