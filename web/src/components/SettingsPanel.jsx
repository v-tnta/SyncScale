import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X, Sun, Moon, Bell, RotateCcw, FileText, LogOut, AlertTriangle } from "lucide-react";
import { SunMoonIcon } from "./ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { useOnboarding } from "../hooks/useOnboarding";
import { useTheme } from "../hooks/useTheme";
import { ConsentWithdrawModal } from "./ConsentWithdrawModal";
import { ConfirmModal } from "./ConfirmModal";
import { SETTINGS_PANEL } from "../content";

// 「締切の何分前」のプリセット（分）
const NOTIF_PRESETS = [10, 30, 60, 180, 1440];

const formatMinutesBefore = (minutes) => {
    if (minutes <= 0) return "0分";
    if (minutes % 1440 === 0) return `${minutes / 1440}日`;
    if (minutes % 60 === 0) return `${minutes / 60}時間`;
    return `${minutes}分`;
};

export function SettingsPanel({ isOpen, onClose }) {
    const { currentUser, logout } = useAuth();
    const { withdrawConsent } = useConsent();
    const { resetTutorial, userSettings, updateNotificationSettings } = useOnboarding();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isSecondWithdrawOpen, setIsSecondWithdrawOpen] = useState(false);
    const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [notifSaving, setNotifSaving] = useState(false);

    const notifEnabled = userSettings?.notificationEnabled ?? false;
    const notifMinutes = userSettings?.notificationMinutesBefore ?? 30;

    const handleToggleNotif = async (value) => {
        setNotifSaving(true);
        try {
            await updateNotificationSettings({ enabled: value });
        } catch {
            toast.error(SETTINGS_PANEL.notifSaveFailedAlert);
        } finally {
            setNotifSaving(false);
        }
    };

    const handleSelectNotifMinutes = async (minutes) => {
        setNotifSaving(true);
        try {
            await updateNotificationSettings({ minutesBefore: minutes });
        } catch {
            toast.error(SETTINGS_PANEL.notifSaveFailedAlert);
        } finally {
            setNotifSaving(false);
        }
    };

    if (!isOpen) return null;

    const handleRestartTutorial = async () => {
        setIsRestartConfirmOpen(false);
        try {
            setLoadingText(SETTINGS_PANEL.loadingTutorialPreparing);
            setIsTransitioning(true);
            await resetTutorial();
            window.location.reload();
        } catch (error) {
            console.error("チュートリアルのリセットに失敗しました:", error);
            setIsTransitioning(false);
            toast.error(SETTINGS_PANEL.restartTutorialFailedAlert);
        }
    };

    const handleWithdrawConfirm = () => {
        setIsSecondWithdrawOpen(true);
    };

    const handleActualWithdraw = async () => {
        try {
            setLoadingText(SETTINGS_PANEL.loadingWithdrawing);
            setIsTransitioning(true);
            setIsSecondWithdrawOpen(false);
            await withdrawConsent();
            await logout();
            onClose();
            window.location.href = "/agreement";
        } catch (error) {
            console.error("撤回およびログアウト中にエラーが発生しました:", error);
            setIsTransitioning(false);
            toast.error(SETTINGS_PANEL.withdrawErrorAlert);
        }
    };

    return (
        <>
            {isTransitioning && (
                <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{loadingText || SETTINGS_PANEL.loadingDefault}</p>
                </div>
            )}
            {/* バックドロップ */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* 中央モーダルレイアウト */}
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-3 sm:p-4 pointer-events-none">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl rounded-3xl p-5 sm:p-6 flex flex-col justify-between font-sans pointer-events-auto relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    <div className="space-y-5">
                        {/* ヘッダー */}
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3.5">
                            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <span>⚙️</span> {SETTINGS_PANEL.header}
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                title="閉じる"
                                aria-label="閉じる"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ログイン中のユーザー情報表示 */}
                        {currentUser && (
                            <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 p-3.5 rounded-2xl">
                                {currentUser.photoURL && (
                                    <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">{currentUser.displayName || SETTINGS_PANEL.userFallback}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{currentUser.email || SETTINGS_PANEL.emailFallback}</p>
                                </div>
                            </div>
                        )}

                        {/* 外観テーマ設定 */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-750 p-3.5 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                外観（テーマ）
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'light', label: 'ライト', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
                                    { key: 'dark', label: 'ダーク', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
                                    { key: 'system', label: '自動', icon: <SunMoonIcon /> },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setTheme(item.key)}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                                            theme === item.key
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 締切前通知設定 */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-750 overflow-hidden bg-white dark:bg-slate-850">
                            <div className="flex items-center justify-between p-3.5 gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2.2} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">{SETTINGS_PANEL.notifTitle}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                            {notifEnabled
                                                ? SETTINGS_PANEL.notifDescEnabled(formatMinutesBefore(notifMinutes))
                                                : SETTINGS_PANEL.notifDescDisabled}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={notifEnabled}
                                    disabled={notifSaving}
                                    onClick={() => handleToggleNotif(!notifEnabled)}
                                    className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition disabled:opacity-50 ${notifEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                    <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition ${notifEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                            </div>

                            {notifEnabled && (
                                <div className="px-3.5 pb-3 border-t border-slate-100 dark:border-slate-750 pt-3">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">{SETTINGS_PANEL.notifMinutesLabel}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {NOTIF_PRESETS.map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                disabled={notifSaving}
                                                onClick={() => handleSelectNotifMinutes(preset)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition disabled:opacity-50 ${
                                                    notifMinutes === preset 
                                                        ? "bg-blue-600 text-white border-blue-600" 
                                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                                }`}
                                            >
                                                {formatMinutesBefore(preset)}{SETTINGS_PANEL.notifPresetSuffix}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-amber-50 dark:bg-amber-950/40 border-t border-amber-100 dark:border-amber-900/60 px-3.5 py-2">
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                                    {SETTINGS_PANEL.notifNote}
                                </p>
                            </div>
                        </div>

                        {/* 設定メニュー */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setIsRestartConfirmOpen(true)}
                                className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-3 border border-slate-200/60 dark:border-slate-800"
                            >
                                <RotateCcw className="w-4 h-4 text-slate-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">{SETTINGS_PANEL.restartTutorialTitle}</p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{SETTINGS_PANEL.restartTutorialSub}</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate("/info");
                                }}
                                className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-3 border border-slate-200/60 dark:border-slate-800"
                            >
                                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">{SETTINGS_PANEL.onboardingTitle}</p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{SETTINGS_PANEL.onboardingSub}</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 下部アクション */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-5 space-y-2.5">
                        <button
                            type="button"
                            onClick={async () => {
                                await logout();
                                onClose();
                                navigate("/agreement", { replace: true });
                            }}
                            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-center text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{SETTINGS_PANEL.logoutButton}</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setIsWithdrawOpen(true)}
                            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-xs sm:text-sm transition duration-200 shadow-xs flex items-center justify-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>{SETTINGS_PANEL.withdrawButton}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* チュートリアル再実行の確認モーダル */}
            <ConfirmModal
                isOpen={isRestartConfirmOpen}
                title={SETTINGS_PANEL.restartTutorialConfirmTitle}
                onConfirm={handleRestartTutorial}
                onCancel={() => setIsRestartConfirmOpen(false)}
            >
                {SETTINGS_PANEL.restartTutorialConfirm}
            </ConfirmModal>

            {/* 同意撤回モーダル（1段階目） */}
            <ConsentWithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                onConfirm={handleWithdrawConfirm}
            />

            {/* 最終確認モーダル（2段階目） */}
            <ConfirmModal
                isOpen={isSecondWithdrawOpen}
                title={SETTINGS_PANEL.finalConfirmTitle}
                confirmText={SETTINGS_PANEL.finalConfirmConfirmText}
                cancelText={SETTINGS_PANEL.finalConfirmCancelText}
                onConfirm={handleActualWithdraw}
                onCancel={() => setIsSecondWithdrawOpen(false)}
                confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-xs"
                cancelButtonClass="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <div className="space-y-3">
                    <p className="font-bold text-red-600 dark:text-red-400">
                        {SETTINGS_PANEL.finalConfirmLead}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {SETTINGS_PANEL.finalConfirmNote}
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}
