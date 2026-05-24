import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";

export function LoginPage() {
    const { currentUser, login, loading: authLoading } = useAuth();
    const { hasConsented, loading: consentLoading } = useConsent();
    const [loginLoading, setLoginLoading] = useState(false);
    const navigate = useNavigate();

    // ログイン済みの場合のリダイレクト判定
    useEffect(() => {
        if (!authLoading && !consentLoading && currentUser) {
            // ログイン後はルート / にリダイレクトすることで RootRedirect に委ねる
            navigate("/", { replace: true });
        }
    }, [currentUser, authLoading, consentLoading, navigate]);

    const handleLogin = async () => {
        setLoginLoading(true);
        try {
            await login();
        } catch (error) {
            console.error("再ログインエラー:", error);
        } finally {
            setLoginLoading(false);
        }
    };

    if (authLoading || consentLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800 transition-colors duration-200">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-6 text-slate-800 font-sans transition-colors duration-200">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-2">
                    <span className="text-4xl">🔐</span>
                </div>
                
                <h1 className="text-xl md:text-2xl font-black text-slate-900">
                    SyncScale
                </h1>
                
                <p className="text-slate-600 text-sm leading-relaxed px-4">
                    本サービスを利用するにはログインが必要です。
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
                                <span>Googleでログイン</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
