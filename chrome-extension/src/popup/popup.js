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
  chrome.runtime.sendMessage({ action: "CHECK_AUTH" }, (response) => {
    if (chrome.runtime.lastError) return;
    updateUI(response?.user);
  });
}

document.getElementById('login-btn').addEventListener('click', async () => {
  document.getElementById('login-btn').textContent = 'ログイン中...';
  try {
    const response = await chrome.runtime.sendMessage({ action: "LOGIN" });
    if (response && response.success) {
      updateUI(response.user);
    } else {
      alert("ログイン失敗: " + (response?.error || ''));
    }
  } catch (error) {
    alert("通信エラー: " + error.message);
  } finally {
    document.getElementById('login-btn').textContent = 'Google ログイン';
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: "LOGOUT" });
  updateUI(null);
});

document.getElementById('fetch-btn').addEventListener('click', async () => {
  const resultArea = document.getElementById('result-area');
  resultArea.textContent = '取得中...';
  resultArea.style.color = '#10b981';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: "FETCH_TASKS" });
    if (response && response.success) {
      resultArea.textContent = `✅ ${response.count}件の新しい課題を登録しました`;
    } else {
      resultArea.textContent = `❌ エラー: ${response?.error || '不明なエラー'}`;
      resultArea.style.color = '#ef4444';
    }
  } catch (error) {
    resultArea.textContent = `❌ エラー: 拡張機能の再読み込みが必要です`;
    resultArea.style.color = '#ef4444';
  }
});
