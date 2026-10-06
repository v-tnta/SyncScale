import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Copy, Check, ExternalLink, ArrowLeft, MessageCircle, Puzzle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ONBOARDING_STEPS } from "../content";
import { isChromeBrowser } from "../domain/browser";

export function InfoPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isChrome] = useState(() => isChromeBrowser());

    const prefilledFormUrl = React.useMemo(() => {
        if (!currentUser) return ONBOARDING_STEPS.step1.formUrl;
        return ONBOARDING_STEPS.step1.formUrl.replace("TEMP_UID", encodeURIComponent(currentUser.uid));
    }, [currentUser]);

    useEffect(() => {
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        setIsMobile(mobileRegex.test(navigator.userAgent));
    }, []);

    const handleCopyUid = async () => {
        if (currentUser?.uid) {
            try {
                await navigator.clipboard.writeText(currentUser.uid);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("UIDのコピーに失敗しました:", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-8 flex flex-col items-center justify-start transition-colors duration-200">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-7 mt-2 sm:mt-6">
                
                {/* 上部ヘッダー */}
                <div className="text-center relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                        研究参加情報・リンク一覧
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                        SyncScaleの研究にご協力いただきありがとうございます。研究で必要となるアンケート、連絡グループ、および拡張機能のリンクをいつでもこちらからご確認いただけます。
                    </p>
                </div>

                {/* UID表示・コピーエリア */}
                {currentUser && (
                    <div className="relative z-10 bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-center sm:text-left min-w-0">
                            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">あなたの研究用ID (UID)</p>
                            <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-200 mt-0.5 select-all break-all">
                                {currentUser.uid}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyUid}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs transition duration-200 flex items-center gap-1.5 border shrink-0 ${
                                copied
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
                            }`}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "コピーしました" : "UIDをコピー"}</span>
                        </button>
                    </div>
                )}

                {/* 各種案内カードグリッド */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* カード1: 事前アンケート */}
                    <div className="bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                    <FileText className="w-4 h-4" />
                                </span>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ONBOARDING_STEPS.step1.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {ONBOARDING_STEPS.step1.description}
                            </p>
                        </div>
                        <div className="pt-5">
                            <a
                                href={prefilledFormUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-external-blue w-full py-2.5 px-3 font-bold rounded-xl text-center text-xs transition duration-200 flex items-center justify-center gap-1.5"
                            >
                                <span>アンケートに回答する</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* カード2: LINEオープンチャット */}
                    <div className="bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                                    <MessageCircle className="w-4 h-4" />
                                </span>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ONBOARDING_STEPS.step2.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {ONBOARDING_STEPS.step2.description}
                            </p>
                        </div>
                        <div className="pt-5">
                            <a
                                href={ONBOARDING_STEPS.step2.lineOpenChatUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-external-line w-full py-2.5 px-3 font-bold rounded-xl text-center text-xs transition duration-200 flex items-center justify-center gap-1.5"
                            >
                                <span>オープンチャットに参加</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* カード3: Chrome拡張機能 */}
                    <div className="bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                    <Puzzle className="w-4 h-4" />
                                </span>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ONBOARDING_STEPS.step3.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {ONBOARDING_STEPS.step3.description}
                            </p>
                            {isMobile && (
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-xl text-[11px]">
                                    ⚠️ {ONBOARDING_STEPS.step3.pcOnlyMessage}
                                </div>
                            )}
                            {!isMobile && !isChrome && (
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-xl text-[11px]">
                                    ⚠️ {ONBOARDING_STEPS.chromeGate.noticeShort}{' '}
                                    <a
                                        href={ONBOARDING_STEPS.chromeGate.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-2 font-bold hover:text-amber-800"
                                    >
                                        {ONBOARDING_STEPS.chromeGate.downloadButtonText}
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="pt-5">
                            <a
                                href={ONBOARDING_STEPS.step3.chromeWebStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-external-blue w-full py-2.5 px-3 font-bold rounded-xl text-center text-xs transition duration-200 flex items-center justify-center gap-1.5"
                            >
                                <span>拡張機能をインストール</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* ホームに戻るボタン */}
                <div className="relative z-10 flex justify-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => {
                            if (isMobile) {
                                window.location.href = "/svc/mobile/";
                            } else {
                                navigate("/svc/home");
                            }
                        }}
                        className="py-2.5 px-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition duration-200 shadow-xs flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>ホーム画面に戻る</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
