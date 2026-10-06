import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { useActivityLog } from '../hooks/useActivityLog'
import { Modal } from './Modal'
import { TIMER } from '../content'

/**
 * Timerコンポーネント (Inline版)
 * TaskOverlayのヘッダーなどに埋め込んで使用するタイマーボタン群。
 * タスクタイトルなどは親コンポーネント側で表示するため、ここでは操作系のみを表示します。
 */
const Timer = ({ activeTask, logs, onUpdateTask }) => {
    const { addTimeLog } = useTimeLogs();
    const { logEvent } = useActivityLog();

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

    // activeTaskが変わったらリセット (TaskOverlayが開くたびにリセットされる想定だが念のため)。
    // activeTask はFirestoreスナップショットのたびに新しいオブジェクトになるため、
    // オブジェクト参照ではなく id の変化のみを見る（そうしないと計測中に他の変更が
    // Firestoreに書き込まれるたびにタイマーがリセットされてしまう）。
    useEffect(() => {
        if (activeTask) {
            setSubTaskName('');
            setIsActive(false);
            setElapsedSeconds(0);
            setAccumulatedSeconds(0);
            setStartTime(null);
        }
    }, [activeTask?.id]);

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
    const handleStart = async () => {
        const now = new Date();
        // 累積0からの開始のみを「タイマー開始」として記録（一時停止からの再開は除外）
        if (accumulatedSeconds === 0) {
            logEvent('timer_start', { taskId: activeTask.id });
        }
        setStartTime(now);
        setIsActive(true);

        // タイマー開始時に、タスクのステータスが TODO であれば DOING に変更する
        if (activeTask && activeTask.status === 'TODO' && onUpdateTask) {
            await onUpdateTask(activeTask.id, {
                status: 'DOING',
                updatedAt: now
            });
        }
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
        await addTimeLog(data, { method: 'timer' });

        // Auto-Status Logic & startedAt recording
        if (activeTask && onUpdateTask) {
            const updates = {};
            if (activeTask.status === 'TODO') {
                updates.status = 'DOING';
            }
            if (!activeTask.startedAt) {
                updates.startedAt = data.startTime; // 初めて記録された日時の開始時刻
            }
            if (Object.keys(updates).length > 0) {
                await onUpdateTask(activeTask.id, {
                    ...updates,
                    updatedAt: new Date()
                });
            }
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
            toast.warning(TIMER.subTaskRequiredAlert);
            return;
        }
        await saveLog({ ...pendingLogData, subTaskName: subTaskName });
        setIsConfirmModalOpen(false);
    };

    // 事後報告の保存
    const handleManualSave = async () => {
        const minutes = Number(manualData.durationMinutes);
        if (!manualData.durationMinutes || !Number.isFinite(minutes)) {
            toast.warning(TIMER.durationRequiredAlert);
            return;
        }
        // 0以下・24時間超・小数は事後報告の実運用として不自然なため弾く
        // （負数は startTime > endTime の壊れたログを生み、極端に大きい値は
        // 週カレンダーの日付分割処理で無駄な繰り返しを引き起こすため）
        if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 24 * 60) {
            toast.warning(TIMER.durationInvalidAlert);
            return;
        }

        const durationSec = minutes * 60;
        const end = new Date();
        const start = new Date(end.getTime() - durationSec * 1000);

        const log = {
            taskId: activeTask.id,
            subTaskName: manualData.subTaskName || TIMER.manualDefaultSubTaskName,
            startTime: start,
            endTime: end,
            durationSeconds: durationSec
        };

        await addTimeLog(log, { method: 'manual' });

        // 事後報告の保存 & startedAt recording
        if (activeTask && onUpdateTask) {
            const updates = {};
            if (activeTask.status === 'TODO') {
                updates.status = 'DOING';
            }
            if (!activeTask.startedAt) {
                updates.startedAt = start; // 手動記録の開始時刻を startedAt にセット
            }
            if (Object.keys(updates).length > 0) {
                await onUpdateTask(activeTask.id, {
                    ...updates,
                    updatedAt: new Date()
                });
            }
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
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full mt-2 justify-center">
            {/* 左端：タブ切り替え */}
            <div className="flex flex-col gap-2 shrink-0 w-full md:w-32">
                <div className="flex md:flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('timer')}
                        disabled={isActive && activeTab !== 'timer'}
                        className={`flex-1 md:flex-none py-2 px-3 text-xs sm:text-sm font-bold text-center rounded-xl border-2 transition-all ${
                            activeTab === 'timer'
                                ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {TIMER.tabRecord}
                    </button>
                    <button
                        id="tutorial-manual-tab"
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        disabled={isActive && activeTab !== 'manual'}
                        className={`flex-1 md:flex-none py-2 px-3 text-xs sm:text-sm font-bold text-center rounded-xl border-2 transition-all ${
                            activeTab === 'manual'
                                ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {TIMER.tabManual}
                    </button>
                </div>
            </div>

            {/* 右側：コンテンツエリア */}
            <div className="border border-slate-200 dark:border-slate-750 shadow-xs rounded-2xl p-5 bg-white dark:bg-slate-850 w-full max-w-xl min-h-[170px] flex flex-col justify-center">
                {activeTab === 'timer' ? (
                    <div className="flex flex-col gap-5 justify-center">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{TIMER.todoLabel}</span>
                                <div className="flex-1 max-w-[220px]">
                                    <input
                                        type="text"
                                        placeholder={TIMER.todoPlaceholder}
                                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={subTaskName}
                                        onChange={(e) => setSubTaskName(e.target.value)}
                                        disabled={isActive || isConfirmModalOpen}
                                    />
                                </div>
                            </div>
                            <div className={`text-3xl sm:text-4xl font-mono font-black tracking-wider text-right ${isActive ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
                                {formatTime(elapsedSeconds)}
                            </div>
                        </div>

                        <div className="flex justify-center gap-3">
                            {!isActive ? (
                                <>
                                    {elapsedSeconds > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleRecordClick}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-xs text-xs sm:text-sm"
                                        >
                                            {TIMER.recordButton}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleStart}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-8 rounded-xl transition shadow-xs text-xs sm:text-sm"
                                    >
                                        {elapsedSeconds > 0 ? TIMER.restartButton : TIMER.startButton}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleRecordClick}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-xs text-xs sm:text-sm"
                                    >
                                        {TIMER.recordButton}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePause}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-8 rounded-xl transition shadow-xs text-xs sm:text-sm"
                                    >
                                        {TIMER.stopButton}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{TIMER.manualDoneLabel}</span>
                            <div className="flex-1 max-w-[220px]">
                                <input
                                    type="text"
                                    placeholder={TIMER.manualDonePlaceholder}
                                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={manualData.subTaskName}
                                    onChange={(e) => setManualData({ ...manualData, subTaskName: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* 作業時間 + きろくボタンを同じ行に */}
                        <div
                            id="tutorial-manual-record-row"
                            className="flex items-center justify-between gap-4 transition-all duration-300 rounded-xl p-1"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{TIMER.workTimeLabel}</span>
                                <div id="tutorial-manual-duration" className="flex items-center gap-1.5 transition-all duration-300 rounded-lg">
                                    <input
                                        type="number"
                                        placeholder={TIMER.durationPlaceholder}
                                        className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                                        value={manualData.durationMinutes}
                                        onChange={(e) => setManualData({ ...manualData, durationMinutes: e.target.value })}
                                    />
                                    <span className="font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-400">{TIMER.minuteUnit}</span>
                                </div>
                            </div>
                            <button
                                id="tutorial-manual-save-button"
                                type="button"
                                onClick={handleManualSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-xs text-xs sm:text-sm"
                            >
                                {TIMER.manualRecordButton}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- 内部モーダル: サブタスク入力確認 --- */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title={TIMER.subTaskModalTitle}
                maxWidth="max-w-sm"
                zIndex={70}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl p-6"
            >
                <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-slate-50">{TIMER.subTaskModalTitle}</h3>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    value={subTaskName}
                    onChange={(e) => setSubTaskName(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 text-xs font-bold rounded-xl transition">
                        {TIMER.subTaskModalCancel}
                    </button>
                    <button type="button" onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition">
                        {TIMER.subTaskModalSave}
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default Timer
