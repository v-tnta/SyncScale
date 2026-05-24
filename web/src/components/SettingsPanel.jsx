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
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 text-slate-100 z-[95] shadow-2xl p-6 flex flex-col justify-between font-sans transition-transform duration-300 translate-x-0">
                <div className="space-y-6">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <span>⚙️</span> 設定
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* 設定メニュー */}
                    <div className="space-y-3">
                        <button
                            onClick={handleRestartTutorial}
                            className="w-full text-left p-3.5 rounded-xl hover:bg-slate-800 transition duration-200 flex items-center gap-3 border border-transparent hover:border-slate-700/50"
                        >
                            <span className="text-lg">🔄</span>
                            <div>
                                <p className="font-bold text-sm">チュートリアルの再実行</p>
                                <p className="text-xs text-slate-500 mt-0.5">使い方をもう一度確認する</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                onClose();
                                navigate("/info");
                            }}
                            className="w-full text-left p-3.5 rounded-xl hover:bg-slate-800 transition duration-200 flex items-center gap-3 border border-transparent hover:border-slate-700/50"
                        >
                            <span className="text-lg">📋</span>
                            <div>
                                <p className="font-bold text-sm">研究参加情報 (/info)</p>
                                <p className="text-xs text-slate-500 mt-0.5">各種アンケートやリンクを確認する</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 下部アクション */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                    <button
                        onClick={async () => {
                            await logout();
                            onClose();
                            navigate("/agreement", { replace: true });
                        }}
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition duration-200"
                    >
                        ログアウト
                    </button>
                    
                    <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="w-full py-3 px-4 bg-red-950/10 hover:bg-red-950/20 text-red-500 border border-red-500/20 font-bold rounded-xl text-center text-sm transition duration-200"
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
