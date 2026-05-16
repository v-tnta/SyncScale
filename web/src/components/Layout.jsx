import React from 'react'

/**
 * 共通レイアウトコンポーネント
 * ヘッダーとメインコンテンツエリアを定義します。
 */
import Calendar from './Calendar'
import { useAuth } from '../hooks/useAuth'
import { ConfirmModal } from './ConfirmModal';

import { APP_INFO } from '../constants/appInfo'
import logo from '../assets/logo.svg'

const Layout = ({ children, tasks, onTaskClick }) => {
    const { currentUser, login, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
    return (
        <div className="flex flex-col min-h-screen md:h-screen bg-gray-50 text-gray-800 md:overflow-hidden">
            {/* ヘッダーエリア */}
            <header className="bg-white shadow-sm p-3 sticky top-0 z-10 flex-shrink-0">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* ロゴ画像 */}
                        <img src={logo} alt="SyncScale Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">{APP_INFO.NAME}</h1>
                        </div>
                        <p className="text-[15px] font-medium text-gray-400 mt-1 tracking-wider">v{APP_INFO.VERSION}</p>
                    </div>
                    {currentUser && currentUser.isAnonymous === false ? (
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsLogoutModalOpen(true)} className="text-sm bg-gray-200 hover:bg-gray-300 transition-colors px-3 py-1.5 rounded-md font-medium text-gray-700">
                                ログアウト
                            </button>
                            {currentUser.photoURL && (
                                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-8 h-8 rounded-full shadow-sm" />
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 hidden sm:inline">ログインせずに利用中</span>
                            <button onClick={login} className="text-sm bg-blue-700 hover:bg-blue-500 text-white transition-colors px-4 py-2 rounded-md font-medium shadow-sm flex items-center gap-2">
                                Google ログイン
                            </button>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </div>
                    )}
                </div>
            </header>

            {/* メインコンテンツエリア: Desktopでは横並び (Flex Row) */}
            <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col min-h-0">
                <div className="flex flex-col-reverse md:flex-row gap-6 h-full min-h-0">
                    {/* 左側: メインコンテンツ (TaskForm & TaskList) */}
                    <div className="w-full md:w-9/20 flex flex-col gap-6 min-h-0">
                        {children}
                    </div>

                    {/* 右側: カレンダーエリア */}
                    {tasks && (
                        <div className="w-full md:w-4/5 flex flex-col min-h-0 overflow-y-auto">
                            <Calendar tasks={tasks} onEventClick={onTaskClick} />
                        </div>
                    )}
                </div>
            </main>

            {/* ログアウト確認モーダル */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title="ログアウトの確認"
                confirmText="ログアウトする"
                cancelText="キャンセル"
                onConfirm={() => {
                    setIsLogoutModalOpen(false);
                    logout();
                }}
                onCancel={() => setIsLogoutModalOpen(false)}
            >
                本当にログアウトしますか？<br />
                ログアウト後も、同じGoogleアカウントでログインすればデータは復元されます。
            </ConfirmModal>

            {/* フッターエリア (必要であれば) */}
            <footer className="text-center p-4 text-gray-400 text-xs">
                &copy; 2026 v-tnta
            </footer>
        </div>
    )
}

export default Layout
