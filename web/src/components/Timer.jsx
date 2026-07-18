import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { useActivityLog } from '../hooks/useActivityLog'
import { Modal } from './Modal'
import { TIMER } from '../content'

const RING_SIZE = 148;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * 円形プログレスタイマー表示。
 * ストップウォッチ（上限なしのカウントアップ）のため「進捗」の概念がなく、
 * アナログ時計の秒針のように「直近1分」を1周として繰り返しスイープさせることで
 * 時間が流れていることを視覚的に伝える。1秒ごとの状態更新をCSSトランジションで
 * 滑らかに補間することで、見た目上は連続的に動いているように見せている。
 */
const TimerRing = ({ seconds, isActive, children }) => {
    const progress = (seconds % 60) / 60;
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

    return (
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    className="stroke-gray-100"
                />
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${
                        isActive ? 'stroke-blue-600' : 'stroke-gray-300'
                    }`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

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
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full mt-2 justify-center">
            {/* 左端：タブ切り替え */}
            <div className="flex flex-col gap-2 shrink-0 w-full md:w-32">
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
                        {TIMER.tabRecord}
                    </button>
                    <button
                        id="tutorial-manual-tab"
                        onClick={() => setActiveTab('manual')}
                        disabled={isActive && activeTab !== 'manual'}
                        className={`flex-1 md:flex-none py-2 px-3 text-sm font-bold text-center rounded-lg border-2 transition-all ${
                            activeTab === 'manual'
                                ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
                                : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {TIMER.tabManual}
                    </button>
                </div>
            </div>

            {/* 右側：コンテンツエリア */}
            <div className="border border-gray-200 shadow-sm rounded-lg p-6 bg-white w-full max-w-xl min-h-[160px] flex flex-col justify-center min-h-[180px]">
                {activeTab === 'timer' ? (
                    <div className="flex flex-col gap-5 justify-center items-center">
                        <div className="flex items-center gap-4 w-full">
                            <span className="font-bold text-gray-700 whitespace-nowrap">{TIMER.todoLabel}</span>
                            <div className="flex-1 max-w-[280px]">
                                <input
                                    type="text"
                                    placeholder={TIMER.todoPlaceholder}
                                    className="w-full p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={subTaskName}
                                    onChange={(e) => setSubTaskName(e.target.value)}
                                    disabled={isActive || isConfirmModalOpen}
                                />
                            </div>
                        </div>

                        <TimerRing seconds={elapsedSeconds} isActive={isActive}>
                            <span className={`text-xl font-mono font-bold tracking-tight ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                                {formatTime(elapsedSeconds)}
                            </span>
                        </TimerRing>

                        <div className="flex justify-center gap-3">
                            {!isActive ? (
                                <>
                                    {elapsedSeconds > 0 && (
                                        <button
                                            onClick={handleRecordClick}
                                            className="bg-blue-600 text-white font-bold py-1.5 px-6 rounded-full hover:bg-blue-700 transition shadow-sm"
                                        >
                                            {TIMER.recordButton}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleStart}
                                        className="bg-green-500 text-white font-bold py-1.5 px-8 rounded-full hover:bg-green-600 transition shadow-sm"
                                    >
                                        {elapsedSeconds > 0 ? TIMER.restartButton : TIMER.startButton}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleRecordClick}
                                        className="bg-blue-600 text-white font-bold py-1.5 px-6 rounded-full hover:bg-blue-700 transition shadow-sm"
                                    >
                                        {TIMER.recordButton}
                                    </button>
                                    <button
                                        onClick={handlePause}
                                        className="bg-yellow-500 text-white font-bold py-1.5 px-8 rounded-full hover:bg-yellow-600 transition shadow-sm"
                                    >
                                        {TIMER.stopButton}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700 whitespace-nowrap">{TIMER.manualDoneLabel}</span>
                            <div className="flex-1 max-w-[200px]">
                                <input
                                    type="text"
                                    placeholder={TIMER.manualDonePlaceholder}
                                    className="w-full p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={manualData.subTaskName}
                                    onChange={(e) => setManualData({ ...manualData, subTaskName: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* 作業時間 + きろくボタンを同じ行に */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-700 whitespace-nowrap">{TIMER.workTimeLabel}</span>
                                <div id="tutorial-manual-duration" className="flex items-center gap-2 transition-all duration-300 rounded-lg p-1">
                                    <input
                                        type="number"
                                        placeholder={TIMER.durationPlaceholder}
                                        className="w-24 p-2 border-2 border-gray-300 rounded font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                                        value={manualData.durationMinutes}
                                        onChange={(e) => setManualData({ ...manualData, durationMinutes: e.target.value })}
                                    />
                                    <span className="font-bold text-gray-600">{TIMER.minuteUnit}</span>
                                </div>
                            </div>
                            <button
                                id="tutorial-manual-save-button"
                                onClick={handleManualSave}
                                className="bg-blue-600 text-white font-bold py-2 px-8 rounded-full hover:bg-blue-700 transition shadow-sm"
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
                className="bg-white rounded-lg shadow-2xl p-6"
            >
                <h3 className="text-lg font-bold mb-2">{TIMER.subTaskModalTitle}</h3>
                <input
                    type="text"
                    className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500"
                    value={subTaskName}
                    onChange={(e) => setSubTaskName(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-500 px-4">{TIMER.subTaskModalCancel}</button>
                    <button onClick={handleConfirmSave} className="bg-blue-600 text-white px-4 py-2 rounded">{TIMER.subTaskModalSave}</button>
                </div>
            </Modal>
        </div>
    )
}

export default Timer
