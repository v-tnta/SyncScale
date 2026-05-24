import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { useOnboarding } from "../hooks/useOnboarding";
import { ConsentWithdrawModal } from "./ConsentWithdrawModal";

export function SettingsPanel({ isOpen, onClose }) {
    const { logout } = useAuth();
    const { withdrawConsent } = useConsent();
    const { resetTutorial } = useOnboarding();
    const navigate = useNavigate();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    if (!isOpen) return null;

    const handleRestartTutorial = async () => {
        if (window.confirm("チュートリアルを再実行しますか？\n（一時的にオンボーディング画面に戻りますが、登録したデータは消えません）")) {
            try {
                await resetTutorial();
                onClose();
                navigate("/info", { replace: true });
            } catch (error) {
                console.error("チュートリアルのリセットに失敗しました:", error);
            }
        }
    };

    const handleWithdrawConfirm = async () => {
        try {
            await withdrawConsent();
            await logout();
            onClose();
            navigate("/agreement", { replace: true });
        } catch (error) {
            console.error("撤回およびログアウト中にエラーが発生しました:", error);
        }
    };

    return (
        <>
            {/* バックドロップ */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* スライドオーバードロワー */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-gray-200 text-gray-800 z-[95] shadow-2xl p-6 flex flex-col justify-between font-sans transition-transform duration-300 translate-x-0">
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
                                <p className="font-bold text-sm text-gray-800">研究参加情報 (/info)</p>
                                <p className="text-xs text-gray-500 mt-0.5">各種アンケートやリンクを確認する</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 下部アクション */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
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
                        className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 font-bold rounded-xl text-center text-sm transition duration-200"
                    >
                        研究同意の撤回
                    </button>
                </div>
            </div>

            {/* 同意撤回モーダル */}
            <ConsentWithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                onConfirm={handleWithdrawConfirm}
            />
        </>
    );
}
