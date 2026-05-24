import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useConsent } from "./hooks/useConsent";
import { useOnboarding } from "./hooks/useOnboarding";
import { AgreementPage } from "./pages/AgreementPage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { ExtSyncPage } from "./pages/ExtSyncPage";
import { LoginPage } from "./pages/LoginPage";
import { ConsentGuard } from "./guards/ConsentGuard";
import { InfoPage } from "./pages/InfoPage";
import { HomePage } from "./pages/HomePage";

// ルートパス / にアクセスした際のリダイレクト先を判定するコンポーネント
export function RootRedirect() {
    const { currentUser, loading: authLoading } = useAuth();
    const { hasConsented, loading: consentLoading } = useConsent();
    const { onboarding, loading: onboardingLoading } = useOnboarding();

    if (authLoading || consentLoading || onboardingLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!currentUser || !hasConsented) {
        return <Navigate to="/agreement" replace />;
    }

    if (onboarding && !onboarding.step3) {
        return <Navigate to="/info" replace />;
    }

    return <Navigate to="/svc/home" replace />;
}

export function AppRouter() {
    return (
        <Routes>
            {/* 公開ルート */}
            <Route path="/agreement" element={<AgreementPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/svc/ext-sync" element={<ExtSyncPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* 同意済みかつログイン済みで保護されたルート */}
            <Route element={<ConsentGuard />}>
                <Route path="/info" element={<InfoPage />} />
                <Route path="/svc/home" element={<HomePage />} />
            </Route>
            
            {/* ルートおよびデフォルトのリダイレクト */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
