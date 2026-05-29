import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ONBOARDING_STEPS } from "../config/content";

export function InfoPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [copied, setCopied] = useState(false);

    // UIDを動的に事前入力したURLを生成
    const prefilledFormUrl = React.useMemo(() => {
        if (!currentUser) return ONBOARDING_STEPS.step1.formUrl;
        return ONBOARDING_STEPS.step1.formUrl.replace("TEMP_UID", encodeURIComponent(currentUser.uid));
    }, [currentUser]);

    useEffect(() => {
        // モバイルデバイスの判定
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 text-slate-800 font-sans p-6 md:p-12 flex flex-col items-center justify-start transition-colors duration-200">
            <div className="w-full max-w-5xl bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-8 mt-4 md:mt-8">
                {/* 装飾用の光彩 */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* 上部ヘッダー */}
                <div className="text-center relative z-10 flex flex-col items-center">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 mb-3">
                        <span className="text-3xl">📋</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                        研究参加情報・リンク一覧
                    </h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
                        SyncScaleの研究にご協力いただきありがとうございます。研究で必要となるアンケート、連絡グループ、および拡張機能のリンクをいつでもこちらからご確認いただけます。
                    </p>
                </div>

                {/* UID表示・コピーエリア */}
                {currentUser && (
                    <div className="relative z-10 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">あなたの研究用ID (UID)</p>
                            <p className="text-sm md:text-base font-mono font-bold text-slate-700 mt-1 select-all break-all">
                                {currentUser.uid}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyUid}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition duration-300 flex items-center gap-2 border ${
                                copied
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 shadow-sm"
                            }`}
                        >
                            <span>{copied ? "✓" : "📋"}</span>
                            <span>{copied ? "コピーしました" : "UIDをコピー"}</span>
                        </button>
                    </div>
                )}

                {/* 各種案内カードグリッド */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* カード1: 事前アンケート */}
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 hover:border-slate-300 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition duration-300">📝</span>
                                <h3 className="font-bold text-base text-slate-900">{ONBOARDING_STEPS.step1.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {ONBOARDING_STEPS.step1.description}
                            </p>
                        </div>
                        <div className="pt-6">
                            <a
                                href={prefilledFormUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center text-xs transition duration-300 block shadow-md shadow-blue-650/10"
                            >
                                アンケートに回答する
                            </a>
                        </div>
                    </div>

                    {/* カード2: LINEオープンチャット */}
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 hover:border-slate-300 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition duration-300">💬</span>
                                <h3 className="font-bold text-base text-slate-900">{ONBOARDING_STEPS.step2.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {ONBOARDING_STEPS.step2.description}
                            </p>
                        </div>
                        <div className="pt-6">
                            <a
                                href={ONBOARDING_STEPS.step2.lineOpenChatUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center text-xs transition duration-300 block shadow-md shadow-emerald-650/10"
                            >
                                オープンチャットに参加
                            </a>
                        </div>
                    </div>

                    {/* カード3: Chrome拡張機能 */}
                    <div className="bg-white/60 backdrop-blur-sm border border-slate-200 hover:border-slate-300 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-110 transition duration-300">🧩</span>
                                <h3 className="font-bold text-base text-slate-900">{ONBOARDING_STEPS.step3.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {ONBOARDING_STEPS.step3.description}
                            </p>
                            {isMobile && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-[11px] flex items-start gap-1.5 mt-2">
                                    <span>⚠️</span>
                                    <span>{ONBOARDING_STEPS.step3.pcOnlyMessage}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-6">
                            <a
                                href={ONBOARDING_STEPS.step3.chromeWebStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-center text-xs transition duration-300 block shadow-md shadow-indigo-600/10"
                            >
                                拡張機能をインストール
                            </a>
                        </div>
                    </div>
                </div>

                {/* ホームに戻るボタン */}
                <div className="relative z-10 flex justify-center pt-4 border-t border-slate-200/60">
                    <button
                        onClick={() => {
                            if (isMobile) {
                                window.location.href = "/svc/mobile/";
                            } else {
                                navigate("/svc/home");
                            }
                        }}
                        className="py-3.5 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition duration-300 shadow-lg shadow-slate-900/10 flex items-center gap-2 group"
                    >
                        <span>🏠</span>
                        <span>ホーム画面に戻る</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
