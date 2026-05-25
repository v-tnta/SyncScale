import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConsent } from "../hooks/useConsent";
import { useOnboarding } from "../hooks/useOnboarding";

export function ConsentGuard() {
    const { currentUser, loading: authLoading } = useAuth();
    const { hasConsented, loading: consentLoading } = useConsent();
    const { onboarding, loading: onboardingLoading } = useOnboarding();
    const location = useLocation();

    if (authLoading || consentLoading || onboardingLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!currentUser) {
        // 未ログインならログインページへ
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!hasConsented) {
        // ログイン済み・未同意なら同意書へ
        return <Navigate to="/agreement" replace state={{ from: location }} />;
    }

    // オンボーディング（拡張機能まで）未完了の状態で /svc/home にアクセスしようとしたら /onboarding にリダイレクト
    if (location.pathname === "/svc/home" && onboarding && !onboarding.step3) {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
}
