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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !hasConsented) {
            setOnboarding(null);
            setLoading(false);
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

    // チュートリアルの再実行（step3を未完了にし、全体完了も一時的にfalseにする）
    const resetTutorial = async () => {
        if (!currentUser || !hasConsented) return;
        const docRef = doc(db, "onboarding", currentUser.uid);
        
        const nextOnboarding = {
            ...onboarding,
            step3: false,
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

    const value = {
        onboarding,
        loading,
        completeStep,
        resetTutorial
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
