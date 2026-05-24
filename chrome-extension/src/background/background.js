chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "FETCH_TASKS") {
    handleFetchTasks();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === "SCRAPE_FINISHED") {
    // manabaのスクレイピングが完了したという通知
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
    }
    openSyncScale();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "SHOW_ERROR") {
    showNotification("エラー", message.message);
    sendResponse({ success: true });
    return true;
  }
});

async function handleFetchTasks() {
  try {
    const items = await chrome.storage.sync.get({ manabaDomain: 'manaba.ibaraki.ac.jp' });
    const domain = items.manabaDomain;
    const url = `https://${domain}/ct/home_library_query`;

    // スクレイピングモードをONにしてmanabaを開く
    await chrome.storage.local.set({ isScrapingMode: true });
    await chrome.tabs.create({ url: url, active: true });
  } catch (error) {
    console.error("handleFetchTasks error:", error);
    showNotification("エラー", error.message);
  }
}

async function openSyncScale() {
  try {
    const targetUrl = 'https://sync-scale.web.app/svc/ext-sync';
    
    // 全てのタブを取得してURLで探す
    const allTabs = await chrome.tabs.query({});
    let syncScaleTab = allTabs.find(t => 
      t.url && (t.url.includes('sync-scale.web.app') || t.url.includes('localhost:5173'))
    );

    if (syncScaleTab) {
      // 既存タブをアクティブにする
      await chrome.tabs.update(syncScaleTab.id, { active: true });
      if (syncScaleTab.windowId) {
        await chrome.windows.update(syncScaleTab.windowId, { focused: true });
      }
    } else {
      // 新規タブで開く
      await chrome.tabs.create({ url: targetUrl, active: true });
    }
    // SyncScale側のContent Scriptが自分でストレージからデータを取り出すため、これ以上は何もしない
  } catch (error) {
    console.error("openSyncScale error:", error);
    showNotification("エラー", "SyncScaleを開けませんでした。");
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    title: "SyncScale: " + title,
    message: message
  });
}
