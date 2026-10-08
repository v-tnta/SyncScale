import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ExternalLink, Globe, Sparkles } from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import { useAuth } from "../hooks/useAuth";
import { ONBOARDING_STEPS } from "../content";
import { isChromeBrowser } from "../domain/browser";

export function OnboardingPage() {
    const { onboarding, loading, completeStep } = useOnboarding();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    // Chrome 本体のインストール案内（step3 の手前）
    const [isChrome] = useState(() => isChromeBrowser());
    const [chromeGateDismissed, setChromeGateDismissed] = useState(false);

    // UIDを動的に事前入力したURLを生成
    const prefilledFormUrl = React.useMemo(() => {
        if (!currentUser) return ONBOARDING_STEPS.step1.formUrl;
        return ONBOARDING_STEPS.step1.formUrl.replace("TEMP_UID", encodeURIComponent(currentUser.uid));
    }, [currentUser]);
    
    // 各ステップのリンククリック状態
    const [linkClicked, setLinkClicked] = useState({
        step1: false,
        step2: false,
        step3: false,
        step4: true
    });

    useEffect(() => {
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        setIsMobile(mobileRegex.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        if (onboarding) {
            if (!onboarding.step1) setCurrentStep(1);
            else if (!onboarding.step2) setCurrentStep(2);
            else if (!onboarding.step3) setCurrentStep(3);
            else setCurrentStep(4);
        }
    }, [onboarding]);

    if (loading || !onboarding) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleStepComplete = async (stepNum) => {
        try {
            if (stepNum < 4) {
                await completeStep(stepNum);
                setCurrentStep(stepNum + 1);
            } else {
                if (isMobile) {
                    window.location.href = "/svc/mobile/";
                } else {
                    navigate("/svc/home", { replace: true });
                }
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

    const isStepDone = (stepNum) => {
        if (stepNum === 1) return onboarding.step1;
        if (stepNum === 2) return onboarding.step2;
        if (stepNum === 3) return onboarding.step3;
        if (stepNum === 4) return onboarding.step4;
        return onboarding.completed;
    };

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-6 flex flex-col items-center justify-center transition-colors duration-200">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-7">
                
                {/* 上部ヘッダー */}
                <div className="text-center relative z-10">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                        研究参加オンボーディング
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                        SyncScaleを使い始めるためのステップを進めましょう
                    </p>
                </div>

                {/* ステップナビゲーター */}
                <div className="flex justify-between items-center relative z-10 w-full max-w-lg mx-auto px-2">
                    {[1, 2, 3, 4].map((stepNum) => {
                        const active = currentStep === stepNum;
                        const done = isStepDone(stepNum);
                        const isAccessible = stepNum <= (onboarding.step1 ? 2 : 1) + (onboarding.step2 ? 1 : 0) + (onboarding.step3 ? 1 : 0);
                        
                        return (
                            <div key={stepNum} className="flex flex-col items-center relative z-10 flex-1">
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(stepNum)}
                                    disabled={!isAccessible}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 border-2 ${
                                        active
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                                            : done
                                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300"
                                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                    }`}
                                >
                                    {done && stepNum < 4 ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                                </button>
                                <span className={`text-[11px] mt-1.5 hidden sm:block ${active ? "text-blue-600 dark:text-blue-400 font-bold" : done ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
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
                <div className="relative z-10 bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-8 flex flex-col space-y-6 flex-1 min-h-[300px]">
                    {currentStep === 1 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">1</span>
                                {ONBOARDING_STEPS.step1.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step1.description}
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                {/* 外部リンクボタン: ホバー時に薄青 */}
                                <a
                                    href={prefilledFormUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(1)}
                                    className="btn-external-blue flex-1 py-3 px-5 font-bold rounded-xl text-center text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <span>{ONBOARDING_STEPS.step1.buttonText}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleStepComplete(1)}
                                    disabled={!linkClicked.step1}
                                    className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition duration-200 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {ONBOARDING_STEPS.step1.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">2</span>
                                {ONBOARDING_STEPS.step2.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step2.description}
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                {/* 外部リンクボタン: LINEは緑 */}
                                <a
                                    href={ONBOARDING_STEPS.step2.lineOpenChatUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(2)}
                                    className="btn-external-line flex-1 py-3 px-5 font-bold rounded-xl text-center text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <span>{ONBOARDING_STEPS.step2.buttonText}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleStepComplete(2)}
                                    disabled={!linkClicked.step2}
                                    className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition duration-200 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {ONBOARDING_STEPS.step2.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* step3 手前: Chrome 本体の案内 */}
                    {currentStep === 3 && !isChrome && !isMobile && !chromeGateDismissed && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <Globe className="w-6 h-6 text-amber-500" />
                                {ONBOARDING_STEPS.chromeGate.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {ONBOARDING_STEPS.chromeGate.description}
                            </p>
                            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs flex items-start gap-2">
                                <span>💡</span>
                                <span>{ONBOARDING_STEPS.chromeGate.note}</span>
                            </div>
                            <div className="pt-3 flex">
                                <a
                                    href={ONBOARDING_STEPS.chromeGate.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-external-blue flex-1 py-3 px-5 font-bold rounded-xl text-center text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <span>{ONBOARDING_STEPS.chromeGate.downloadButtonText}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChromeGateDismissed(true)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition text-center"
                            >
                                {ONBOARDING_STEPS.chromeGate.skipButtonText}
                            </button>
                        </div>
                    )}

                    {currentStep === 3 && (isChrome || isMobile || chromeGateDismissed) && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">3</span>
                                {ONBOARDING_STEPS.step3.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step3.description}
                            </p>
                            {isMobile && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{ONBOARDING_STEPS.step3.pcOnlyMessage}</span>
                                </div>
                            )}
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                {/* 外部リンクボタン: Chromeウェブストアはホバー時に薄青 */}
                                <a
                                    href={ONBOARDING_STEPS.step3.chromeWebStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleLinkClick(3)}
                                    className="btn-external-blue flex-1 py-3 px-5 font-bold rounded-xl text-center text-xs sm:text-sm flex items-center justify-center gap-2"
                                >
                                    <span>{ONBOARDING_STEPS.step3.buttonText}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleStepComplete(3)}
                                    disabled={!linkClicked.step3}
                                    className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition duration-200 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {ONBOARDING_STEPS.step3.completeButtonText}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">4</span>
                                {ONBOARDING_STEPS.step4.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {ONBOARDING_STEPS.step4.description}
                            </p>
                            <div className="pt-4 flex">
                                <button
                                    type="button"
                                    onClick={() => handleStepComplete(4)}
                                    className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-xs transition duration-200 text-sm flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>{ONBOARDING_STEPS.step4.completeButtonText}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
