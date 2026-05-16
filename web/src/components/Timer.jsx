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

    // タブ切り替えステート (timer / manual)
    const [activeTab, setActiveTab] = useState('timer');

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
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full mt-2">
            {/* 左端：タブ切り替え */}
            <div className="flex flex-col gap-2 shrink-0 w-full md:w-32">
                <span className="text-sm font-bold text-gray-600 mb-1 text-center">とりかかる？</span>
                <div className="flex md:flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('timer')}
                        disabled={isActive && activeTab !== 'timer'}
                        className={`flex-1 md:flex-none py-2 px-3 text-sm font-bold text-center rounded-lg border-2 transition-all ${
                            activeTab === 'timer'
                                ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
                                : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        タイマー
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        disabled={isActive && activeTab !== 'manual'}
                        className={`flex-1 md:flex-none py-2 px-3 text-sm font-bold text-center rounded-lg border-2 transition-all ${
                            activeTab === 'manual'
                                ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
                                : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        手動できろく
                    </button>
                </div>
            </div>

            {/* 右側：コンテンツエリア */}
            <div className="border border-gray-200 shadow-sm rounded-lg p-6 bg-white w-full max-w-xl min-h-[160px] flex flex-col justify-center">
                {activeTab === 'timer' ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <span className="font-bold text-gray-700 whitespace-nowrap">やること</span>
                                <div className="flex-1 max-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="例: 資料作成"
                                        className="w-full p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={subTaskName}
                                        onChange={(e) => setSubTaskName(e.target.value)}
                                        disabled={isActive || isConfirmModalOpen}
                                    />
                                </div>
                            </div>
                            <div className={`text-4xl font-mono font-bold tracking-wider ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                                {formatTime(elapsedSeconds)}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            {!isActive ? (
                                <>
                                    {elapsedSeconds > 0 && (
                                        <button
                                            onClick={handleRecordClick}
                                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition shadow-sm"
                                        >
                                            きろく
                                        </button>
                                    )}
                                    <button
                                        onClick={handleStart}
                                        className="bg-green-500 text-white font-bold py-2 px-8 rounded-full hover:bg-green-600 transition shadow-sm"
                                    >
                                        {elapsedSeconds > 0 ? 'リスタート' : 'スタート'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleRecordClick}
                                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition shadow-sm"
                                    >
                                        きろく
                                    </button>
                                    <button
                                        onClick={handlePause}
                                        className="bg-yellow-500 text-white font-bold py-2 px-8 rounded-full hover:bg-yellow-600 transition shadow-sm"
                                    >
                                        ストップ
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700 whitespace-nowrap">やること</span>
                            <div className="flex-1 max-w-[200px]">
                                <input
                                    type="text"
                                    placeholder="例: 事後報告"
                                    className="w-full p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={manualData.subTaskName}
                                    onChange={(e) => setManualData({ ...manualData, subTaskName: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* 作業時間 + きろくボタンを同じ行に */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-700 whitespace-nowrap">作業時間</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="60"
                                        className="w-24 p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                                        value={manualData.durationMinutes}
                                        onChange={(e) => setManualData({ ...manualData, durationMinutes: e.target.value })}
                                    />
                                    <span className="font-bold text-gray-600">分</span>
                                </div>
                            </div>
                            <button
                                onClick={handleManualSave}
                                className="bg-blue-600 text-white font-bold py-2 px-8 rounded-full hover:bg-blue-700 transition shadow-sm"
                            >
                                きろく
                            </button>
                        </div>
                    </div>
                )}
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
        </div>
    )
}

export default Timer
