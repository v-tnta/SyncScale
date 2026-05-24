document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url-input');
  const saveBtn = document.getElementById('save-btn');
  const clearBtn = document.getElementById('clear-btn');
  const toast = document.getElementById('toast');

  // トースト表示用の関数
  const showToast = (message, isError = false) => {
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');

    toastMessage.textContent = message;
    if (isError) {
      toastIcon.textContent = '❌';
      toast.classList.add('error');
    } else {
      toastIcon.textContent = '✓';
      toast.classList.remove('error');
    }

    toast.classList.remove('hidden');
    toast.classList.add('show');

    // 古いタイマーがあればクリアする
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300); // フェードアウトアニメーションの時間と合わせる
    }, 3000);
  };

  // 設定を読み込む
  chrome.storage.sync.get({ manabaUrl: '', manabaDomain: '' }, (items) => {
    let url = items.manabaUrl;
    if (!url && items.manabaDomain) {
      url = `https://${items.manabaDomain}/ct/home_library_query`;
    }
    urlInput.value = url || 'https://manaba.ibaraki.ac.jp/ct/home_library_query';
  });

  // クリアボタンのハンドラー
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
  });

  // 設定を保存する
  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();

    if (!url) {
      showToast('URLを入力してください', true);
      return;
    }

    // 簡単なURLバリデーション
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('URLは http:// または https:// で開始してください', true);
      return;
    }

    try {
      new URL(url); // URLとして有効かパースしてみる
    } catch (e) {
      showToast('正しいURLの形式で入力してください', true);
      return;
    }

    chrome.storage.sync.set({ manabaUrl: url }, () => {
      showToast('設定を保存しました');
    });
  });
});
