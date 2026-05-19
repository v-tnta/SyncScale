chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "FETCH_TASKS") {
    handleFetchTasks();
    sendResponse({ success: true });
    return true;
  }
});

async function handleFetchTasks() {
  try {
    // 設定からドメインを取得
    const items = await chrome.storage.sync.get({ manabaDomain: 'manaba.ibaraki.ac.jp' });
    const domain = items.manabaDomain;
    const url = `https://${domain}/ct/home_library_query`;

    // 新しいタブでmanabaを開く（active: true にすることで動作を安定させる）
    const tab = await chrome.tabs.create({ url: url, active: true });

    // タブのロード完了を待つ
    await waitForTabComplete(tab.id);

    // manaba側のページ描画＆Content Scriptの初期化を少し待つ
    await new Promise(r => setTimeout(r, 1500));

    // 課題スクレイピングを実行
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_TASKS" }, (res) => {
        if (chrome.runtime.lastError) {
          console.error("Scrape Error:", chrome.runtime.lastError.message);
          resolve(null);
        } else {
          resolve(res);
        }
      });
    });

    if (response && response.success) {
      // 成功した場合、manabaのタブを閉じる
      chrome.tabs.remove(tab.id);
      
      // 課題が0件でもWebアプリに遷移させるか？とりあえず0件でも遷移させて通知を出す方が親切
      await openSyncScaleAndSendTasks(response.tasks);
    } else {
      showNotification("エラー", "課題の取得に失敗しました。ページが完全に読み込まれているか確認してください。");
    }
  } catch (error) {
    console.error("handleFetchTasks error:", error);
    showNotification("エラー", error.message);
  }
}

async function openSyncScaleAndSendTasks(tasks) {
  try {
    const targetUrl = 'https://sync-scale.web.app/';
    
    // 全てのタブを取得してURLで探す（権限エラーや引数エラーを防ぐため）
    const allTabs = await chrome.tabs.query({});
    let syncScaleTab = allTabs.find(t => 
      t.url && (t.url.includes('sync-scale.web.app') || t.url.includes('localhost:5173'))
    );

    if (syncScaleTab) {
      // 既存タブをアクティブにする
      await chrome.tabs.update(syncScaleTab.id, { active: true });
      // アクティブにしたウィンドウ自体も前に持ってくる
      if (syncScaleTab.windowId) {
        await chrome.windows.update(syncScaleTab.windowId, { focused: true });
      }
    } else {
      // 新規タブで開く
      syncScaleTab = await chrome.tabs.create({ url: targetUrl, active: true });
    }

    // タブのロードを待つ
    await waitForTabComplete(syncScaleTab.id);

    // Webアプリ側のContent ScriptとReactの初期化完了を待つ
    await new Promise(r => setTimeout(r, 1500));
    
    // データを送信
    sendTasksToTab(syncScaleTab.id, tasks, 3); // 最大3回リトライ
    
  } catch (error) {
    console.error("openSyncScaleAndSendTasks error:", error);
    showNotification("エラー", "SyncScaleとの通信に失敗しました。");
  }
}

function sendTasksToTab(tabId, tasks, retries) {
  chrome.tabs.sendMessage(tabId, {
    action: "SYNC_SCALE_IMPORT_TASKS",
    tasks: tasks
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("送信失敗（受信準備未了の可能性）:", chrome.runtime.lastError.message);
      if (retries > 0) {
        console.log(`リトライします... (残り${retries}回)`);
        setTimeout(() => {
          sendTasksToTab(tabId, tasks, retries - 1);
        }, 1000);
      } else {
        showNotification("エラー", "SyncScaleへ課題データを渡せませんでした。Webアプリをリロードして再度お試しください。");
      }
    } else {
      console.log("データをWebアプリに送信完了:", response);
      showNotification("完了", "課題データをSyncScaleへ送信しました。");
    }
  });
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      // tabが存在しないなどのエラー時はすぐ抜ける
      if (chrome.runtime.lastError) {
        resolve();
        return;
      }
      if (tab && tab.status === 'complete') {
        resolve();
      } else {
        const listener = (updatedTabId, info) => {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        
        // タイムアウト設定（10秒待ってダメなら進める）
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 10000);
      }
    });
  });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    title: "SyncScale: " + title,
    message: message
  });
}
