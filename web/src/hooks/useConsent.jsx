import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, deleteField, serverTimestamp, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { AGREEMENT_CONTENT } from "../config/content";

const ConsentContext = createContext();

export function ConsentProvider({ children }) {
    const { currentUser } = useAuth();
    const [consent, setConsent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUid, setLastUid] = useState(undefined);

    // ユーザーが変わったことを検出したら同期的に状態をリセット
    const currentUid = currentUser ? currentUser.uid : null;
    if (currentUid !== lastUid) {
        setLastUid(currentUid);
        if (currentUid) {
            setLoading(true);
            setConsent(null);
        } else {
            setLoading(false);
            setConsent(null);
        }
    }

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        const fetchConsent = async () => {
            try {
                const docRef = doc(db, "consents", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setConsent(docSnap.data());
                } else {
                    setConsent(null);
                }
            } catch (error) {
                console.error("同意情報の取得に失敗しました:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConsent();
    }, [currentUser]);

    // 同意を記録する
    const recordConsent = async () => {
        if (!currentUser) return;
        const docRef = doc(db, "consents", currentUser.uid);
        
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().withdrawnAt) {
                // 撤回済みの場合は、withdrawnAt フィールドを削除して再同意とする
                await updateDoc(docRef, {
                    withdrawnAt: deleteField()
                });
            } else {
                // 新規同意
                await setDoc(docRef, {
                    agreedAt: serverTimestamp(),
                    version: AGREEMENT_CONTENT.version
                });
            }
            
            // 最新の状態を取得
            const updatedSnap = await getDoc(docRef);
            setConsent(updatedSnap.data());
        } catch (error) {
            console.error("同意の記録に失敗しました:", error);
            throw error;
        }
    };

    // 同意を撤回する
    const withdrawConsent = async () => {
        if (!currentUser) return;
        const userId = currentUser.uid;
        const docRef = doc(db, "consents", userId);

        try {
            // 1. consents/{userId} に withdrawnAt を記録
            await updateDoc(docRef, {
                withdrawnAt: serverTimestamp()
            });

            // 2. ユーザーの全データを削除 (tasks, timeLogs, conditionLogs, onboarding)
            const batch = writeBatch(db);
            
            // tasks の削除
            const tasksSnap = await getDocs(query(collection(db, "tasks"), where("userId", "==", userId)));
            tasksSnap.forEach((doc) => batch.delete(doc.ref));

            // timeLogs の削除
            const timeLogsSnap = await getDocs(query(collection(db, "timeLogs"), where("userId", "==", userId)));
            timeLogsSnap.forEach((doc) => batch.delete(doc.ref));

            // conditionLogs の削除
            const conditionLogsSnap = await getDocs(query(collection(db, "conditionLogs"), where("userId", "==", userId)));
            conditionLogsSnap.forEach((doc) => batch.delete(doc.ref));

            // onboarding の削除
            const onboardingRef = doc(db, "onboarding", userId);
            const onboardingSnap = await getDoc(onboardingRef);
            if (onboardingSnap.exists()) {
                batch.delete(onboardingRef);
            }

            await batch.commit();
            setConsent(prev => ({ ...prev, withdrawnAt: new Date() }));
        } catch (error) {
            console.error("同意の撤回に失敗しました:", error);
            throw error;
        }
    };

    const hasConsented = consent !== null && !consent.withdrawnAt;

    const value = {
        consent,
        hasConsented,
        loading,
        recordConsent,
        withdrawConsent
    };

    return (
        <ConsentContext.Provider value={value}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    return useContext(ConsentContext);
}
