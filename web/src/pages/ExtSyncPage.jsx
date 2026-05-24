import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { EXT_SYNC_CONTENT } from "../config/content";

export function ExtSyncPage() {
    const { currentUser, login, loading: authLoading } = useAuth();
    const { hasConsented, loading: consentLoading } = useConsent();
    const [loginLoading, setLoginLoading] = useState(false);
    const navigate = useNavigate();

    // 拡張機能からの postMessage を待機する
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === "SYNC_SCALE_IMPORT_TASKS") {
                console.log("拡張機能からタスクデータを受信:", event.data.tasks);
                sessionStorage.setItem("pendingImportTasks", JSON.stringify(event.data.tasks));
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // ログイン状態と同意状態の変化に応じてリダイレクト
    useEffect(() => {
        if (!authLoading && !consentLoading) {
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
    }, [currentUser, hasConsented, authLoading, consentLoading, navigate]);

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

    if (authLoading || consentLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-slate-100 font-sans">
            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="inline-flex items-center justify-center p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20 mb-2">
                    <span className="text-4xl">🔌</span>
                </div>
                
                <h1 className="text-xl md:text-2xl font-black text-white">
                    {EXT_SYNC_CONTENT.title}
                </h1>
                
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                    {EXT_SYNC_CONTENT.loginMessage}
                </p>

                <div className="pt-4">
                    <button
                        onClick={handleLogin}
                        disabled={loginLoading}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
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
