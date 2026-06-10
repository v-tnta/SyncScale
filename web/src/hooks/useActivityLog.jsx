import { useCallback, useEffect } from 'react';
import * as activityLogService from '../services/activityLogService';
import { useAuth } from './useAuth';
import { useConsent } from './useConsent';

// ページロードごとに1回だけ session_start を記録するためのフラグ。
// モジュール変数なので、StrictModeの再マウントやコンポーネントの再描画でも二重記録されない
let sessionStartLogged = false;

/**
 * 行動ログ記録用のカスタムフック
 *
 * - 未ログイン or 未同意（同意書バージョン不一致を含む）の間は何も記録しない
 * - 記録の失敗がアプリの動作を妨げないよう、fire-and-forget で書き込む（await しない・throw しない）
 */
export const useActivityLog = () => {
    const { currentUser } = useAuth();
    const { hasConsented } = useConsent();

    const logEvent = useCallback((eventName, params = {}) => {
        if (!currentUser || !hasConsented) return;
        activityLogService.addActivityLog(currentUser.uid, eventName, params)
            .catch((err) => console.warn(`ActivityLog Error (${eventName}):`, err));
    }, [currentUser, hasConsented]);

    return { logEvent };
};

/**
 * セッション開始（アプリを開いた）を記録するフック。
 * App 直下で1回だけ呼び出すこと。
 *
 * Firebase Auth はセッションを永続化するため「ログインイベント」はほぼ発生しない。
 * そのため利用状況の把握には、ページロードごとの session_start を記録する。
 */
export const useSessionTracking = () => {
    const { currentUser } = useAuth();
    const { hasConsented } = useConsent();

    useEffect(() => {
        if (currentUser && hasConsented && !sessionStartLogged) {
            sessionStartLogged = true;
            activityLogService.addActivityLog(currentUser.uid, 'session_start', {})
                .catch((err) => console.warn('ActivityLog Error (session_start):', err));
        }
    }, [currentUser, hasConsented]);
};
