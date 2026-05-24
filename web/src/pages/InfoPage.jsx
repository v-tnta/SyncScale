import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../hooks/useOnboarding";
import { ONBOARDING_STEPS } from "../config/content";
import Tutorial from "../components/Tutorial";

export function InfoPage() {
    const { onboarding, loading, completeStep } = useOnboarding();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

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
            else if (!onboarding.step4) setCurrentStep(4);
            else setCurrentStep(5);
        }
    }, [onboarding]);

    if (loading || !onboarding) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    const handleStepComplete = async (stepNum) => {
        try {
            await completeStep(stepNum);
            if (stepNum < 5) {
                setCurrentStep(stepNum + 1);
            } else {
                navigate("/svc/home", { replace: true });
            }
        } catch (error) {
            console.error(`ステップ ${stepNum} の完了処理に失敗しました:`, error);
        }
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
        if (onboarding.step4) maxAllowed = 5;
        
        if (stepNum <= maxAllowed) {
            setCurrentStep(stepNum);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-8">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-85 h-85 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-85 h-85 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* 上部ヘッダー */}
                <div className="text-center relative z-10">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-200 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                        研究参加オンボーディング
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">
                        SyncScaleを使い始めるためのステップを進めましょう
                    </p>
                </div>

                {/* ステップナビゲーター */}
                <div className="flex justify-between items-center relative z-10 w-full max-w-2xl mx-auto px-4">
                    {[1, 2, 3, 4, 5].map((stepNum) => {
                        const active = currentStep === stepNum;
                        const done = isStepDone(stepNum);
                        const isAccessible = stepNum <= (onboarding.step1 ? 2 : 1) + (onboarding.step2 ? 1 : 0) + (onboarding.step3 ? 1 : 0) + (onboarding.step4 ? 1 : 0);
                        
                        return (
                            <div key={stepNum} className="flex flex-col items-center relative z-10 flex-1">
                                <button
                                    onClick={() => handleStepClick(stepNum)}
                                    disabled={!isAccessible}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                                        active
                                            ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30 scale-110"
                                            : done
                                            ? "bg-indigo-950 border-indigo-500 text-indigo-400"
                                            : "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                                    }`}
                                >
                                    {done && stepNum < 5 ? "✓" : stepNum}
                                </button>
                                <span className={`text-[10px] mt-2 hidden sm:block ${active ? "text-violet-300 font-bold" : done ? "text-indigo-400" : "text-slate-500"}`}>
                                    {stepNum === 1 && "アンケート"}
                                    {stepNum === 2 && "拡張機能"}
                                    {stepNum === 3 && "チュートリアル"}
                                    {stepNum === 4 && "スマホアプリ"}
                                    {stepNum === 5 && "準備完了"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* メインコンテンツ */}
                <div className="relative z-10 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col space-y-6 flex-1 min-h-[350px]">
                    {currentStep === 1 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">1</span>
                                {ONBOARDING_STEPS.step1.title}
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step1.description}
                            </p>
                            {isMobile && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{ONBOARDING_STEPS.step1.pcOnlyMessage}</span>
                                </div>
                            )}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <a
                                    href={ONBOARDING_STEPS.step1.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-center transition duration-300 block text-sm"
                                >
                                    {ONBOARDING_STEPS.step1.buttonText}
                                </a>
                                <button
                                    onClick={() => handleStepComplete(1)}
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 transition duration-300 text-sm"
                                >
                                    {ONBOARDING_STEPS.step1.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">2</span>
                                {ONBOARDING_STEPS.step2.title}
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step2.description}
                            </p>
                            {isMobile && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>拡張機能はPCブラウザでのみインストール・使用可能です。</span>
                                </div>
                            )}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <a
                                    href={ONBOARDING_STEPS.step2.chromeWebStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-center transition duration-300 block text-sm"
                                >
                                    {ONBOARDING_STEPS.step2.buttonText}
                                </a>
                                <button
                                    onClick={() => handleStepComplete(2)}
                                    className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 transition duration-300 text-sm"
                                >
                                    {ONBOARDING_STEPS.step2.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">3</span>
                                {ONBOARDING_STEPS.step3.title}
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                {ONBOARDING_STEPS.step3.description}
                            </p>
                            <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 p-2 overflow-hidden shadow-inner">
                                <Tutorial onComplete={() => handleStepComplete(3)} />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">4</span>
                                {ONBOARDING_STEPS.step4.title}
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step4.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <a
                                    href={ONBOARDING_STEPS.step4.iosUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-center transition duration-300 text-sm flex items-center justify-center gap-2"
                                >
                                    <span></span> iOS App Store
                                </a>
                                <a
                                    href={ONBOARDING_STEPS.step4.androidUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-center transition duration-300 text-sm flex items-center justify-center gap-2"
                                >
                                    <span>🤖</span> Google Play Store
                                </a>
                            </div>
                            <div className="pt-4 flex">
                                <button
                                    onClick={() => handleStepComplete(4)}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 transition duration-300 text-sm"
                                >
                                    {ONBOARDING_STEPS.step4.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="flex flex-col space-y-6 text-center py-4">
                            <div className="text-5xl">🎉</div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white">
                                    {ONBOARDING_STEPS.step5.title}
                                </h2>
                                <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                                    {ONBOARDING_STEPS.step5.description}
                                </p>
                            </div>

                            <div className="max-w-md mx-auto w-full bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl space-y-4">
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    {ONBOARDING_STEPS.step5.lineOpenChatText}
                                </p>
                                <a
                                    href={ONBOARDING_STEPS.step5.lineOpenChatUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition duration-300 block text-sm shadow-lg shadow-emerald-600/20"
                                >
                                    LINE OpenChat に参加する
                                </a>
                            </div>

                            <div className="pt-6 max-w-md mx-auto w-full">
                                <button
                                    onClick={() => handleStepComplete(5)}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-violet-500/20 transition duration-300 text-base"
                                >
                                    {ONBOARDING_STEPS.step5.goToAppButtonText}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
