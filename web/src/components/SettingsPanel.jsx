import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { useOnboarding } from "../hooks/useOnboarding";
import { ConsentWithdrawModal } from "./ConsentWithdrawModal";
import { ConfirmModal } from "./ConfirmModal";

export function SettingsPanel({ isOpen, onClose }) {
    const { currentUser, logout } = useAuth();
    const { withdrawConsent } = useConsent();
    const { resetTutorial } = useOnboarding();
    const navigate = useNavigate();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isSecondWithdrawOpen, setIsSecondWithdrawOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadingText, setLoadingText] = useState("");

    if (!isOpen) return null;

    const handleRestartTutorial = async () => {
        if (window.confirm("チュートリアルを再実行しますか？\n（一時的にオンボーディング画面に戻りますが、登録したデータは消えません）")) {
            try {
                setLoadingText("チュートリアルを準備中...");
                setIsTransitioning(true);
                await resetTutorial();
                window.location.reload();
            } catch (error) {
                console.error("チュートリアルのリセットに失敗しました:", error);
                setIsTransitioning(false);
                alert("チュートリアルのリセットに失敗しました。");
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
            setLoadingText("同意を撤回し、データを削除中...");
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
            alert("処理中にエラーが発生しました。");
        }
    };

    return (
        <>
            {isTransitioning && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-gray-700">{loadingText || "処理中..."}</p>
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
                                <span>⚙️</span> 設定
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
                                    <p className="text-[15px] font-bold text-gray-800 truncate leading-snug">{currentUser.displayName || "ユーザー"}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email || "メールアドレス未設定"}</p>
                                </div>
                            </div>
                        )}

                        {/* 設定メニュー */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRestartTutorial}
                                className="w-full text-left p-3.5 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200"
                            >
                                <span className="text-lg">🔄</span>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">チュートリアルの再実行</p>
                                    <p className="text-xs text-gray-500 mt-0.5">使い方をもう一度確認する</p>
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
                                    <p className="font-bold text-sm text-gray-800">研究参加オンボーディング</p>
                                    <p className="text-xs text-gray-500 mt-0.5">各種アンケートやリンクを再確認する</p>
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
                            ログアウト
                        </button>
                        
                        <button
                            onClick={() => setIsWithdrawOpen(true)}
                            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-sm transition duration-200 shadow-md"
                        >
                            研究同意の撤回
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
                title="⚠️ 同意撤回の最終確認"
                confirmText="はい、本当に削除する"
                cancelText="いいえ、キャンセル"
                onConfirm={handleActualWithdraw}
                onCancel={() => setIsSecondWithdrawOpen(false)}
                confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-sm"
                cancelButtonClass="text-slate-650 bg-slate-100 hover:bg-slate-200"
            >
                <div className="space-y-3">
                    <p className="font-bold text-red-600">
                        研究内容への同意を撤回し、本当にデータをすべて削除しますか？
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        ※ この操作を実行すると、あなたのタスク、時間ログ、コンディションログ、利用状況ログ、および設定が完全に削除され、復元することはできなくなります。
                    </p>
                </div>
            </ConfirmModal>
        </>
    );
}
