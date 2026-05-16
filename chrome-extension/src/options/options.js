document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domain-input');
  const saveBtn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  // 設定を読み込む
  chrome.storage.sync.get({ manabaDomain: 'manaba.ibaraki.ac.jp' }, (items) => {
    domainInput.value = items.manabaDomain;
  });

  // 設定を保存する
  saveBtn.addEventListener('click', () => {
    let domain = domainInput.value.trim();
    if (!domain) {
      domain = 'manaba.ibaraki.ac.jp';
      domainInput.value = domain;
    }
    
    // httpや/を取り除く簡単な処理
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    domainInput.value = domain;

    chrome.storage.sync.set({ manabaDomain: domain }, () => {
      status.textContent = '保存しました！';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
