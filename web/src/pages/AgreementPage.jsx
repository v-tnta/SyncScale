import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { AGREEMENT_CONTENT } from "../content";
import logo from "../assets/logo.png";

// Googleのカラーロゴコンポーネント
const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export function AgreementPage() {
    const { currentUser, login } = useAuth();
    const { recordConsent, hasConsented } = useConsent();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [modalVisible, setModalVisible] = useState(false);
    const [animationStage, setAnimationStage] = useState(0);

    // 既に同意済みでログインしている場合はルートへリダイレクト
    useEffect(() => {
        if (currentUser && hasConsented) {
            navigate("/", { replace: true });
        }
    }, [currentUser, hasConsented, navigate]);

    useEffect(() => {
        if (isLoginModalOpen) {
            const t0 = setTimeout(() => { setModalVisible(true); }, 50);
            const t1 = setTimeout(() => { setAnimationStage(1); }, 650);
            const t2 = setTimeout(() => { setAnimationStage(2); }, 1250);

            return () => {
                clearTimeout(t0);
                clearTimeout(t1);
                clearTimeout(t2);
            };
        } else {
            setModalVisible(false);
            setAnimationStage(0);
        }
    }, [isLoginModalOpen]);

    const handleAgreeClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setAnimationStage(0);
        setTimeout(() => {
            setIsLoginModalOpen(false);
        }, 300);
    };

    const handleLoginAndConsent = async () => {
        setIsLoginModalOpen(false);
        setModalVisible(false);
        setAnimationStage(0);
        setLoading(true);
        try {
            let uid = currentUser?.uid;
            if (!uid) {
                const user = await login();
                uid = user.uid;
            }
            await recordConsent(uid);
        } catch (error) {
            console.error("同意・ログイン処理エラー:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
                
                <div className="text-center space-y-2 flex flex-col items-center">
                    <img src={logo} alt="SyncScale Logo" className="w-16 h-16 object-contain mb-1" />
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                        {AGREEMENT_CONTENT.title}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                        本研究の内容をご確認いただき、同意の上でご利用ください。
                    </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 p-5 sm:p-6 rounded-2xl text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm h-80 overflow-y-auto custom-scrollbar shadow-inner">
                    <div className="whitespace-pre-line font-medium">
                        {AGREEMENT_CONTENT.body}
                    </div>
                </div>

                <div className="flex flex-col items-center pt-2">
                    <button
                        type="button"
                        onClick={handleAgreeClick}
                        disabled={loading}
                        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <FileCheck className="w-5 h-5" />
                                <span>{AGREEMENT_CONTENT.buttonText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Googleログイン案内モーダル */}
            {isLoginModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
                        onClick={handleCloseModal}
                    ></div>

                    <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-6 transform transition-all duration-500 ease-out ${modalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                        
                        <div className="text-center space-y-2 flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-1 shadow-xs">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50">
                                研究への同意、ありがとうございます
                            </h2>
                        </div>

                        <div className={`space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium transition-all duration-700 ease-out transform ${
                            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                            <p className="text-center leading-relaxed">
                                本研究のシステム（SyncScale）を利用するには、Googleアカウントでのログインが必要です。
                            </p>
                            <p className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-slate-500 dark:text-slate-400 text-xs text-center leading-relaxed">
                                ※ ログインをもって、同意情報の記録とデータの暗号化保存（アカウント作成）が正式に開始されます。
                            </p>
                        </div>

                        <div className={`flex flex-col space-y-3 pt-1 transition-all duration-700 ease-out transform ${
                            animationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                            <button
                                type="button"
                                onClick={handleLoginAndConsent}
                                className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition duration-200 shadow-xs hover:shadow-sm text-sm"
                            >
                                <GoogleIcon />
                                <span>Googleでログインして開始</span>
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1.5 transition self-center"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
