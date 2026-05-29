// スマホ判定と双方向リダイレクト処理
const checkAndRedirect = () => {
  // 画面の横幅（768px以下）または ユーザーエージェント からスマホ判定を行う
  // これにより、PCブラウザでウィンドウサイズを小さくした際にも自動で移行するようになります
  const isMobileSize = window.innerWidth <= 768; // 一般的なスマホのブレイクポイント
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMobile = isMobileSize || isMobileUA;

  const isCurrentlyOnMobilePage = window.location.pathname.startsWith('/svc/mobile');
  const isSvcPath = window.location.pathname.startsWith('/svc/');

  if (isMobile && !isCurrentlyOnMobilePage && isSvcPath) {
    // スマホ判定かつ /svc/ 配下のPC版ページにいる場合はモバイル版へリダイレクト
    // web/vite.config.js のミドルウェア設定により、末尾スラッシュ止めのままでも
    // 正しく /svc/mobile/index.html がロードされ、SPAフォールバックを防ぐことができます。
    window.location.href = '/svc/mobile/';
  } else if (!isMobile && isCurrentlyOnMobilePage) {
    // PC判定かつモバイル版ページにいる場合はPC版のトップへリダイレクト
    window.location.href = '/';
  }
};

// 初回実行と画面サイズ変更時の監視
checkAndRedirect();
window.addEventListener('resize', checkAndRedirect);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ConsentProvider } from './hooks/useConsent.jsx'
import { OnboardingProvider } from './hooks/useOnboarding.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConsentProvider>
          <OnboardingProvider>
            <App />
          </OnboardingProvider>
        </ConsentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
