import React, { useState, useEffect } from 'react'
import GanttChart from './GanttChart'
import Timer from './Timer'
import SizeLabelSelector from './SizeLabelSelector'
import DateTimePicker from './DateTimePicker'
import { TASK_STATUS_LABELS } from '../domain/task'
import { useConditionLogs } from '../hooks/useConditionLogs'
import { TASK_OVERLAY } from '../content'

/**
 * TaskOverlay コンポーネント
 * タスクの詳細（分析とガントチャート）を表示するオーバーレイです。
 * タスクの編集・完了・物理削除機能も含みます。
 */
const TaskOverlay = ({ isOpen, onClose, task, logs, onUpdate, onDelete, onPhysicalDelete, onCompleteRequest, isTutorialActive, tutorialStep }) => {
    const { getLogsByTask } = useConditionLogs()
    const [conditionLog, setConditionLog] = useState(null)
    const [loadingCondition, setLoadingCondition] = useState(false)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', deadline: null, sizeLabel: 'M' });
    const [isChartExpanded, setIsChartExpanded] = useState(true); // 実績チャートの開閉状態

    // モーダルが開くたび、またはタスクが変わるたびにフォームを初期化
    useEffect(() => {
        if (task) {
            // 締切日の形式変換 (Dateオブジェクトへ)
            let formattedDeadline = null;
            if (task.deadline) {
                if (task.deadline.seconds) {
                    // Timestamp
                    formattedDeadline = new Date(task.deadline.seconds * 1000);
                } else if (task.deadline instanceof Date) {
                    // Date Object
                    formattedDeadline = task.deadline;
                } else {
                    // String ("YYYY-MM-DD" etc) or other
                    formattedDeadline = new Date(task.deadline);
                }
            }

            setEditForm({
                title: task.title,
                deadline: formattedDeadline,
                sizeLabel: task.sizeLabel || 'M'
            });
            setIsEditing(false); // モーダルを開いたときは閲覧モード

            // タスクが提出完了(DONE)ならコンディションをロードする
            if (task.status === 'DONE') {
                setLoadingCondition(true)
                getLogsByTask(task.id).then(cLogs => {
                    if (cLogs && cLogs.length > 0) {
                        setConditionLog(cLogs[0])
                    } else {
                        setConditionLog(null)
                    }
                    setLoadingCondition(false)
                }).catch(err => {
                    console.error("Failed to load condition log:", err)
                    setLoadingCondition(false)
                })
            } else {
                setConditionLog(null)
            }
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = async () => {
        if (!editForm.title.trim()) return alert(TASK_OVERLAY.titleRequiredAlert);

        // 更新処理
        await onUpdate(task.id, {
            title: editForm.title,
            sizeLabel: editForm.sizeLabel,
            // Dateオブジェクトとして保存（FirestoreでTimestampになる）
            deadline: editForm.deadline
        });
        setIsEditing(false);
    };

    // 未提出に戻す（TODOに戻す）処理
    const handleRevertToIncomplete = async () => {
        if (window.confirm(TASK_OVERLAY.revertConfirm(task.title))) {
            try {
                await onUpdate(task.id, {
                    status: 'TODO',
                    completedAt: null,
                    updatedAt: new Date()
                })
            } catch (err) {
                console.error("Failed to revert task status:", err)
                alert(TASK_OVERLAY.revertFailedAlert)
            }
        }
    }

    // タスク完了 (ステータス更新)
    const handleComplete = async () => {
        onCompleteRequest(task);
    };

    // 物理削除
    const handlePhysicalDelete = async () => {
        const confirmMessage = TASK_OVERLAY.physicalDeleteConfirm(task.title);
        if (window.confirm(confirmMessage)) {
            await onPhysicalDelete(task.id);
            onClose();
        }
    };

    // 締切ステータス判定
    const getDeadlineStatus = (val) => {
        if (!val) return 'none';
        let dateObj;
        if (typeof val === 'string') dateObj = new Date(val);
        else if (val instanceof Date) dateObj = val;
        else if (val.seconds) dateObj = new Date(val.seconds * 1000);
        else return 'none';

        if (isNaN(dateObj.getTime())) return 'none';

        const now = new Date();
        const diffMs = dateObj - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return 'expired'; // 期限切れ
        if (diffHours <= 24) return 'urgent'; // 24時間以内
        return 'normal';
    };

    // 表示用の日付フォーマット関数
    const formatDate = (dateVal) => {
        if (!dateVal) return TASK_OVERLAY.unsetDate;
        let d = dateVal;
        if (dateVal.seconds) {
            d = new Date(dateVal.seconds * 1000);
        } else if (!(dateVal instanceof Date)) {
            d = new Date(dateVal);
        }
        if (isNaN(d.getTime())) return TASK_OVERLAY.unsetDate;
        
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${year}年${month}月${day}日 ${hour}:${min}`;
    };

    const getBadgeColor = (label) => {
        if (!label) return 'bg-gray-100 text-gray-500';
        const upperLabel = label.toUpperCase();
        switch (upperLabel) {
            case 'S': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
            case 'M': return 'bg-orange-50 text-orange-700 border border-orange-100';
            case 'L': return 'bg-red-50 text-red-700 border border-red-100';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    return (
        // 背景 (Backdrop)
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            {/* モーダル本体 */}
            <div
                id="tutorial-task-detail-container"
                className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl m-4 p-6 relative animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダーエリア */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4 w-full">
                        <div className="flex flex-col gap-1 w-full">
                            {/* Row 1: タイトル + バッジ + アクションアイコン */}
                            <div className="flex items-center justify-around w-full">
                                {/* タイトル部分 */}
                                <div className="shrink-0 max-w-[500px]">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full text-3xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-blue-50/50 px-2 py-1 rounded-t-sm"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder={TASK_OVERLAY.titlePlaceholder}
                                            autoFocus
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bold text-gray-800 break-words leading-tight">
                                            {task.title}
                                        </h2>
                                    )}
                                </div>

                                {/* 中央: SML・ステータスバッジ & 編集・削除・提出完了 */}
                                <div id="tutorial-task-actions" className="flex-1 flex items-center justify-end gap-8 pt-2">
                                    {isEditing ? (
                                        <div className="w-96">
                                            <SizeLabelSelector
                                                selectedLabel={editForm.sizeLabel}
                                                onSelect={(label) => setEditForm({ ...editForm, sizeLabel: label })}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {task.sizeLabel && (
                                                <span className={`px-2 py-0.5 text-lg font-bold rounded ${getBadgeColor(task.sizeLabel)}`}>
                                                    {task.sizeLabel}
                                                </span>
                                            )}
                                            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-md ${task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                                task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {TASK_STATUS_LABELS[task.status] || TASK_OVERLAY.statusFallback}
                                            </span>
                                        </>
                                    )}
                                    {isEditing ? (
                                        <>
                                            {/* 編集モード: キャンセル + 保存 */}
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                    title={TASK_OVERLAY.buttons.cancel}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">{TASK_OVERLAY.buttons.cancel}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={handleSave}
                                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition shadow-sm"
                                                    title={TASK_OVERLAY.buttons.save}
                                                >
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <span className="text-xs font-bold text-blue-700">{TASK_OVERLAY.buttons.save}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* 閲覧モード: 未提出に戻す + 編集 + 削除 + 提出完了 */}
                                            {task.status === 'DONE' && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={handleRevertToIncomplete}
                                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                                                        title={TASK_OVERLAY.buttons.revert}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-[10px] font-bold text-gray-500">{TASK_OVERLAY.buttons.revert}</span>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={handlePhysicalDelete}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                    title={TASK_OVERLAY.buttons.delete}
                                                    id="tutorial-delete-button"
                                                    style={isTutorialActive ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">{TASK_OVERLAY.buttons.delete}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                    title={TASK_OVERLAY.buttons.edit}
                                                    id="tutorial-edit-button"
                                                    style={isTutorialActive ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">{TASK_OVERLAY.buttons.edit}</span>
                                            </div>
                                            {task.status !== 'DONE' && (
                                                <div className="flex flex-col items-center gap-1 ml-2">
                                                    <button
                                                        id="tutorial-complete-button"
                                                        onClick={handleComplete}
                                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
                                                        title={TASK_OVERLAY.buttons.complete}
                                                        style={isTutorialActive && tutorialStep !== 11 ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                                    >
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs font-bold text-gray-800">{TASK_OVERLAY.buttons.complete}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: 〆切 */}
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-gray-600">{TASK_OVERLAY.deadlineLabel}</span>
                                {isEditing ? (
                                    <div className="w-[300px]">
                                        <DateTimePicker
                                            value={editForm.deadline}
                                            onChange={(date) => setEditForm({ ...editForm, deadline: date })}
                                        />
                                    </div>
                                ) : (
                                    <span className={`text-lg font-bold ${
                                        getDeadlineStatus(task.deadline) === 'expired' ? 'text-gray-400 line-through' :
                                        getDeadlineStatus(task.deadline) === 'urgent' ? 'text-red-600 animate-pulse' : 
                                        'text-gray-800'
                                    }`}>
                                        {formatDate(task.deadline)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Divider */}
                        <div className="border-t border-gray-200 my-4"></div>
                        {/* Timer Component または コンディション表示 */}
                        <h3 className="text-xl font-bold text-gray-800">
                            {task.status === 'DONE' ? TASK_OVERLAY.sectionCondition : TASK_OVERLAY.sectionTimer}
                        </h3>
                        <div className="bg-gray-100 rounded-2xl p-4 flex justify-center items-center w-full min-h-[120px] mt-4">
                            {task.status === 'DONE' ? (
                                loadingCondition ? (
                                    <div className="text-gray-500 text-sm">{TASK_OVERLAY.conditionLoading}</div>
                                ) : conditionLog ? (
                                    <div className="flex flex-col md:flex-row items-center gap-6 justify-center w-full max-w-xl">
                                        {/* 気分表示 */}
                                        <div className="flex flex-col items-center gap-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0 w-28">
                                            <span className="text-5xl">
                                                {conditionLog.condition === 'good' ? '😊' :
                                                 conditionLog.condition === 'fair' ? '🙂' : '😥'}
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 mt-1">
                                                {conditionLog.condition === 'good' ? TASK_OVERLAY.moodLabels.good :
                                                 conditionLog.condition === 'fair' ? TASK_OVERLAY.moodLabels.fair : TASK_OVERLAY.moodLabels.poor}
                                            </span>
                                        </div>
                                        {/* メモ表示 */}
                                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full min-h-[80px] flex flex-col">
                                            <span className="text-xs font-bold text-gray-800 block mb-1">{TASK_OVERLAY.reflectionLabel}</span>
                                            <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap flex-1">
                                                {conditionLog.memo || TASK_OVERLAY.noMemo}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">{TASK_OVERLAY.noConditionRecord}</div>
                                )
                            ) : (
                                <Timer activeTask={task} onUpdateTask={onUpdate} logs={logs} />
                            )}
                        </div>
                    </div>
                </div>

                {/* コンテンツエリア */}
                
                <div className="space-y-8">
                    {/* 実績チャート */}
                    <section className="mt-8 border-t border-gray-200 pt-4">
                        <button
                            onClick={() => setIsChartExpanded(!isChartExpanded)}
                            className="w-full flex items-center justify-between text-left"
                        >
                            <h3 className="text-xl font-bold text-gray-800">
                                {TASK_OVERLAY.chartSection}
                            </h3>
                            <div className={`transform transition-transform text-gray-400 ${isChartExpanded ? 'rotate-180' : ''}`}>
                                ▼
                            </div>
                        </button>
                        
                        {isChartExpanded && (
                            <div className="mt-4 bg-gray-50 p-4 border border-gray-200 shadow-inner rounded-lg">
                                <GanttChart logs={logs} taskSize={task.sizeLabel} />
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default TaskOverlay
