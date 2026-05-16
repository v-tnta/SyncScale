import { renderSyncScaleLogo2 } from './logo.js';

document.addEventListener('DOMContentLoaded', () => {
  renderSyncScaleLogo2('logo-container');

  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const fetchBtn = document.getElementById('fetch-btn');
  const loggedInDiv = document.getElementById('logged-in');
  const loggedOutDiv = document.getElementById('logged-out');
  const fetchSection = document.getElementById('fetch-section');
  const userEmailSpan = document.getElementById('user-email');
  const resultArea = document.getElementById('result-area');

  // 初期状態チェック
  chrome.runtime.sendMessage({ action: "CHECK_AUTH" }, (response) => {
    if (response && response.user) {
      showLoggedIn(response.user);
    } else {
      showLoggedOut();
    }
  });

  loginBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "LOGIN" }, (response) => {
      if (response && response.success) {
        showLoggedIn(response.user);
      } else {
        alert("ログインに失敗しました: " + (response ? response.error : 'Unknown error'));
      }
    });
  });

  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "LOGOUT" }, (response) => {
      showLoggedOut();
    });
  });

  fetchBtn.addEventListener('click', () => {
    resultArea.style.color = '#333';
    resultArea.textContent = 'manabaを開いています...';
    
    chrome.runtime.sendMessage({ action: "FETCH_TASKS" }, (response) => {
      // タブが開くとPopupが閉じる可能性があるため、処理結果はBackgroundからの通知で表示されます
    });
  });

  function showLoggedIn(user) {
    loggedInDiv.style.display = 'block';
    loggedOutDiv.style.display = 'none';
    fetchSection.style.display = 'block';
    userEmailSpan.textContent = user.email || 'ユーザー';
  }

  function showLoggedOut() {
    loggedInDiv.style.display = 'none';
    loggedOutDiv.style.display = 'block';
    fetchSection.style.display = 'none';
    userEmailSpan.textContent = '';
  }
});
