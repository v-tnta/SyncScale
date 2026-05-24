import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../hooks/useOnboarding";
import { ONBOARDING_STEPS } from "../config/content";

export function InfoPage() {
    const { onboarding, loading, completeStep } = useOnboarding();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    
    // 各ステップのリンククリック状態
    const [linkClicked, setLinkClicked] = useState({
        step1: false,
        step2: false,
        step3: false,
        step4: true // チュートリアル開始案内はリンクがないため最初からtrue
    });

    useEffect(() => {
        // モバイルデバイスの判定
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        setIsMobile(mobileRegex.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        if (onboarding) {
            // 現在の進捗に合わせて初期ステップを決定する
            if (!onboarding.step1) setCurrentStep(1);
            else if (!onboarding.step2) setCurrentStep(2);
            else if (!onboarding.step3) setCurrentStep(3);
            else setCurrentStep(4);
        }
    }, [onboarding]);

    if (loading || !onboarding) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800 transition-colors duration-200">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const handleStepComplete = async (stepNum) => {
        try {
            if (stepNum < 4) {
                await completeStep(stepNum);
                setCurrentStep(stepNum + 1);
            } else {
                // ステップ4（動的チュートリアル開始）は、ホーム画面に移動して開始
                navigate("/svc/home", { replace: true });
            }
        } catch (error) {
            console.error(`ステップ ${stepNum} の完了処理に失敗しました:`, error);
        }
    };

    const handleLinkClick = (stepNum) => {
        setLinkClicked(prev => ({
            ...prev,
            [`step${stepNum}`]: true
        }));
    };

    // ヘルパー: 各ステップの完了状態
    const isStepDone = (stepNum) => {
        if (stepNum === 1) return onboarding.step1;
        if (stepNum === 2) return onboarding.step2;
        if (stepNum === 3) return onboarding.step3;
        if (stepNum === 4) return onboarding.step4;
        return onboarding.completed;
    };

    // ステップインジケーターのクリックによる移動（すでに完了しているステップ、またはその次のステップのみ移動可能）
    const handleStepClick = (stepNum) => {
        let maxAllowed = 1;
        if (onboarding.step1) maxAllowed = 2;
        if (onboarding.step2) maxAllowed = 3;
        if (onboarding.step3) maxAllowed = 4;
        
        if (stepNum <= maxAllowed) {
            setCurrentStep(stepNum);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 text-slate-800 font-sans p-6 flex flex-col items-center justify-center transition-colors duration-200">
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-8">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-85 h-85 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-85 h-85 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* 上部ヘッダー */}
                <div className="text-center relative z-10">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-slate-900 to-indigo-955 bg-clip-text text-transparent">
                        研究参加オンボーディング
                    </h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">
                        SyncScaleを使い始めるためのステップを進めましょう
                    </p>
                </div>

                {/* ステップナビゲーター */}
                <div className="flex justify-between items-center relative z-10 w-full max-w-xl mx-auto px-4">
                    {[1, 2, 3, 4].map((stepNum) => {
                        const active = currentStep === stepNum;
                        const done = isStepDone(stepNum);
                        const isAccessible = stepNum <= (onboarding.step1 ? 2 : 1) + (onboarding.step2 ? 1 : 0) + (onboarding.step3 ? 1 : 0);
                        
                        return (
                            <div key={stepNum} className="flex flex-col items-center relative z-10 flex-1">
                                <button
                                    onClick={() => handleStepClick(stepNum)}
                                    disabled={!isAccessible}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                                        active
                                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110"
                                            : done
                                            ? "bg-blue-100 border-blue-300 text-blue-700"
                                            : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    {done && stepNum < 4 ? "✓" : stepNum}
                                </button>
                                <span className={`text-[10px] mt-2 hidden sm:block ${active ? "text-blue-600 font-bold" : done ? "text-blue-600" : "text-slate-400"}`}>
                                    {stepNum === 1 && "アンケート"}
                                    {stepNum === 2 && "LINE"}
                                    {stepNum === 3 && "拡張機能"}
                                    {stepNum === 4 && "チュートリアル"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* メインコンテンツ */}
                <div className="relative z-10 bg-white/50 border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col space-y-6 flex-1 min-h-[350px]">
                    {currentStep === 1 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">1</span>
                                {ONBOARDING_STEPS.step1.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step1.description}
                            </p>
                            {isMobile && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{ONBOARDING_STEPS.step1.pcOnlyMessage}</span>
                                </div>
                            )}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <a
                                    href={ONBOARDING_STEPS.step1.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(1)}
                                    className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 text-center transition duration-300 block text-sm"
                                >
                                    {ONBOARDING_STEPS.step1.buttonText}
                                </a>
                                <button
                                    onClick={() => handleStepComplete(1)}
                                    disabled={!linkClicked.step1}
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition duration-300 text-sm disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {ONBOARDING_STEPS.step1.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">2</span>
                                {ONBOARDING_STEPS.step2.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step2.description}
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <a
                                    href={ONBOARDING_STEPS.step2.lineOpenChatUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(2)}
                                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition duration-300 block text-sm shadow-md shadow-emerald-600/10"
                                >
                                    {ONBOARDING_STEPS.step2.buttonText}
                                </a>
                                <button
                                    onClick={() => handleStepComplete(2)}
                                    disabled={!linkClicked.step2}
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition duration-300 text-sm disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {ONBOARDING_STEPS.step2.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">3</span>
                                {ONBOARDING_STEPS.step3.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step3.description}
                            </p>
                            {isMobile && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{ONBOARDING_STEPS.step3.pcOnlyMessage}</span>
                                </div>
                            )}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <a
                                    href={ONBOARDING_STEPS.step3.chromeWebStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(3)}
                                    className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 text-center transition duration-300 block text-sm"
                                >
                                    {ONBOARDING_STEPS.step3.buttonText}
                                </a>
                                <button
                                    onClick={() => handleStepComplete(3)}
                                    disabled={!linkClicked.step3}
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition duration-300 text-sm disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {ONBOARDING_STEPS.step3.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">4</span>
                                {ONBOARDING_STEPS.step4.title}
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step4.description}
                            </p>
                            <div className="pt-4 flex">
                                <button
                                    onClick={() => handleStepComplete(4)}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 transition duration-300 text-base"
                                >
                                    {ONBOARDING_STEPS.step4.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
