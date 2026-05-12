import { useState, useEffect } from 'react';
import * as timeLogService from '../services/timeLogService';
import { useAuth } from './useAuth';

/**
 * タイムログ（実績時間）を管理するカスタムフック
 */
export const useTimeLogs = () => {
    const { currentUser } = useAuth();
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ログ履歴を監視
    useEffect(() => {
        if (!currentUser) {
            setTimeLogs([]);
            setError(null); // エラー情報をクリア
            setLoading(false);
            return;
        }

        // 新しいユーザーでの監視開始時は初期化
        setLoading(true);
        setError(null);

        const unsubscribe = timeLogService.subscribeToTimeLogs(
            currentUser.uid,
            (logs) => {
                setTimeLogs(logs);
                setLoading(false);
                setError(null); // 成功した場合はエラーを確実に消す
            },
            (err) => {
                console.error("TimeLogs Error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    /**
     * 作業完了時にログを保存
     */
    const addTimeLog = async (log) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await timeLogService.addTimeLog(currentUser.uid, log);
            console.log("TimeLog added successfully");
        } catch (err) {
            console.error("Failed to add TimeLog:", err);
            setError(err);
            alert("ログの保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return {
        timeLogs,
        addTimeLog,
        loading,
        error
    };
};
