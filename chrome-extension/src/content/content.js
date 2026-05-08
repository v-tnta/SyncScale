// manabaのDOM読み取りスクリプト
console.log("SyncScale: Content script loaded on manaba");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SCRAPE_TASKS") {
    console.log("SyncScale: Scraping tasks...");
    
    try {
      const tasks = scrapeManabaTasks();
      console.log("SyncScale: Scraped results:", tasks);
      sendResponse({ success: true, tasks: tasks });
    } catch (error) {
      console.error("SyncScale: Scraping error:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

/**
 * manabaの課題一覧（/ct/home_library_query）から課題情報を抽出する
 */
function scrapeManabaTasks() {
  const tasks = [];
  // 全てのテーブル行を取得
  const rows = document.querySelectorAll("table tr");
  
  // 抽出対象の課題タイプ（Qiita記事を参考）
  const taskTypes = ["レポート", "アンケート", "小テスト", "プロジェクト", "Report", "Survey", "Test", "Project"];

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    
    // manabaの課題一覧（未提出課題）は通常6〜7列
    if (cells.length >= 6) {
      const type = cells[0].textContent.trim();
      
      // 1列目が課題タイプであるか確認（ヘッダー行を除外するため）
      if (taskTypes.includes(type)) {
        const titleEl = cells[1].querySelector("a"); // タイトルは通常2列目のリンク
        const deadline = cells[4].textContent.trim(); // 〆切は通常5列目（インデックス4）
        
        if (titleEl && deadline) {
          tasks.push({
            title: titleEl.textContent.trim(),
            deadline: deadline, // "2026-06-15 23:59" 形式を想定
          });
        }
      }
    }
  });

  return tasks;
}
