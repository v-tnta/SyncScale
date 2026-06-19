import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { useOnboarding } from "../hooks/useOnboarding";
import { ConsentWithdrawModal } from "./ConsentWithdrawModal";
import { ConfirmModal } from "./ConfirmModal";
import { SETTINGS_PANEL } from "../content";

// 「締切の何分前」のプリセット（分）
const NOTIF_PRESETS = [10, 30, 60, 180, 1440];

// 分を「10分 / 1時間 / 1日」のように整形する（Flutter版 formatMinutesBefore と揃える）
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
    const navigate = useNavigate();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isSecondWithdrawOpen, setIsSecondWithdrawOpen] = useState(false);
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
            alert(SETTINGS_PANEL.notifSaveFailedAlert);
        } finally {
            setNotifSaving(false);
        }
    };

    const handleSelectNotifMinutes = async (minutes) => {
        setNotifSaving(true);
        try {
            await updateNotificationSettings({ minutesBefore: minutes });
        } catch {
            alert(SETTINGS_PANEL.notifSaveFailedAlert);
        } finally {
            setNotifSaving(false);
        }
    };

    if (!isOpen) return null;

    const handleRestartTutorial = async () => {
        if (window.confirm(SETTINGS_PANEL.restartTutorialConfirm)) {
            try {
                setLoadingText(SETTINGS_PANEL.loadingTutorialPreparing);
                setIsTransitioning(true);
                await resetTutorial();
                window.location.reload();
            } catch (error) {
                console.error("チュートリアルのリセットに失敗しました:", error);
                setIsTransitioning(false);
                alert(SETTINGS_PANEL.restartTutorialFailedAlert);
            }
        }
    };

    // 1段階目のモーダル完了時
    const handleWithdrawConfirm = () => {
        setIsSecondWithdrawOpen(true);
    };

    // 2段階目のモーダル完了時（実際の削除処理）
    const handleActualWithdraw = async () => {
        try {
            setLoadingText(SETTINGS_PANEL.loadingWithdrawing);
            setIsTransitioning(true);
            setIsSecondWithdrawOpen(false);
            await withdrawConsent();
            await logout();
            onClose();
            // 自動で更新をかけて、確実に全状態をクリアし /agreement へ戻す
            window.location.href = "/agreement";
        } catch (error) {
            console.error("撤回およびログアウト中にエラーが発生しました:", error);
            setIsTransitioning(false);
            alert(SETTINGS_PANEL.withdrawErrorAlert);
        }
    };

    return (
        <>
            {isTransitioning && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-gray-700">{loadingText || SETTINGS_PANEL.loadingDefault}</p>
                </div>
            )}
            {/* バックドロップ */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* 中央モーダルレイアウト */}
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-4 pointer-events-none">
                <div className="w-full max-w-md bg-white border border-gray-200 text-gray-800 shadow-2xl rounded-3xl p-6 flex flex-col justify-between font-sans pointer-events-auto relative max-h-[90vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* ヘッダー */}
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-black flex items-center gap-2 text-gray-900">
                                <span>⚙️</span> {SETTINGS_PANEL.header}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* ログイン中のユーザー情報表示 */}
                        {currentUser && (
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                                {currentUser.photoURL && (
                                    <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-bold text-gray-800 truncate leading-snug">{currentUser.displayName || SETTINGS_PANEL.userFallback}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email || SETTINGS_PANEL.emailFallback}</p>
                                </div>
                            </div>
                        )}

                        {/* 締切前通知設定 */}
                        <div className="rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between p-3.5 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg">🔔</span>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-800">{SETTINGS_PANEL.notifTitle}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
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
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition disabled:opacity-50 ${notifEnabled ? "bg-blue-600" : "bg-gray-300"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${notifEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                            </div>

                            {notifEnabled && (
                                <div className="px-3.5 pb-3 border-t border-gray-100 pt-3">
                                    <p className="text-xs font-bold text-gray-600 mb-2">{SETTINGS_PANEL.notifMinutesLabel}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {NOTIF_PRESETS.map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                disabled={notifSaving}
                                                onClick={() => handleSelectNotifMinutes(preset)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition disabled:opacity-50 ${notifMinutes === preset ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
                                            >
                                                {formatMinutesBefore(preset)}{SETTINGS_PANEL.notifPresetSuffix}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-amber-50 border-t border-amber-100 px-3.5 py-2.5">
                                <p className="text-[11px] text-amber-700 leading-relaxed">
                                    {SETTINGS_PANEL.notifNote}
                                </p>
                            </div>
                        </div>

                        {/* 設定メニュー */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRestartTutorial}
                                className="w-full text-left p-3.5 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200"
                            >
                                <span className="text-lg">🔄</span>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{SETTINGS_PANEL.restartTutorialTitle}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{SETTINGS_PANEL.restartTutorialSub}</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/info");
                                }}
                                className="w-full text-left p-3.5 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200"
                            >
                                <span className="text-lg">📋</span>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{SETTINGS_PANEL.onboardingTitle}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{SETTINGS_PANEL.onboardingSub}</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 下部アクション */}
                    <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                        <button
                            onClick={async () => {
                                await logout();
                                onClose();
                                navigate("/agreement", { replace: true });
                            }}
                            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-center text-sm transition duration-200"
                        >
                            {SETTINGS_PANEL.logoutButton}
                        </button>
                        
                        <button
                            onClick={() => setIsWithdrawOpen(true)}
                            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-sm transition duration-200 shadow-md"
                        >
                            {SETTINGS_PANEL.withdrawButton}
                        </button>
                    </div>
                </div>
            </div>

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
                confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-sm"
                cancelButtonClass="text-slate-650 bg-slate-100 hover:bg-slate-200"
            >
                <div className="space-y-3">
                    <p className="font-bold text-red-600">
                        {SETTINGS_PANEL.finalConfirmLead}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {SETTINGS_PANEL.finalConfirmNote}
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}
