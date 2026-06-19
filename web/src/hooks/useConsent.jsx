import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, deleteField, arrayUnion, serverTimestamp, collection, query, where, getDocs, writeBatch, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { AGREEMENT_CONTENT } from "../content";

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
            if (docSnap.exists()) {
                // 再同意（撤回後の復帰、または同意書バージョン更新後の再同意）
                const prev = docSnap.data();
                const updates = {
                    agreedAt: serverTimestamp(),
                    version: AGREEMENT_CONTENT.version,
                    withdrawnAt: deleteField()
                };
                // 旧バージョンへの同意記録は研究記録として履歴に残す
                if (prev.version !== AGREEMENT_CONTENT.version && prev.agreedAt) {
                    updates.previousConsents = arrayUnion({
                        version: prev.version,
                        agreedAt: prev.agreedAt
                    });
                }
                await updateDoc(docRef, updates);
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

    // Firestoreのバッチは1コミット500操作まで。上限を超えても削除が失敗しないよう、
    // 余裕を持たせたサイズに分割（チャンク）して順次コミットする
    const BATCH_CHUNK_SIZE = 450;
    const deleteRefsInChunks = async (refs) => {
        for (let i = 0; i < refs.length; i += BATCH_CHUNK_SIZE) {
            const batch = writeBatch(db);
            refs.slice(i, i + BATCH_CHUNK_SIZE).forEach((ref) => batch.delete(ref));
            await batch.commit();
        }
    };

    // 同意を撤回する
    const withdrawConsent = async () => {
        if (!currentUser) return;
        const userId = currentUser.uid;
        const docRef = doc(db, "consents", userId);

        try {
            // 1. 削除対象の参照をすべて収集 (この時点では同意状態なので読み取り可能)
            const refsToDelete = [];
            const collections = ["tasks", "timeLogs", "conditionLogs", "activityLogs"];
            for (const name of collections) {
                const snap = await getDocs(query(collection(db, name), where("userId", "==", userId)));
                snap.forEach((doc) => refsToDelete.push(doc.ref));
            }

            const onboardingRef = doc(db, "onboarding", userId);
            const onboardingSnap = await getDoc(onboardingRef);
            if (onboardingSnap.exists()) {
                refsToDelete.push(onboardingRef);
            }

            const userSettingsRef = doc(db, "userSettings", userId);
            const userSettingsSnap = await getDoc(userSettingsRef);
            if (userSettingsSnap.exists()) {
                refsToDelete.push(userSettingsRef);
            }

            // 2. チャンク分割しながら全データを削除
            await deleteRefsInChunks(refsToDelete);

            // 3. 最後に consents/{userId} に withdrawnAt を記録（研究記録として残す）
            await updateDoc(docRef, {
                withdrawnAt: serverTimestamp()
            });

            setConsent(prev => ({ ...prev, withdrawnAt: new Date() }));
        } catch (error) {
            console.error("同意の撤回に失敗しました:", error);
            throw error;
        }
    };

    // 同意済み かつ 撤回していない かつ 現行バージョンの同意書に同意している
    // （同意書が改訂された場合、既存ユーザーは再同意するまで未同意扱いになる）
    const hasConsented = consent !== null && !consent.withdrawnAt && consent.version === AGREEMENT_CONTENT.version;

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
