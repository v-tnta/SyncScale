import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { useConsent } from "./useConsent";

const OnboardingContext = createContext();

const initialOnboardingState = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    completed: false
};

export function OnboardingProvider({ children }) {
    const { currentUser } = useAuth();
    const { hasConsented } = useConsent();
    const [onboarding, setOnboarding] = useState(null);
    const [userSettings, setUserSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUidAndConsent, setLastUidAndConsent] = useState({ uid: undefined, consented: undefined });

    // ログインユーザーまたは同意ステータスが変更されたら同期的に状態をリセット
    const currentUid = currentUser ? currentUser.uid : null;
    if (currentUid !== lastUidAndConsent.uid || hasConsented !== lastUidAndConsent.consented) {
        setLastUidAndConsent({ uid: currentUid, consented: hasConsented });
        setOnboarding(null);
        setUserSettings(null);
        setLoading(Boolean(currentUid && hasConsented));
    }

    useEffect(() => {
        if (!currentUser || !hasConsented) {
            return;
        }

        const fetchOnboarding = async () => {
            try {
                const docRef = doc(db, "onboarding", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOnboarding(docSnap.data());
                } else {
                    // ドキュメントが存在しない場合はデフォルト値を設定
                    setOnboarding(initialOnboardingState);
                }

                // ユーザー設定（モバイルプロモ非表示など）は別ドキュメントに分離
                const settingsRef = doc(db, "userSettings", currentUser.uid);
                const settingsSnap = await getDoc(settingsRef);
                setUserSettings(settingsSnap.exists() ? settingsSnap.data() : {});
            } catch (error) {
                console.error("オンボーディング進捗の取得に失敗しました:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnboarding();
    }, [currentUser, hasConsented]);

    const completeStep = async (stepNumber) => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "onboarding", currentUser.uid);
        const stepKey = `step${stepNumber}`;

        const nextOnboarding = { ...onboarding, [stepKey]: true };
        
        // 全ステップ完了判定（1〜4がすべて完了したら全体完了とする）
        if (nextOnboarding.step1 && nextOnboarding.step2 && nextOnboarding.step3 && nextOnboarding.step4) {
            nextOnboarding.completed = true;
            nextOnboarding.completedAt = serverTimestamp();
        }

        try {
            await setDoc(docRef, nextOnboarding, { merge: true });
            
            // 最新の状態を取得して更新
            const updatedSnap = await getDoc(docRef);
            setOnboarding(updatedSnap.data());
        } catch (error) {
            console.error(`ステップ ${stepNumber} の完了保存に失敗しました:`, error);
            throw error;
        }
    };

    // チュートリアルの再実行（step4を未完了にし、全体完了も一時的にfalseにする）
    const resetTutorial = async () => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "onboarding", currentUser.uid);
        
        const nextOnboarding = {
            ...onboarding,
            step4: false,
            completed: false
        };

        try {
            await setDoc(docRef, nextOnboarding, { merge: true });
            setOnboarding(nextOnboarding);
        } catch (error) {
            console.error("チュートリアルのリセットに失敗しました:", error);
            throw error;
        }
    };

    // モバイルアプリ案内の「あとで通知する」処理（userSettings ドキュメントに保存）
    const dismissMobilePromo = async () => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "userSettings", currentUser.uid);

        try {
            await setDoc(docRef, { mobilePromoDismissedAt: serverTimestamp() }, { merge: true });

            // 最新の状態を取得して更新
            const updatedSnap = await getDoc(docRef);
            setUserSettings(updatedSnap.data());
        } catch (error) {
            console.error("モバイルプロモの非表示処理に失敗しました:", error);
            throw error;
        }
    };

    // 締切前通知の設定を更新する（userSettings ドキュメントに保存）。
    // 実際の通知配信はスマホアプリのローカル通知のみ。Web は設定値の保存のみ行う。
    const updateNotificationSettings = async ({ enabled, minutesBefore } = {}) => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "userSettings", currentUser.uid);

        const data = {};
        if (typeof enabled === "boolean") data.notificationEnabled = enabled;
        if (typeof minutesBefore === "number") data.notificationMinutesBefore = minutesBefore;
        if (Object.keys(data).length === 0) return;

        try {
            await setDoc(docRef, data, { merge: true });
            const updatedSnap = await getDoc(docRef);
            setUserSettings(updatedSnap.data());
        } catch (error) {
            console.error("通知設定の保存に失敗しました:", error);
            throw error;
        }
    };

    // 拡張機能ガイドを表示したことを記録する
    const viewExtensionGuide = async () => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "onboarding", currentUser.uid);
        
        try {
            await setDoc(docRef, { extensionGuideViewed: true }, { merge: true });
            
            // 最新の状態を取得して更新
            const updatedSnap = await getDoc(docRef);
            setOnboarding(updatedSnap.data());
        } catch (error) {
            console.error("拡張機能ガイド既読処理に失敗しました:", error);
            throw error;
        }
    };

    const value = {
        onboarding,
        userSettings,
        loading,
        completeStep,
        resetTutorial,
        dismissMobilePromo,
        updateNotificationSettings,
        viewExtensionGuide
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    return useContext(OnboardingContext);
}
