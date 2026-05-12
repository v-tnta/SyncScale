// ポップアップの初期化
console.log("Popup initialized");

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
});

function updateUI(user) {
  const loggedInDiv = document.getElementById('logged-in');
  const loggedOutDiv = document.getElementById('logged-out');
  const userEmailSpan = document.getElementById('user-email');
  
  if (user) {
    loggedInDiv.style.display = 'block';
    loggedOutDiv.style.display = 'none';
    userEmailSpan.textContent = user.email || 'ログイン済み';
  } else {
    loggedInDiv.style.display = 'none';
    loggedOutDiv.style.display = 'block';
  }
}

function checkAuth() {
  // background.jsのGET_AUTH_STATEと合わせる
  chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
    if (chrome.runtime.lastError) return;
    updateUI(response?.user);
  });
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const btn = document.getElementById('login-btn');
  btn.textContent = 'ログイン中...';
  btn.disabled = true;
  
  try {
    // background.jsのLOGINと合わせる
    const response = await chrome.runtime.sendMessage({ type: "LOGIN" });
    if (response && response.success) {
      updateUI(response.user);
    } else {
      alert("ログイン失敗: " + (response?.error || ''));
    }
  } catch (error) {
    alert("通信エラー: " + error.message);
  } finally {
    btn.textContent = 'Google ログイン';
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  updateUI(null);
});

document.getElementById('fetch-btn').addEventListener('click', async () => {
  const resultArea = document.getElementById('result-area');
  resultArea.textContent = '取得中...';
  resultArea.style.color = '#10b981';
  
  try {
    // 1. アクティブなタブ（現在の画面）を取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error("タブが見つかりません");
    
    // 2. manabaの画面に埋め込まれたスクリプト(content.js)に課題の抽出を依頼
    let scrapeResponse;
    try {
      scrapeResponse = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_TASKS" });
    } catch (e) {
      throw new Error("manabaの課題一覧ページを開いてから実行してください");
    }

    if (!scrapeResponse || !scrapeResponse.success) {
      throw new Error(scrapeResponse?.error || "課題の抽出に失敗しました");
    }
    
    const tasks = scrapeResponse.tasks;
    if (!tasks || tasks.length === 0) {
      throw new Error("課題が見つかりませんでした");
    }

    // 3. 抽出した課題リストをバックグラウンドに送信して保存
    const response = await chrome.runtime.sendMessage({ type: "FETCH_TASKS", data: tasks });
    if (response && response.success) {
      const { added, skipped } = response.results;
      resultArea.textContent = `✅ 新規:${added}件 (スキップ:${skipped}件)`;
    } else {
      resultArea.textContent = `❌ エラー: ${response?.error || '不明なエラー'}`;
      resultArea.style.color = '#ef4444';
    }
  } catch (error) {
    resultArea.textContent = `❌ エラー: ${error.message}`;
    resultArea.style.color = '#ef4444';
  }
});
