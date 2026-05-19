// web-content.js
// SyncScale Webアプリのページに注入されるContent Script

let isAckReceived = false;

function trySendTasks() {
  if (isAckReceived) return;
  
  chrome.storage.local.get(['pendingImportTasks'], (result) => {
    if (result.pendingImportTasks && result.pendingImportTasks.length > 0 && !isAckReceived) {
      console.log("[SyncScale] Webアプリへタスク転送を試みます...");
      window.postMessage({
        type: "SYNC_SCALE_IMPORT_TASKS",
        tasks: result.pendingImportTasks
      }, "*");
    }
  });
}

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
