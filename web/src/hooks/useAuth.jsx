import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
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
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("ログインエラー:", error);
            alert(`ログインに失敗しました。\nエラーコード: ${error.code}\nメッセージ: ${error.message}`);
            throw error;
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
