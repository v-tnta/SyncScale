import { useState, useEffect } from 'react';
import * as conditionLogService from '../services/conditionLogService';
import { useAuth } from './useAuth';
import { useActivityLog } from './useActivityLog';

/**
 * コンディションログ用フック。
 * @param {Object} [options]
 * @param {boolean} [options.subscribe=false] true のとき全コンディションログをリアルタイム購読する（分析タブ用）。
 *   単一タスクの取得（getLogsByTask）のみ使う画面では false のままにして余計な購読を作らない。
 */
export const useConditionLogs = ({ subscribe = false } = {}) => {
    const { currentUser } = useAuth();
    const { logEvent } = useActivityLog();
    const [conditionLogs, setConditionLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 全コンディションログをリアルタイム監視（分析タブの集計用）
    useEffect(() => {
        if (!subscribe || !currentUser) {
            setConditionLogs([]);
            setError(null);
            return;
        }

        const unsubscribe = conditionLogService.subscribeToConditionLogs(
            currentUser.uid,
            (logs) => {
                setConditionLogs(logs);
                setError(null);
            },
            (err) => {
                console.error("ConditionLogs Subscribe Error:", err);
                setError(err);
            }
        );

        return () => unsubscribe();
    }, [currentUser, subscribe]);

    const addLog = async (taskId, logData) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            await conditionLogService.addConditionLog(currentUser.uid, taskId, logData);
            logEvent('condition_submit', {
                taskId,
                condition: logData.condition
            });
        } catch (err) {
            console.error("Condition Log Add Error:", err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getLogsByTask = async (taskId) => {
        if (!currentUser) return [];
        setLoading(true);
        try {
            const logs = await conditionLogService.getConditionLogsByTask(currentUser.uid, taskId);
            return logs;
        } catch (err) {
            console.error("Condition Log Fetch Error:", err);
            setError(err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        conditionLogs,
        addLog,
        getLogsByTask,
        loading,
        error
    };
};
