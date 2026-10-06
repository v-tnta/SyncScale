import React from 'react'
import { Link } from 'react-router-dom'
import { Settings, BarChart3, Smartphone } from 'lucide-react'
import Calendar from './Calendar'
import { useAuth } from '../hooks/useAuth'
import { SettingsPanel } from './SettingsPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import MobileAppPromoModal from './MobileAppPromoModal'
import { ThemeToggle } from './ThemeToggle'

import { APP_INFO } from '../constants/appInfo'
import { LAYOUT } from '../content'
import logo from '../assets/logo.png'

const Layout = ({ children, tasks, onTaskClick, timeLogs = [], conditionLogs = [] }) => {
    const { currentUser } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);
    const [isMobilePromoOpen, setIsMobilePromoOpen] = React.useState(false);

    return (
        <div className="flex flex-col min-h-screen md:h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 md:overflow-hidden transition-colors duration-200">
            {/* ヘッダーエリア */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-2 px-4 sticky top-0 z-20 flex-shrink-0 transition-colors duration-200 shadow-xs">
                <div className="w-full flex justify-between items-center max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-3">
                        {/* 現行ロゴ画像 */}
                        <img src={logo} alt="SyncScale Logo" className="w-12 h-12 object-contain" />
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-none">
                                    {APP_INFO.NAME}
                                </h1>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                                    v{APP_INFO.VERSION}
                                </span>
                            </div>
                        </div>
                    </div>
                    {currentUser && (
                        <div className="flex items-center gap-2">
                            {/* テーマ切り替えボタン */}
                            <ThemeToggle />

                            {/* モバイル版案内ボタン */}
                            <button
                                onClick={() => setIsMobilePromoOpen(true)}
                                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-650 transition-all py-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold text-[13px]"
                                title="モバイル版の案内を開く"
                            >
                                <Smartphone className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.2} />
                                <span className="hidden sm:inline">モバイル版</span>
                            </button>

                            {/* 分析ボタン */}
                            <button
                                id="tutorial-analytics-button"
                                onClick={() => setIsAnalyticsOpen(true)}
                                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-650 transition-all py-1.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold text-[13px]"
                                title={LAYOUT.analyticsButtonTitle}
                            >
                                <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2.2} />
                                <span>{LAYOUT.analyticsButton}</span>
                            </button>

                            {/* 設定とユーザーアバター */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-650 transition-all py-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 group"
                                title={LAYOUT.settingsButtonTitle}
                            >
                                {currentUser.photoURL && (
                                    <img
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || ''}
                                        className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                    />
                                )}
                                <span className="text-[13px] font-bold max-w-[100px] truncate">
                                    {currentUser.displayName || LAYOUT.userFallback}
                                </span>
                                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" strokeWidth={2.2} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* メインコンテンツエリア */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5 md:p-6 flex flex-col min-h-0 overflow-hidden">
                {tasks ? (
                    /* ログイン済み: 左右2カラム（左: 課題一覧＆追加、右: カレンダー）
                       幅の縮小計算依存を排除し、左カラムに明確な最小幅・最大幅を与え、右カラムはflex-1で展開 */
                    <div className="flex flex-col md:flex-row gap-5 h-full min-h-0">
                        {/* 左カラム: 課題一覧 */}
                        <div className="w-full md:w-[380px] lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col min-h-0 h-full">
                            {children}
                        </div>
                        {/* 右カラム: 締切カレンダー */}
                        <div className="w-full flex-1 min-w-0 flex flex-col min-h-0 h-full">
                            <Calendar tasks={tasks} onEventClick={onTaskClick} timeLogs={timeLogs} />
                        </div>
                    </div>
                ) : (
                    /* 未ログイン: フル幅でチュートリアルを中央表示 */
                    <div className="w-full h-full flex items-center justify-center min-h-0 overflow-y-auto">
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
                timeLogs={timeLogs}
                conditionLogs={conditionLogs}
            />

            {/* モバイル版案内 */}
            <MobileAppPromoModal
                isOpen={isMobilePromoOpen}
                onClose={() => setIsMobilePromoOpen(false)}
            />

            {/* フッター: 最終同期表示と右下コピーを除去し、必要な法務・案内導線のみ維持 */}
            <footer className="text-center py-2 px-4 text-slate-400 dark:text-slate-600 text-xs shrink-0 flex justify-center items-center gap-4 border-t border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40">
                <span>{LAYOUT.footer}</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 transition-colors">
                    プライバシーポリシー
                </Link>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <Link to="/info" className="hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-2 transition-colors">
                    研究参加情報
                </Link>
            </footer>
        </div>
    )
}

export default Layout
