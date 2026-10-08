import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, Trophy, Plus, X, Check, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { TASK_STATUS_LABELS } from '../domain/task';
import { getSizeBorderClass, getSizeBadgeClass } from '../domain/taskSize';
import { TASK_LIST } from '../content';
import TaskForm from './TaskForm';

/**
 * 課題一覧コンポーネント
 * 画面上部に固定の見出し・完了一覧ボタン・追加ボタンを配置し、
 * タスク行は内部スクロール領域に収めることで、件数が増えても周囲が伸びない設計。
 */
const TaskList = ({
    tasks = [],
    completedTasksCount = 0,
    loading,
    error,
    onTaskClick,
    onCompleteRequest,
    onOpenCompletedModal,
    isTutorialActive,
    tutorialStep,
    addTask
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const addButtonRef = useRef(null);

    // チュートリアルのタスク登録ステップ（ステップ1〜4）では自動でフォームを展開する
    useEffect(() => {
        if (isTutorialActive) {
            if (tutorialStep >= 1 && tutorialStep <= 4) {
                setIsFormOpen(true);
            } else if (tutorialStep > 4) {
                setIsFormOpen(false);
            }
        }
    }, [isTutorialActive, tutorialStep]);

    const handleToggleForm = () => {
        setIsFormOpen(prev => !prev);
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        // キャンセル後に追加ボタンにフォーカスを復帰
        setTimeout(() => {
            addButtonRef.current?.focus();
        }, 50);
    };

    // サイズに応じたアクセントカラーとバッジ
    const getSizeColor = (label) => label ? getSizeBorderClass(label) : 'border-l-slate-300 dark:border-l-slate-600';
    const getBadgeColor = getSizeBadgeClass;

    const getSizeText = (label) => {
        switch (label?.toUpperCase()) {
            case 'S': return 'S（小）';
            case 'M': return 'M（中）';
            case 'L': return 'L（大）';
            default: return '未設定';
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

    // 日時フォーマット関数
    const formatDate = (val) => {
        if (!val) return TASK_LIST.unsetDate;
        let dateObj;
        if (typeof val === 'string') dateObj = new Date(val);
        else if (val instanceof Date) dateObj = val;
        else if (val.seconds) dateObj = new Date(val.seconds * 1000);
        else return TASK_LIST.unsetDate;

        if (isNaN(dateObj.getTime())) return TASK_LIST.unsetDate;

        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        const h = dateObj.getHours().toString().padStart(2, '0');
        const min = dateObj.getMinutes().toString().padStart(2, '0');
        return `${m}/${d} ${h}:${min}`;
    };

    // 完了ボタンハンドラ
    const handleComplete = (e, task) => {
        e.stopPropagation();
        onCompleteRequest(task);
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.2} />
                        {TASK_LIST.heading}
                    </h2>
                </div>
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse p-4 border border-l-4 border-l-slate-200 dark:border-l-slate-700 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-44" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-28" />
                            </div>
                            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-bold">{TASK_LIST.error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-full min-h-0 overflow-hidden transition-colors duration-200">
            {/* ヘッダーエリア（固定） */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 min-w-0">
                    <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2.2} />
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                        {TASK_LIST.heading}
                    </h2>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* 完了課題一覧ボタン */}
                    <button
                        id="tutorial-completed-list-button"
                        type="button"
                        onClick={onOpenCompletedModal}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-250 dark:active:bg-slate-650 px-2.5 py-1.5 rounded-xl transition border border-slate-200 dark:border-slate-700"
                        title={TASK_LIST.completedListButton}
                    >
                        <Trophy className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.2} />
                        <span className="hidden sm:inline">完了</span>
                    </button>

                    {/* 課題を追加ボタン（一覧右上に配置） */}
                    <button
                        ref={addButtonRef}
                        id="tutorial-add-task-button"
                        type="button"
                        onClick={handleToggleForm}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs ${
                            isFormOpen
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-650'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/20'
                        }`}
                        title={isFormOpen ? 'フォームを閉じる' : '新しい課題を追加'}
                        aria-expanded={isFormOpen}
                    >
                        {isFormOpen ? (
                            <>
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span>閉じる</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span>課題を追加</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* インライン展開される課題追加フォーム */}
            {isFormOpen && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 shrink-0 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                            新しい課題の登録
                        </span>
                    </div>
                    <TaskForm
                        addTask={addTask}
                        onCancel={handleFormCancel}
                        disabled={isTutorialActive && tutorialStep < 4}
                        isTutorialActive={isTutorialActive}
                    />
                </div>
            )}

            {/* タスクリスト表示エリア（内部スクロール領域） */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar min-h-0 bg-slate-50/40 dark:bg-slate-900/40">
                {tasks.length === 0 ? (
                    completedTasksCount > 0 ? (
                        /* すべて完了している場合 */
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-xs">
                                🎉
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                    すべての課題が完了しています！
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    お疲れさまでした。完了した課題は一覧から確認できます。
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenCompletedModal}
                                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                <span>完了した課題を見る（{completedTasksCount}件）</span>
                            </button>
                        </div>
                    ) : (
                        /* 1件も登録されていない場合 */
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3 text-slate-400 dark:text-slate-500">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6" strokeWidth={1.8} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                    {TASK_LIST.empty}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    右上の「課題を追加」ボタンから最初の課題を登録しましょう。
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(true)}
                                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>新しい課題を追加する</span>
                            </button>
                        </div>
                    )
                ) : (
                    tasks.map((task) => {
                        const deadlineStatus = getDeadlineStatus(task.deadline);
                        return (
                            <div
                                key={task.id}
                                id={task.title?.includes("線形代数") ? "tutorial-target-task" : undefined}
                                onClick={() => onTaskClick(task)}
                                className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs transition-all p-3.5 border border-l-[5px] rounded-xl flex justify-between items-center bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-750 border-slate-200/80 dark:border-slate-700/80 ${getSizeColor(task.sizeLabel)}`}
                            >
                                <div className="min-w-0 flex-1 pr-3">
                                    {/* 課題タイトル */}
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate leading-snug">
                                        {task.title}
                                    </h3>

                                    {/* 締切日時と状態 */}
                                    <div className="text-xs mt-1.5 flex items-center gap-3 flex-wrap">
                                        <span className={`font-semibold flex items-center gap-1 ${
                                            deadlineStatus === 'expired' ? 'text-slate-400 dark:text-slate-500 line-through' :
                                            deadlineStatus === 'urgent' ? 'text-red-600 dark:text-red-400 font-bold' : 
                                            'text-slate-500 dark:text-slate-400'
                                        }`}>
                                            <Clock className="w-3 h-3 shrink-0" />
                                            <span>{formatDate(task.deadline)}</span>
                                            {deadlineStatus === 'urgent' && (
                                                <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-1 rounded font-bold">
                                                    直前
                                                </span>
                                            )}
                                            {deadlineStatus === 'expired' && (
                                                <span className="text-[10px] text-slate-400">超過</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* ステータス・操作エリア */}
                                <div className="flex items-center gap-2.5 shrink-0">
                                    {/* S/M/L バッジ（文字でも明示） */}
                                    {task.sizeLabel && (
                                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-lg ${getBadgeColor(task.sizeLabel)}`} title={`規模: ${getSizeText(task.sizeLabel)}`}>
                                            {getSizeText(task.sizeLabel)}
                                        </span>
                                    )}

                                    {/* 完了ボタン */}
                                    {task.status !== 'DONE' && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleComplete(e, task)}
                                            disabled={isTutorialActive}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-full transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                            title={isTutorialActive ? TASK_LIST.completeTitleTutorial : TASK_LIST.completeTitle}
                                            aria-label={TASK_LIST.completeTitle}
                                        >
                                            <Check className="w-4 h-4" strokeWidth={2.5} />
                                        </button>
                                    )}

                                    {/* 状態バッジ */}
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        task.status === 'TODO' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
                                        task.status === 'DOING' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                        'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                        {TASK_STATUS_LABELS[task.status] || task.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TaskList;
