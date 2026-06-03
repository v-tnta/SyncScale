import React from 'react'
import Calendar from './Calendar'
import { useAuth } from '../hooks/useAuth'
import { SettingsPanel } from './SettingsPanel'
import { AnalyticsPanel } from './AnalyticsPanel'

import { APP_INFO } from '../constants/appInfo'
import logo from '../assets/logo.png'

const Layout = ({ children, tasks, onTaskClick }) => {
    const { currentUser } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);
    return (
        <div className="flex flex-col min-h-screen md:h-screen bg-gray-50 text-gray-800 md:overflow-hidden transition-colors duration-200">
            {/* ヘッダーエリア (縦幅をスリム化するため、パディングを py-1.5 px-3 に変更) */}
            <header className="bg-white border-b border-gray-200/50 py-1.5 px-3 sticky top-0 z-10 flex-shrink-0 transition-colors duration-200">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* ロゴ画像 (ヘッダーの圧迫感を抑えるため、w-16 h-16 に微調整) */}
                        <img src={logo} alt="SyncScale Logo" className="w-16 h-16 object-contain" />
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">{APP_INFO.NAME}</h1>
                        </div>
                        <p className="text-[15px] font-medium text-gray-400 mt-1 tracking-wider">v{APP_INFO.VERSION}</p>
                    </div>
                    {currentUser && (
                        <div className="flex items-center gap-2">
                            {/* 分析ボタン */}
                            <button
                                onClick={() => setIsAnalyticsOpen(true)}
                                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all py-1.5 px-3.5 rounded-2xl border border-gray-200 shadow-sm text-gray-700 hover:text-gray-950 font-bold text-[13.5px]"
                                title="分析画面を開く"
                            >
                                📈 分析
                            </button>
                            {/* 設定とユーザーアバターを統合した横長ボタン */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="flex items-center gap-2.5 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all py-1.5 px-3.5 rounded-2xl border border-gray-200 shadow-sm text-gray-750 group"
                                title="アカウント設定を開く"
                            >
                                {currentUser.photoURL && (
                                    <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-7 h-7 rounded-full object-cover border border-gray-200/50 shadow-sm" />
                                )}
                                <span className="text-[13.5px] font-bold text-gray-700 max-w-[100px] truncate group-hover:text-gray-900 transition-colors">
                                    {currentUser.displayName || 'ユーザー'}
                                </span>
                                <span className="text-[14px] text-gray-400 group-hover:text-gray-600 transition-colors ml-0.5">⚙️</span>
                            </button>
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

            {/* 分析パネル */}
            <AnalyticsPanel
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                tasks={tasks}
            />

            {/* フッターエリア */}
            <footer className="text-center p-4 text-gray-400 text-xs">
                &copy; 2026 v-tnta
            </footer>
        </div>
    )
}

export default Layout
