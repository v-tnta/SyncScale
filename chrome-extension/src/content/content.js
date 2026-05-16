chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SCRAPE_TASKS") {
    console.log("[Content Script] スクレイピング開始");
    try {
      const tasks = scrapeTasks();
      console.log("[Content Script] 抽出結果:", tasks);
      sendResponse({ success: true, tasks: tasks });
    } catch (error) {
      console.error("[Content Script] エラー:", error);
      sendResponse({ success: false, error: error.message });
    }
  } else if (message.action === "SHOW_RESULT") {
    alert(`SyncScale: 課題の取得が完了しました。\n\n見つかった課題: ${message.totalCount}件\n新しく登録した課題: ${message.newCount}件`);
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
