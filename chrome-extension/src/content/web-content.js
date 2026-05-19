// web-content.js
// SyncScale Webアプリのページに注入されるContent Script
// background.jsからのメッセージを受信し、WebアプリのReactコードに引き渡す役割を担う

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SYNC_SCALE_IMPORT_TASKS") {
    console.log("Content Script: Received tasks from background", message.tasks);
    
    // Webページの window オブジェクトに対して postMessage でデータを渡す
    window.postMessage({
      type: "SYNC_SCALE_IMPORT_TASKS",
      tasks: message.tasks
    }, "*");
    
    sendResponse({ success: true, message: "Tasks forwarded to Web App" });
  }
  return true;
});
