import { useState } from 'react';
import * as conditionLogService from '../services/conditionLogService';
import { useAuth } from './useAuth';
import { useActivityLog } from './useActivityLog';

export const useConditionLogs = () => {
    const { currentUser } = useAuth();
    const { logEvent } = useActivityLog();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        addLog,
        getLogsByTask,
        loading,
        error
    };
};
