// content.js (manabaに注入される)

// ロードされたら、スクレイピングモードかどうかチェックする
chrome.storage.local.get(['isScrapingMode'], (result) => {
  if (result.isScrapingMode) {
    // 現在のURLが課題一覧画面（home_library_query 等）であるか大雑把に確認
    if (window.location.href.includes('/ct/home_library_query')) {
      console.log("[SyncScale] スクレイピングを開始します");
      
      // ユーザーに処理中であることを知らせるUIを表示
      const overlay = showLoadingOverlay();

      // 視覚的フィードバックとDOM描画の安定化のため少し待機する
      setTimeout(() => {
        try {
          const tasks = scrapeTasks();
          console.log("[SyncScale] 抽出結果:", tasks);
          
          // 抽出成功をUIに反映
          updateOverlayText(overlay, `✅ ${tasks.length}件の課題を取得しました！\nSyncScaleへ移動します...`);
          
          // 成功を見せてから少し待って移動
          setTimeout(() => {
            // モードを解除し、抽出したタスクをストレージに保存
            chrome.storage.local.set({ 
              isScrapingMode: false,
              pendingImportTasks: tasks 
            }, () => {
              // バックグラウンドに「終わった」と通知する
              chrome.runtime.sendMessage({ action: "SCRAPE_FINISHED" });
            });
          }, 1500);
        } catch (error) {
          console.error("[SyncScale] エラー:", error);
          updateOverlayText(overlay, "❌ 課題の抽出に失敗しました");
          setTimeout(() => {
            chrome.storage.local.set({ isScrapingMode: false });
            chrome.runtime.sendMessage({ action: "SHOW_ERROR", message: "課題の抽出に失敗しました。" });
          }, 2000);
        }
      }, 1000);
    } else {
      console.log("[SyncScale] 課題一覧画面ではないため待機します（リダイレクト待ち）");
    }
  }
});

function showLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontFamily = 'sans-serif';
  
  const spinner = document.createElement('div');
  spinner.style.width = '50px';
  spinner.style.height = '50px';
  spinner.style.border = '5px solid #e5e7eb';
  spinner.style.borderTopColor = '#3b82f6';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';
  
  // スピナーのアニメーションスタイル
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  const text = document.createElement('div');
  text.id = 'syncscale-overlay-text';
  text.innerText = 'SyncScale: 課題を抽出しています...';
  text.style.marginTop = '24px';
  text.style.fontSize = '20px';
  text.style.fontWeight = 'bold';
  text.style.color = '#1f2937';
  text.style.textAlign = 'center';
  text.style.whiteSpace = 'pre-line';
  
  overlay.appendChild(spinner);
  overlay.appendChild(text);
  document.body.appendChild(overlay);
  
  return overlay;
}

function updateOverlayText(overlay, newText) {
  const textEl = overlay.querySelector('#syncscale-overlay-text');
  if (textEl) {
    textEl.innerText = newText;
  }
  const spinner = overlay.querySelector('div');
  if (spinner && newText.includes('✅')) {
    spinner.style.display = 'none'; // 成功時はスピナーを隠す
  }
}

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
