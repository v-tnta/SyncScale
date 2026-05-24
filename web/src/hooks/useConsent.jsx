import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, deleteField, serverTimestamp, collection, query, where, getDocs, writeBatch, onSnapshot } from "firebase/firestore";
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

        const docRef = doc(db, "consents", currentUser.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setConsent(docSnap.data());
            } else {
                setConsent(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("同意情報の監視に失敗しました:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 同意を記録する
    const recordConsent = async (uidToUse) => {
        const uid = uidToUse || (currentUser ? currentUser.uid : null);
        if (!uid) return;
        const docRef = doc(db, "consents", uid);
        
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
            
            // onSnapshotの初回発火までの隙間を埋めるため、手動でもstateを更新
            const updatedSnap = await getDoc(docRef);
            setConsent(updatedSnap.data());
            
            // UID変更による同期リセットで上書きされないよう、lastUidも更新
            setLastUid(uid);
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
            const batch = writeBatch(db);
            
            // 1. 関連データを取得 (この時点では同意状態なので読み取り可能)
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

            // 2. consents/{userId} に withdrawnAt を記録（研究記録として残す）
            batch.update(docRef, {
                withdrawnAt: serverTimestamp()
            });

            // 3. バッチをコミットして全データを一度に削除・更新
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
