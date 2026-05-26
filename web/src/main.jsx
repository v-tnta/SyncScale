// スマホ判定と双方向リダイレクト処理
const checkAndRedirect = () => {
  // 画面幅による不安定な判定を排除し、純粋な userAgent のみで判定
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isCurrentlyOnMobilePage = window.location.pathname.startsWith('/svc/mobile');
  const isSvcPath = window.location.pathname.startsWith('/svc/');

  if (isMobile && !isCurrentlyOnMobilePage && isSvcPath) {
    // スマホ判定かつ /svc/ 配下のPC版ページにいる場合はモバイル版へリダイレクト
    window.location.href = '/svc/mobile/home.html';
  } else if (!isMobile && isCurrentlyOnMobilePage) {
    // PC判定かつモバイル版ページにいる場合はPC版へリダイレクト
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
