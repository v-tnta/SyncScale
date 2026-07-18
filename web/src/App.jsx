import React from 'react';
import { Toaster } from 'sonner';
import { AppRouter } from './router';
import { useSessionTracking } from './hooks/useActivityLog';
import './App.css';

function App() {
  // ログイン済み・同意済みユーザーのセッション開始（アプリを開いた）を記録
  useSessionTracking();

  return (
    <>
      <AppRouter />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default App;
