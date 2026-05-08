import { useState, useEffect } from 'react';
import { fetchSubTaskSuggestions } from '../services/aiService';

// Viteの機能を使って、システムプロンプトのファイルの中身をテキストとしてインポートします
import systemPromptText from '../domain/system.GEMINI?raw';

// モジュールレベルでのキャッシュ保持（リロードされるまで有効）
// taskId -> { suggestions: string[], logsLength: number }
const predictionCache = {};

export const useAiPredictions = (activeTask, logs) => {
    // 候補の初期値はデフォルト3つ
    const [suggestions, setSuggestions] = useState(['作業', '調査', 'MTG']);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        if (!activeTask || !activeTask.id) return;

        // すでにこのタスクのキャッシュがあり、ログの数に変化がない場合はリクエストしない
        const currentLogsLength = logs ? logs.length : 0;
        const cached = predictionCache[activeTask.id];
        
        if (cached && cached.logsLength === currentLogsLength) {
            setSuggestions(cached.suggestions);
            return;
        }

        let isMounted = true;
        
        const getPredictions = async () => {
            setIsAiLoading(true);
            try {
                // 過去のログから、このタスクに関連するサブタスク名を抽出
                const relatedLogs = logs ? logs.filter(log => log.taskId === activeTask.id) : [];
                const pastSubTasks = relatedLogs.map(l => l.subTaskName).filter(Boolean);
                
                // API通信
                const newSuggestions = await fetchSubTaskSuggestions(
                    activeTask.title,
                    pastSubTasks,
                    systemPromptText
                );
                
                if (isMounted && newSuggestions && newSuggestions.length > 0) {
                    setSuggestions(newSuggestions);
                    // キャッシュを更新
                    predictionCache[activeTask.id] = {
                        suggestions: newSuggestions,
                        logsLength: currentLogsLength
                    };
                }
            } catch (error) {
                console.error("AI予測の取得に失敗しました:", error);
            } finally {
                if (isMounted) {
                    setIsAiLoading(false);
                }
            }
        };

        getPredictions();

        return () => {
            isMounted = false;
        };
    }, [activeTask?.id, logs?.length]);

    return { suggestions, isAiLoading };
};
