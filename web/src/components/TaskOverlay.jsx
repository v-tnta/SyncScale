import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Edit3, Trash2, RotateCcw, Check, ChevronDown } from 'lucide-react'
import GanttChart from './GanttChart'
import Timer from './Timer'
import SizeLabelSelector from './SizeLabelSelector'
import DateTimePicker from './DateTimePicker'
import { Modal } from './Modal'
import { ConfirmModal } from './ConfirmModal'
import { TASK_STATUS_LABELS } from '../domain/task'
import { getSizeBadgeClass } from '../domain/taskSize'
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
    const [editForm, setEditForm] = useState({ title: '', deadline: null, sizeLabel: null });
    const [isChartExpanded, setIsChartExpanded] = useState(true);
    const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        if (task) {
            let formattedDeadline = null;
            if (task.deadline) {
                if (task.deadline.seconds) {
                    formattedDeadline = new Date(task.deadline.seconds * 1000);
                } else if (task.deadline instanceof Date) {
                    formattedDeadline = task.deadline;
                } else {
                    formattedDeadline = new Date(task.deadline);
                }
            }

            setEditForm({
                title: task.title,
                deadline: formattedDeadline,
                sizeLabel: task.sizeLabel ?? null
            });
            setIsEditing(false);

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
    }, [task?.id, isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = async () => {
        if (!editForm.title.trim()) return toast.warning(TASK_OVERLAY.titleRequiredAlert);

        await onUpdate(task.id, {
            title: editForm.title.trim(),
            sizeLabel: editForm.sizeLabel,
            deadline: editForm.deadline
        });
        setIsEditing(false);
    };

    const handleRevertToIncomplete = async () => {
        setIsRevertConfirmOpen(false);
        try {
            await onUpdate(task.id, {
                status: 'TODO',
                completedAt: null,
                updatedAt: new Date()
            })
        } catch (err) {
            console.error("Failed to revert task status:", err)
            toast.error(TASK_OVERLAY.revertFailedAlert)
        }
    }

    const handleComplete = async () => {
        onCompleteRequest(task);
    };

    const handlePhysicalDelete = async () => {
        setIsDeleteConfirmOpen(false);
        await onPhysicalDelete(task.id);
        onClose();
    };

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

        if (diffMs < 0) return 'expired';
        if (diffHours <= 24) return 'urgent';
        return 'normal';
    };

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

    const getBadgeColor = getSizeBadgeClass;

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task.title}
            maxWidth="max-w-4xl"
            zIndex={80}
            blockOutsideInteraction={!isTutorialActive}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl p-5 sm:p-7"
        >
            <div id="tutorial-task-detail-container" className="flex flex-col gap-6">
                {/* ヘッダーエリア */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 border-b-2 border-blue-500 focus:outline-none bg-blue-50/50 dark:bg-blue-950/40 px-2 py-1 rounded-t-lg"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder={TASK_OVERLAY.titlePlaceholder}
                                    autoFocus
                                />
                                <div className="max-w-md">
                                    <SizeLabelSelector
                                        selectedLabel={editForm.sizeLabel}
                                        onSelect={(label) => setEditForm({ ...editForm, sizeLabel: label })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 break-words leading-snug">
                                    {task.title}
                                </h2>
                                {task.sizeLabel && (
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${getBadgeColor(task.sizeLabel)}`}>
                                        {task.sizeLabel}
                                    </span>
                                )}
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                    task.status === 'DONE' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                                    task.status === 'DOING' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 
                                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                    {TASK_STATUS_LABELS[task.status] || TASK_OVERLAY.statusFallback}
                                </span>
                            </div>
                        )}

                        {/* 締切日時 */}
                        <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm">
                            <span className="font-bold text-slate-500 dark:text-slate-400">{TASK_OVERLAY.deadlineLabel}</span>
                            {isEditing ? (
                                <div className="w-[260px]">
                                    <DateTimePicker
                                        value={editForm.deadline}
                                        onChange={(date) => setEditForm({ ...editForm, deadline: date })}
                                    />
                                </div>
                            ) : (
                                <span className={`font-semibold ${
                                    getDeadlineStatus(task.deadline) === 'expired' ? 'text-slate-400 dark:text-slate-500 line-through' :
                                    getDeadlineStatus(task.deadline) === 'urgent' ? 'text-red-600 dark:text-red-400 font-bold' : 
                                    'text-slate-700 dark:text-slate-300'
                                }`}>
                                    {formatDate(task.deadline)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 右上操作ボタン群（閉じるボタン含む） */}
                    <div id="tutorial-task-actions" className="flex items-center gap-1.5 shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="py-1.5 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                >
                                    {TASK_OVERLAY.buttons.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="py-1.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
                                >
                                    {TASK_OVERLAY.buttons.save}
                                </button>
                            </>
                        ) : (
                            <>
                                {task.status === 'DONE' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsRevertConfirmOpen(true)}
                                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                                        title={TASK_OVERLAY.buttons.revert}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    id="tutorial-edit-button"
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition"
                                    title={TASK_OVERLAY.buttons.edit}
                                    style={isTutorialActive ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                    id="tutorial-delete-button"
                                    type="button"
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                                    title={TASK_OVERLAY.buttons.delete}
                                    style={isTutorialActive ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {task.status !== 'DONE' && (
                                    <button
                                        id="tutorial-complete-button"
                                        type="button"
                                        onClick={handleComplete}
                                        className="flex items-center gap-1 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                                        title={TASK_OVERLAY.buttons.complete}
                                        style={isTutorialActive && tutorialStep !== 11 ? { pointerEvents: 'none', cursor: 'default' } : undefined}
                                    >
                                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        <span>提出完了</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition ml-1"
                                    title="閉じる"
                                    aria-label="閉じる"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* セクション: タイマー または 完了コンディション */}
                <div className="border-t border-slate-200/80 dark:border-slate-800 pt-5">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                        {task.status === 'DONE' ? TASK_OVERLAY.sectionCondition : TASK_OVERLAY.sectionTimer}
                    </h3>

                    <div className="bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex justify-center items-center w-full min-h-[140px]">
                        {task.status === 'DONE' ? (
                            loadingCondition ? (
                                <div className="text-slate-400 text-xs font-semibold">{TASK_OVERLAY.conditionLoading}</div>
                            ) : conditionLog ? (
                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-xl">
                                    {/* 気分表示 */}
                                    <div className="flex flex-col items-center gap-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0 w-28">
                                        <span className="text-4xl">
                                            {conditionLog.condition === 'good' ? '😊' :
                                             conditionLog.condition === 'fair' ? '🙂' : '😥'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                                            {conditionLog.condition === 'good' ? TASK_OVERLAY.moodLabels.good :
                                             conditionLog.condition === 'fair' ? TASK_OVERLAY.moodLabels.fair : TASK_OVERLAY.moodLabels.poor}
                                        </span>
                                    </div>
                                    {/* メモ表示 */}
                                    <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 w-full min-h-[80px] flex flex-col">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">{TASK_OVERLAY.reflectionLabel}</span>
                                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap flex-1">
                                            {conditionLog.memo || TASK_OVERLAY.noMemo}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-xs font-semibold">{TASK_OVERLAY.noConditionRecord}</div>
                            )
                        ) : (
                            <Timer activeTask={task} onUpdateTask={onUpdate} logs={logs} />
                        )}
                    </div>
                </div>

                {/* 実績チャート（未完了・完了ともに共通で表示） */}
                <div className="border-t border-slate-200/80 dark:border-slate-800 pt-5">
                    <button
                        type="button"
                        onClick={() => setIsChartExpanded(!isChartExpanded)}
                        className="w-full flex items-center justify-between text-left group"
                    >
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition">
                            {TASK_OVERLAY.chartSection}
                        </h3>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isChartExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isChartExpanded && (
                        <div className="mt-3 bg-slate-50 dark:bg-slate-850/60 p-4 border border-slate-200/80 dark:border-slate-800 shadow-inner rounded-2xl">
                            <GanttChart logs={logs} taskSize={task.sizeLabel} />
                        </div>
                    )}
                </div>
            </div>
        </Modal>

        {/* 未提出に戻す確認モーダル */}
        <ConfirmModal
            isOpen={isRevertConfirmOpen}
            title={TASK_OVERLAY.revertConfirmTitle}
            onConfirm={handleRevertToIncomplete}
            onCancel={() => setIsRevertConfirmOpen(false)}
        >
            {TASK_OVERLAY.revertConfirm(task.title)}
        </ConfirmModal>

        {/* 完全削除の確認モーダル */}
        <ConfirmModal
            isOpen={isDeleteConfirmOpen}
            title={TASK_OVERLAY.physicalDeleteConfirmTitle}
            onConfirm={handlePhysicalDelete}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-xs"
            cancelButtonClass="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
            {TASK_OVERLAY.physicalDeleteConfirm(task.title)}
        </ConfirmModal>
        </>
    )
}

export default TaskOverlay
