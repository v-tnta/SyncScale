import React from 'react'
import Calendar from './Calendar'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { SettingsPanel } from './SettingsPanel'

import { APP_INFO } from '../constants/appInfo'
import logo from '../assets/logo.png'

const Layout = ({ children, tasks, onTaskClick }) => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    return (
        <div className="flex flex-col min-h-screen md:h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 md:overflow-hidden transition-colors duration-200">
            {/* ヘッダーエリア */}
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200/50 dark:border-slate-850 p-3 sticky top-0 z-10 flex-shrink-0 transition-colors duration-200">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* ロゴ画像 */}
                        <img src={logo} alt="SyncScale Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">{APP_INFO.NAME}</h1>
                        </div>
                        <p className="text-[15px] font-medium text-gray-400 dark:text-slate-500 mt-1 tracking-wider">v{APP_INFO.VERSION}</p>
                    </div>
                    {currentUser && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors p-2 rounded-xl text-gray-700 dark:text-slate-200 flex items-center justify-center border border-gray-200/80 dark:border-slate-700 shadow-sm"
                                title={theme === 'light' ? "ダークモードに切り替え" : "ライトモードに切り替え"}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors p-2 px-3.5 rounded-xl font-medium text-gray-700 dark:text-slate-200 flex items-center justify-center border border-gray-200/80 dark:border-slate-700 shadow-sm"
                                title="設定"
                            >
                                ⚙️ 設定
                            </button>
                            {currentUser.photoURL && (
                                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-8 h-8 rounded-full shadow-sm" />
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* メインコンテンツエリア */}
            <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col min-h-0">
                {tasks ? (
                    /* ログイン済み: 2カラムレイアウト（タスク + カレンダー） */
                    <div className="flex flex-col-reverse md:flex-row gap-6 h-full min-h-0">
                        <div className="w-full md:w-9/20 flex flex-col gap-6 min-h-0">
                            {children}
                        </div>
                        <div className="w-full md:w-4/5 flex flex-col min-h-0 overflow-y-auto">
                            <Calendar tasks={tasks} onEventClick={onTaskClick} />
                        </div>
                    </div>
                ) : (
                    /* 未ログイン: フル幅でチュートリアルを中央表示 */
                    <div className="w-full h-full flex items-center justify-center">
                        {children}
                    </div>
                )}
            </main>

            {/* 設定パネル */}
            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* フッターエリア */}
            <footer className="text-center p-4 text-gray-400 dark:text-slate-600 text-xs">
                &copy; 2026 v-tnta
            </footer>
        </div>
    )
}

export default Layout
