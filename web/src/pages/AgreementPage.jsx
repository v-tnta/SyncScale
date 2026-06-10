import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { AGREEMENT_CONTENT } from "../config/content";

// Googleのカラーロゴコンポーネント
const GoogleIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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

    // モーダルのアニメーション制御ステート
    const [modalVisible, setModalVisible] = useState(false);
    const [animationStage, setAnimationStage] = useState(0);

    // 既に同意済みでログインしている場合はオンボーディングまたはホームへ飛ばす
    useEffect(() => {
        if (currentUser && hasConsented) {
            navigate("/", { replace: true });
        }
    }, [currentUser, hasConsented, navigate]);

    // モーダルが開かれた際のアニメーションステージ制御
    useEffect(() => {
        if (isLoginModalOpen) {
            // モーダル全体のフェードイン開始
            const t0 = setTimeout(() => {
                setModalVisible(true);
            }, 50);

            // 600ms後: 説明文フェードイン
            const t1 = setTimeout(() => {
                setAnimationStage(1);
            }, 650);

            // 1200ms後: Googleボタンフェードイン
            const t2 = setTimeout(() => {
                setAnimationStage(2);
            }, 1250);

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
        // モーダルのフェードアウトが完了した後に開閉ステートを閉じる
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-6 text-slate-800 font-sans transition-colors duration-200">
            <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2">
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
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>✓</span>
                                    <span>{AGREEMENT_CONTENT.buttonText}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Googleログインを促すリッチで段階的なアニメーションモーダル */}
            {isLoginModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {/* バックドロップ */}
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        onClick={handleCloseModal}
                    ></div>

                    {/* モーダルコンテンツ */}
                    <div className={`relative w-full max-w-lg bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-100/80 flex flex-col space-y-6 transform transition-all duration-500 ease-out ${modalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                        
                        {/* 1. タイトル（モーダル出現と同時に表示） */}
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-950">
                                研究への同意、ありがとうございます。
                            </h2>
                        </div>

                        {/* 2. 説明テキスト（Stage 1 以上でふわっとフェードイン） */}
                        <div className={`space-y-4 leading-relaxed text-sm text-slate-650 font-medium transition-all duration-700 ease-out transform ${
                            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                            <p className="text-center">
                                本研究のシステム（SyncScale）を利用するには、Googleアカウントでのログインが必要です。
                            </p>
                            <p className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-slate-500 text-xs font-semibold text-center leading-relaxed">
                                ※ ログインをもって、同意情報の記録とデータの暗号化保存（アカウント作成）が正式に開始されます。
                            </p>
                        </div>

                        {/* 3. ストア・ログインボタン（Stage 2 以上でふわっとフェードイン） */}
                        <div className={`flex flex-col space-y-4 pt-2 transition-all duration-700 ease-out transform ${
                            animationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                            <button
                                onClick={handleLoginAndConsent}
                                className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition duration-300 shadow-sm hover:shadow-md text-base"
                            >
                                <GoogleIcon />
                                <span>Googleでログインして開始</span>
                            </button>
                            
                            <button
                                onClick={handleCloseModal}
                                className="text-xs font-bold text-slate-400 hover:text-slate-650 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition self-center"
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
