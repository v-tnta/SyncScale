// web-content.js
// SyncScale Webアプリのページに注入されるContent Script

let isAckReceived = false;
let isSending = false;

function trySendTasks() {
  if (isAckReceived || isSending) return;
  isSending = true;
  
  chrome.storage.local.get(['pendingImportTasks'], (result) => {
    if (result.pendingImportTasks && result.pendingImportTasks.length > 0 && !isAckReceived) {
      console.log("[SyncScale] Webアプリへタスク転送を試みます...");
      window.postMessage({
        type: "SYNC_SCALE_IMPORT_TASKS",
        tasks: result.pendingImportTasks
      }, "*");
      
      // 数秒後にリトライ可能にする（ACKが来なかった場合）
      setTimeout(() => { isSending = false; }, 2000);
    } else {
      isSending = false;
    }
  });
}

// 拡張機能側から新しくタスクがセットされた時の監視
// タブが既に開かれたままの状態で、裏でスクレイピングが行われた場合に対処
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.pendingImportTasks && changes.pendingImportTasks.newValue) {
    console.log("[SyncScale] 新しいスクレイピングデータを検知しました。");
    isAckReceived = false;
    trySendTasks();
  }
});

// Webアプリ側からのメッセージを受け取る
window.addEventListener("message", (event) => {
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
      chrome.storage.local.remove(['pendingImportTasks']);
    }
  }
});

// バックアップとして、注入後少し待ってからも送信を試みる
// （既にAppがロードされている場合など）
setTimeout(trySendTasks, 1000);
setTimeout(trySendTasks, 2500);
