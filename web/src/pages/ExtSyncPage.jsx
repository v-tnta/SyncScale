import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { EXT_SYNC_CONTENT } from "../config/content";

export function ExtSyncPage() {
    const { currentUser, login, loading: authLoading } = useAuth();
    const { hasConsented, loading: consentLoading } = useConsent();
    const [loginLoading, setLoginLoading] = useState(false);
    const [readyToRedirect, setReadyToRedirect] = useState(false);
    const navigate = useNavigate();

    // 拡張機能からの postMessage を待機する、およびタイムアウトタイマー
    useEffect(() => {
        let timer = null;
        let isDisposed = false;

        // すでに sessionStorage に pendingImportTasks がある場合は、
        // タイムアウトを待たずに即時遷移可能にする
        const hasPending = sessionStorage.getItem("pendingImportTasks");
        if (hasPending) {
            setReadyToRedirect(true);
        }

        const handleMessage = (event) => {
            if (isDisposed) return;
            if (event.data && event.data.type === "SYNC_SCALE_IMPORT_TASKS") {
                console.log("拡張機能からタスクデータを受信 (ExtSyncPage):", event.data.tasks);
                sessionStorage.setItem("pendingImportTasks", JSON.stringify(event.data.tasks));
                // ACKを返信して拡張機能側のストレージをクリアさせる
                window.postMessage({ type: 'SYNC_SCALE_IMPORT_ACK' }, '*');
                
                // タスク受信が完了したら、即座に遷移可能にする
                setReadyToRedirect(true);
                if (timer) clearTimeout(timer);
            }
        };

        window.addEventListener("message", handleMessage);
        
        // 拡張機能へWebアプリの準備ができたことを知らせる
        window.postMessage({ type: 'SYNC_SCALE_APP_READY' }, '*');

        // タスクが受信されなかった場合のタイムアウト (1.2秒)
        if (!hasPending) {
            timer = setTimeout(() => {
                if (!isDisposed) {
                    setReadyToRedirect(true);
                }
            }, 1200);
        }

        return () => {
            isDisposed = true;
            window.removeEventListener("message", handleMessage);
            if (timer) clearTimeout(timer);
        };
    }, []);

    // ログイン状態と同意状態、およびリダイレクト準備完了フラグの変化に応じてリダイレクト
    useEffect(() => {
        if (!authLoading && !consentLoading && readyToRedirect) {
            if (currentUser) {
                if (hasConsented) {
                    // 同意済みならメインアプリへ
                    navigate("/svc/home", { replace: true });
                } else {
                    // 未同意なら同意書へ
                    navigate("/agreement", { replace: true });
                }
            }
        }
    }, [currentUser, hasConsented, authLoading, consentLoading, readyToRedirect, navigate]);

    const handleLogin = async () => {
        setLoginLoading(true);
        try {
            await login();
        } catch (error) {
            console.error("拡張機能フロー中のログインエラー:", error);
        } finally {
            setLoginLoading(false);
        }
    };

    if (authLoading || consentLoading || (currentUser && hasConsented && !readyToRedirect)) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-800 gap-4 transition-colors duration-200">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                {currentUser && <p className="text-sm font-semibold text-slate-500">拡張機能から課題を同期中...</p>}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-6 text-slate-800 font-sans transition-colors duration-200">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2">
                    <span className="text-4xl">🔌</span>
                </div>
                
                <h1 className="text-xl md:text-2xl font-black text-slate-900">
                    {EXT_SYNC_CONTENT.title}
                </h1>
                
                <p className="text-slate-600 text-sm leading-relaxed px-4">
                    {EXT_SYNC_CONTENT.loginMessage}
                </p>

                <div className="pt-4">
                    <button
                        onClick={handleLogin}
                        disabled={loginLoading}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loginLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <span>🔑</span>
                                <span>{EXT_SYNC_CONTENT.buttonText}</span>
                            </>
                        )}
                    </button>
                </div>
                
                <p className="text-[10px] text-slate-500">
                    ※ ログイン後、拡張機能から送信された課題が自動的にSyncScaleにインポートされます。
                </p>
            </div>
        </div>
    );
}
