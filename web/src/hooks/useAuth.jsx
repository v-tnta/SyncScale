import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, googleProvider, signInAnonymously, linkWithPopup, db } from "../lib/firebase";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { ConfirmModal } from "../components/ConfirmModal";

// Contextの作成
const AuthContext = createContext();

// プロバイダーコンポーネント: アプリ全体を囲み、ログイン状態を提供する
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingCredential, setPendingCredential] = useState(null); // マージ確認用のクレデンシャル保持

    // 初回マウント時にFirebase Authの状態変更を監視する
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // すでにログインしている（または匿名ログイン中）
                setCurrentUser(user);
                setLoading(false);
            } else {
                // 未ログインの場合、自動的に匿名ログインを実行する
                setLoading(true);
                setCurrentUser(null);
                try {
                    // コンソール等で設定忘れがあるとエラーになるが、そのまま投げる
                    await signInAnonymously(auth);
                    // signInAnonymouslyが成功すると、再びonAuthStateChangedが発火するのでここは待つだけでよい
                } catch (error) {
                    console.error("匿名ログインに失敗しました:", error);
                    // UI側でエラーハンドリングできるようにするためローディングは解除
                    setLoading(false);
                }
            }
        });
        // アンマウント時にリスナーを解除
        return unsubscribe;
    }, []);

    // Googleアカウントでログイン（または匿名ユーザーからの昇格）
    const login = async () => {
        try {
            if (currentUser && currentUser.isAnonymous) {
                // 匿名で作成したデータを消さずに、Googleアカウントに紐付ける (Account Linking)
                const result = await linkWithPopup(currentUser, googleProvider);
                console.log("匿名アカウントと連携成功:", result.user);
            } else {
                // 完全に未ログインか、通常のログイン画面を開く
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error) {
            console.error("ログイン/連携エラー:", error);

            if (error.code === 'auth/credential-already-in-use') {
                const credential = GoogleAuthProvider.credentialFromError(error);
                if (credential) {
                    // ▼ 現在の匿名ユーザーにデータが存在するかチェックする ▼
                    const anonymousUid = currentUser.uid;
                    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', anonymousUid));
                    const logsQuery = query(collection(db, 'timeLogs'), where('userId', '==', anonymousUid));

                    const [tasksSnap, logsSnap] = await Promise.all([
                        getDocs(tasksQuery),
                        getDocs(logsQuery)
                    ]);

                    const hasData = !tasksSnap.empty || !logsSnap.empty;

                    if (hasData) {
                        // データがある場合のみ、統合確認モーダルを表示する
                        setPendingCredential(credential);
                    } else {
                        // データがない場合はモーダルを出さずにそのままログイン処理を完了する
                        await signInWithCredential(auth, credential);
                    }
                }
            } else {
                alert(`ログイン・連携に失敗しました。\nエラーコード: ${error.code}\nメッセージ: ${error.message}`);
            }
        }
    };

    // マージするかどうかの選択肢を受け取る処理（モーダルから呼ばれる）
    const handleMergeChoice = async (shouldMerge) => {
        if (!pendingCredential) return;
        const credential = pendingCredential;
        setPendingCredential(null); // モーダルを閉じる

        try {
            if (shouldMerge) {
                // ▼ マージする場合の処理 ▼
                // 【重要】ログイン前（匿名状態）の権限でデータをすべて読み込み、メモリに保存する
                const anonymousUid = currentUser.uid;

                // Tasksのバックアップ
                const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', anonymousUid));
                const tasksSnap = await getDocs(tasksQuery);
                const tempTasks = tasksSnap.docs.map(doc => ({ oldId: doc.id, data: doc.data() }));

                // TimeLogsのバックアップ
                const logsQuery = query(collection(db, 'timeLogs'), where('userId', '==', anonymousUid));
                const logsSnap = await getDocs(logsQuery);
                const tempLogs = logsSnap.docs.map(doc => ({ oldId: doc.id, data: doc.data() }));

                // 既存のGoogleアカウントでログインし直す（ここで currentUser の uid が切り替わる）
                const result = await signInWithCredential(auth, credential);
                const newUid = result.user.uid;

                // 新しいアカウント権限でデータを作り直す（新規作成扱いになるため、ルール違反にならない）
                const taskIdMap = {}; // oldTaskId -> newTaskId の対応表

                // 1. Taskを新しく保存し、新しいIDを記録
                for (const item of tempTasks) {
                    const taskData = { ...item.data, userId: newUid };
                    const docRef = await addDoc(collection(db, 'tasks'), taskData);
                    taskIdMap[item.oldId] = docRef.id;
                }

                // 2. TimeLogを新しく保存（Taskに紐付いている場合は、上で割り当てられた新しいTaskIdを使用する）
                for (const item of tempLogs) {
                    const logData = { ...item.data, userId: newUid };
                    if (logData.taskId && taskIdMap[logData.taskId]) {
                        logData.taskId = taskIdMap[logData.taskId]; // 旧IDを新IDへ置換
                    }
                    await addDoc(collection(db, 'timeLogs'), logData);
                }

                alert("データの引き継ぎが完了しました！");
            } else {
                // ▼ マージしない（破棄してログインする）場合の処理 ▼
                await signInWithCredential(auth, credential);
            }
        } catch (mergeError) {
            console.error("データ引継ぎエラー:", mergeError);
            alert(`データの引き継ぎに失敗しました。\nエラー内容: ${mergeError.message}`);
        }
    };

    // ログアウト処理
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("ログアウトエラー:", error);
            alert("ログアウトに失敗しました。");
        }
    };

    // コンテキスト経由で提供する値
    const value = {
        currentUser,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {/* データ引き継ぎ確認用のカスタムモーダル */}
            <ConfirmModal
                isOpen={!!pendingCredential}
                title="アカウントデータの統合"
                confirmText="データを統合する"
                cancelText="破棄してログイン"
                onConfirm={() => handleMergeChoice(true)}
                onCancel={() => handleMergeChoice(false)}
            >
                このGoogleアカウントは既に利用されています。<br /><br />
                ログイン前に作成した現在のデータを、既存のGoogleアカウントへ<strong>引き継ぎ（結合）</strong>しますか？<br /><br />
                <span className="text-red-500 font-medium text-xs">※「破棄してログイン」を選ぶと、現在画面上にある一時的なデータは失われます。</span>
            </ConfirmModal>
        </AuthContext.Provider>
    );
}

// カスタムフック: 任意のコンポーネントで手軽にコンテキストを利用可能にする
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
