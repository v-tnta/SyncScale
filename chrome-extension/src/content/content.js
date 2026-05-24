// content.js (manabaに注入される)

// ロードされたら、スクレイピングモードかどうかチェックする
chrome.storage.local.get(['isScrapingMode'], (localResult) => {
  if (localResult.isScrapingMode) {
    chrome.storage.sync.get({ manabaUrl: '', manabaDomain: '' }, (syncResult) => {
      let targetUrl = syncResult.manabaUrl;
      if (!targetUrl) {
        if (syncResult.manabaDomain) {
          targetUrl = `https://${syncResult.manabaDomain}/ct/home_library_query`;
        } else {
          targetUrl = 'https://manaba.ibaraki.ac.jp/ct/home_library_query';
        }
      }

      // クエリパラメータやフラグメントを除外したベースURLで比較
      const getBaseUrl = (urlStr) => {
        try {
          const url = new URL(urlStr);
          return (url.origin + url.pathname).replace(/\/$/, "");
        } catch (e) {
          return urlStr.replace(/\/$/, "");
        }
      };

      const targetBase = getBaseUrl(targetUrl);
      const currentBase = getBaseUrl(window.location.href);

      // 完全一致、または現在のURLが設定されたベースURLで始まっている場合に対象とする
      if (currentBase === targetBase || window.location.href.startsWith(targetBase)) {
        console.log("[SyncScale] スクレイピングを開始します");
        
        try {
          const tasks = scrapeTasks();
          console.log("[SyncScale] 抽出結果:", tasks);
          
          // ブラウザネイティブのalertでユーザーの確認を待つ
          alert(`manabaから課題を取得しました！(${tasks.length}件)\nSync Scaleへ移行します。`);
          
          // ユーザーがOKを押したら（alertは処理をブロックするので直後に実行される）
          // モードを解除し、抽出したタスクをストレージに保存
          chrome.storage.local.set({ 
            isScrapingMode: false,
            pendingImportTasks: tasks 
          }, () => {
            // バックグラウンドに「終わった」と通知し、タブを閉じてもらう
            chrome.runtime.sendMessage({ action: "SCRAPE_FINISHED" });
          });
          
        } catch (error) {
          console.error("[SyncScale] エラー:", error);
          alert("❌ 課題の抽出に失敗しました");
          chrome.storage.local.set({ isScrapingMode: false });
          chrome.runtime.sendMessage({ action: "SHOW_ERROR", message: "課題の抽出に失敗しました。" });
        }
      } else {
        console.log("[SyncScale] 課題一覧画面ではないため待機します（リダイレクト待ち）", { currentBase, targetBase });
      }
    });
  }
});

/**
 * 現在開いている manaba の課題一覧ページからタスク情報を抽出する
 */
function scrapeTasks() {
  const tasks = [];
  
  // manabaの課題行を全て取得 (クラスが title 以外の tr)
  const rows = document.querySelectorAll("table.stdlist tr:not(.title)");
  
  rows.forEach(row => {
    const typeEl = row.querySelector("td:nth-child(1) a");
    const titleEl = row.querySelector("td:nth-child(2) div.myassignments-title a");
    const courseEl = row.querySelector("td:nth-child(3) div.mycourse-title a");
    const deadlineEl = row.querySelector("td:nth-child(5)");
    
    if (titleEl && deadlineEl && courseEl && typeEl) {
      const assignmentUrl = titleEl.getAttribute("href"); // 例: course_1194265_project_1232862
      const courseUrl = courseEl.getAttribute("href");    // 例: course_1194265
      
      tasks.push({
        manabaAssignmentId: assignmentUrl,
        manabaCourseId: courseUrl,
        courseName: courseEl.textContent.trim(),
        title: titleEl.textContent.trim(),
        type: typeEl.textContent.trim(),
        deadline: deadlineEl.textContent.trim(),
      });
    }
  });
  
  return tasks;
}
