import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth, googleProvider } from "../lib/firebase";

// Contextの作成
const AuthContext = createContext();

// プロバイダーコンポーネント: アプリ全体を囲み、ログイン状態を提供する
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 初回マウント時にFirebase Authの状態変更を監視する
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        // アンマウント時にリスナーを解除
        return unsubscribe;
    }, []);

    // Googleアカウントでログイン
    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("ログインエラー:", error);
            toast.error("ログインに失敗しました。", {
                description: `エラーコード: ${error.code}\nメッセージ: ${error.message}`
            });
            throw error;
        }
    };

    // ログアウト処理
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("ログアウトエラー:", error);
            toast.error("ログアウトに失敗しました。");
        }
    };

    // コンテキスト経由で提供する値
    // loading も公開する（RootRedirect / ConsentGuard / ExtSyncPage が
    // `loading: authLoading` で参照しているため、API と利用側を一致させる）
    const value = {
        currentUser,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// カスタムフック: 任意のコンポーネントで手軽にコンテキストを利用可能にする
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
