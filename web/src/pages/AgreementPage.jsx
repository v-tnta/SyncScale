import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { AGREEMENT_CONTENT } from "../config/content";

export function AgreementPage() {
    const { currentUser, login } = useAuth();
    const { recordConsent } = useConsent();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAgree = async () => {
        setLoading(true);
        try {
            if (!currentUser) {
                // 未ログインならまずログイン
                await login();
            }
            // 同意を記録
            await recordConsent();
            
            // 同意に成功したらオンボーディングページへ
            navigate("/info", { replace: true });
        } catch (error) {
            console.error("同意処理エラー:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-slate-100 font-sans">
            <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 mb-2">
                            <span className="text-3xl">📝</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                            {AGREEMENT_CONTENT.title}
                        </h1>
                        <p className="text-slate-400 text-xs md:text-sm">
                            本研究の内容をご確認いただき、同意の上でご利用ください。
                        </p>
                    </div>

                    <div className="border border-slate-800 bg-slate-950/60 p-6 rounded-2xl text-slate-300 leading-relaxed text-sm h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        <div className="whitespace-pre-line font-medium text-slate-300">
                            {AGREEMENT_CONTENT.body}
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4 pt-2">
                        <button
                            onClick={handleAgree}
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>🔐</span>
                                    <span>
                                        {currentUser ? AGREEMENT_CONTENT.buttonTextLoggedIn : AGREEMENT_CONTENT.buttonText}
                                    </span>
                                </>
                            )}
                        </button>
                        <p className="text-slate-500 text-xs text-center">
                            ※ Googleログイン後は、本研究への参加情報（同意状況）が暗号化されて保存されます。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
