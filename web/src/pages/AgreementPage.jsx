import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { AGREEMENT_CONTENT } from "../config/content";
import { ConfirmModal } from "../components/ConfirmModal";

export function AgreementPage() {
    const { currentUser, login } = useAuth();
    const { recordConsent, hasConsented } = useConsent();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 既に同意済みでログインしている場合はオンボーディングまたはホームへ飛ばす
    useEffect(() => {
        if (currentUser && hasConsented) {
            navigate("/", { replace: true });
        }
    }, [currentUser, hasConsented, navigate]);

    const handleAgreeClick = () => {
        // 同意ボタンが押されたらログインモーダルを開く
        setIsLoginModalOpen(true);
    };

    const handleLoginAndConsent = async () => {
        setIsLoginModalOpen(false);
        setLoading(true);
        try {
            if (!currentUser) {
                // 未ログインならGoogleログインを実行
                await login();
            }
            // 同意を記録
            await recordConsent();
            // オンボーディング画面へ遷移
            navigate("/info", { replace: true });
        } catch (error) {
            console.error("同意・ログイン処理エラー:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-violet-100 p-6 text-slate-800 font-sans transition-colors duration-200">
            <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 mb-2">
                            <span className="text-3xl">📝</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                            {AGREEMENT_CONTENT.title}
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm">
                            本研究の内容をご確認いただき、同意の上でご利用ください。
                        </p>
                    </div>

                    <div className="border border-slate-200 bg-white/50 p-6 rounded-2xl text-slate-700 leading-relaxed text-sm h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent shadow-inner">
                        <div className="whitespace-pre-line font-medium text-slate-700">
                            {AGREEMENT_CONTENT.body}
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4 pt-2">
                        <button
                            onClick={handleAgreeClick}
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>✓</span>
                                    <span>研究内容に同意する</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Googleログインを促すモーダル */}
            <ConfirmModal
                isOpen={isLoginModalOpen}
                title="🎁 研究への同意ありがとうございます"
                confirmText="Googleでログインして開始"
                cancelText="キャンセル"
                onConfirm={handleLoginAndConsent}
                onCancel={() => setIsLoginModalOpen(false)}
                confirmButtonClass="text-white bg-violet-600 hover:bg-violet-700 shadow-sm"
                cancelButtonClass="text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
                <div className="space-y-3 leading-relaxed">
                    <p>
                        本研究のシステム（SyncScale）を利用するには、Googleアカウントでのログインが必要です。
                    </p>
                    <p className="text-xs text-slate-500">
                        ※ ログインをもって、同意情報の記録とデータの暗号化保存（アカウント作成）が正式に開始されます。
                    </p>
                </div>
            </ConfirmModal>
        </div>
    );
}
