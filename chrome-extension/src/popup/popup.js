import { renderSyncScaleLogo2 } from './logo.js';

document.addEventListener('DOMContentLoaded', () => {
  renderSyncScaleLogo2('logo-container');

  const fetchBtn = document.getElementById('fetch-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const resultArea = document.getElementById('result-area');

  fetchBtn.addEventListener('click', () => {
    resultArea.style.color = '#333';
    resultArea.textContent = 'manabaを開いています...';
    
    chrome.runtime.sendMessage({ action: "FETCH_TASKS" }, (response) => {
      // タブが開くとPopupが閉じる可能性があるため、処理結果はBackgroundからの通知で表示されます
    });
  });

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
});
