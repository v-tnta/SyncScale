import React, { useState, useEffect, useRef } from 'react'
import { useTimeLogs } from '../hooks/useTimeLogs'

/**
 * Timerコンポーネント (Inline版)
 * TaskOverlayのヘッダーなどに埋め込んで使用するタイマーボタン群。
 * タスクタイトルなどは親コンポーネント側で表示するため、ここでは操作系のみを表示します。
 */
const Timer = ({ activeTask, logs, onUpdateTask }) => {
    const { addTimeLog } = useTimeLogs();

    // タイマー用ステート
    const [subTaskName, setSubTaskName] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [accumulatedSeconds, setAccumulatedSeconds] = useState(0); // 一時停止までの累積時間
    const [startTime, setStartTime] = useState(null); // 現在のセッションの開始時刻

    // モーダル用ステート (内部)
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // データ一時保存用
    const [pendingLogData, setPendingLogData] = useState(null);
    const [manualData, setManualData] = useState({ durationMinutes: '', subTaskName: '' });

    const intervalRef = useRef(null);

    // activeTaskが変わったらリセット (TaskOverlayが開くたびにリセットされる想定だが念のため)
    useEffect(() => {
        if (activeTask) {
            setSubTaskName('');
            setIsActive(false);
            setElapsedSeconds(0);
            setAccumulatedSeconds(0);
            setStartTime(null);
        }
    }, [activeTask]);

    // タイマー計測ロジック
    useEffect(() => {
        if (isActive && startTime) {
            intervalRef.current = setInterval(() => {
                const now = new Date();
                const currentSessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                setElapsedSeconds(accumulatedSeconds + currentSessionSeconds);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, startTime, accumulatedSeconds]);

    // 開始（再開）ボタン
    const handleStart = () => {
        setStartTime(new Date());
        setIsActive(true);
    };

    // 一時停止ボタン
    const handlePause = () => {
        setIsActive(false);
        const now = new Date();
        const currentSessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const newAccumulated = accumulatedSeconds + currentSessionSeconds;

        setAccumulatedSeconds(newAccumulated);
        setElapsedSeconds(newAccumulated);
        setStartTime(null);
    };

    // きろく（保存）ボタン
    const handleRecordClick = async () => {
        const durationSeconds = elapsedSeconds;
        const endTime = new Date();
        const calculatedStartTime = new Date(endTime.getTime() - durationSeconds * 1000);

        const logData = {
            taskId: activeTask.id,
            subTaskName: subTaskName,
            startTime: calculatedStartTime,
            endTime: endTime,
            durationSeconds: durationSeconds
        };

        if (!subTaskName.trim()) {
            setPendingLogData(logData);
            setIsConfirmModalOpen(true);
        } else {
            await saveLog(logData);
        }
    };

    const saveLog = async (data) => {
        await addTimeLog(data);

        // Auto-Status Logic: TODO -> DOING
        if (activeTask && activeTask.status === 'TODO' && onUpdateTask) {
            await onUpdateTask(activeTask.id, { status: 'DOING' });
        }

        // リセット
        setElapsedSeconds(0);
        setAccumulatedSeconds(0);
        setStartTime(null);
        setIsActive(false);
        setSubTaskName('');
        setPendingLogData(null);
    };

    // サブタスク強制入力モーダルからの保存
    const handleConfirmSave = async () => {
        if (!subTaskName.trim()) {
            alert("作業内容を入力してください");
            return;
        }
        await saveLog({ ...pendingLogData, subTaskName: subTaskName });
        setIsConfirmModalOpen(false);
    };

    // 事後報告の保存
    const handleManualSave = async () => {
        if (!manualData.durationMinutes) {
            alert("時間を入力してください");
            return;
        }

        const durationSec = Number(manualData.durationMinutes) * 60;
        const end = new Date();
        const start = new Date(end.getTime() - durationSec * 1000);

        const log = {
            taskId: activeTask.id,
            subTaskName: manualData.subTaskName || '事後報告',
            startTime: start,
            endTime: end,
            durationSeconds: durationSec
        };

        await addTimeLog(log);

        if (activeTask && activeTask.status === 'TODO' && onUpdateTask) {
            await onUpdateTask(activeTask.id, { status: 'DOING' });
        }

        setIsManualModalOpen(false);
        setManualData({ durationMinutes: '', subTaskName: '' });
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (!activeTask) return null;
    
    // 完了済みタスクの場合は操作エリアを表示しない
    if (activeTask.status === 'DONE') return null;

    return (
        <div className="flex flex-wrap items-center w-full gap-4 md:gap-6">
            {/* 1. 左端：＋手動できろく（事後報告）ボタン */}
            <div className="flex-none">
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded border border-gray-300 whitespace-nowrap transition-all shadow-sm active:scale-95"
                    disabled={isActive}
                >
                    ＋手動できろく
                </button>
            </div>

            {/* 中央〜右：メイン操作エリア (作業内容・タイマー・操作ボタン) */}
            <div className="flex-1 flex flex-wrap items-center justify-start md:justify-center xl:justify-center gap-4 md:gap-8 min-w-0">
                {/* 2. サブタスク入力 */}
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="text"
                        placeholder="作業内容 (例: 資料作成)"
                        className="w-48 p-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={subTaskName}
                        onChange={(e) => setSubTaskName(e.target.value)}
                        disabled={isActive || isConfirmModalOpen}
                        autoFocus
                    />
                    {!isActive && subTaskName !== '' && (
                        <button
                            onClick={() => setSubTaskName('')}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="クリア"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* 3. タイマー表示 */}
                <div className={`text-2xl font-mono font-bold w-[120px] text-right ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                    {formatTime(elapsedSeconds)}
                </div>

                {/* 4. 操作ボタン */}
                <div className="flex gap-2 shrink-0">
                    {!isActive ? (
                        <>
                            <button
                                onClick={handleStart}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-6 rounded-full shadow text-sm transition transform hover:scale-105"
                            >
                                {elapsedSeconds > 0 ? '再開' : 'START'}
                            </button>
                            {elapsedSeconds > 0 && (
                                <button
                                    onClick={handleRecordClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-6 rounded-full shadow text-sm transition transform hover:scale-105"
                                >
                                    きろく
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handlePause}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 px-6 rounded-full shadow text-sm transition transform hover:scale-105"
                        >
                            STOP
                        </button>
                    )}
                </div>
            </div>

            {/* --- 内部モーダル: サブタスク入力確認 --- */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white p-6 rounded shadow-lg border border-gray-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">作業名を入力してください</h3>
                        <input
                            type="text"
                            className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500"
                            value={subTaskName}
                            onChange={(e) => setSubTaskName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-500 px-4">キャンセル</button>
                            <button onClick={handleConfirmSave} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 内部モーダル: 事後報告 --- */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-md" onClick={() => setIsManualModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">作業のきろく (事後報告)</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-1">タスク: {activeTask.title}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">作業内容</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="例: 昨日やった分"
                                    value={manualData.subTaskName}
                                    onChange={e => setManualData({ ...manualData, subTaskName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">作業時間 (分)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="60"
                                    value={manualData.durationMinutes}
                                    onChange={e => setManualData({ ...manualData, durationMinutes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">キャンセル</button>
                            <button onClick={handleManualSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">報告する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Timer
