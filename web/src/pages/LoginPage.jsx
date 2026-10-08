import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { APP_INFO } from "../constants/appInfo";
import logo from "../assets/logo.png";

// Googleカラーアイコン
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

export function LoginPage() {
    const { currentUser, login, loading: authLoading } = useAuth();
    const { loading: consentLoading } = useConsent();
    const [loginLoading, setLoginLoading] = useState(false);
    const navigate = useNavigate();

    // ログイン済みの場合のリダイレクト判定
    useEffect(() => {
        if (!authLoading && !consentLoading && currentUser) {
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
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
                <div className="flex flex-col items-center">
                    <img src={logo} alt="SyncScale Logo" className="w-20 h-20 object-contain mb-3" />
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                        {APP_INFO.NAME}
                    </h1>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        v{APP_INFO.VERSION}
                    </p>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed px-2">
                    SyncScaleをご利用いただくにはGoogleアカウントでのログインが必要です。
                </p>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleLogin}
                        disabled={loginLoading}
                        className="w-full py-3.5 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                        {loginLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                        ) : (
                            <>
                                <GoogleIcon />
                                <span>Googleでログイン</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
