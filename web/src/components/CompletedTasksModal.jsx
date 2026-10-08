import React, { useState, useMemo } from 'react';
import { Trophy, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { getSizeBorderClass, getSizeBadgeClass } from '../domain/taskSize';
import { COMPLETED_TASKS_MODAL } from '../content';

const CompletedTasksModal = ({ isOpen, onClose, tasks = [], onTaskClick, isTutorialActive }) => {
    // 開閉状態を月ごとに管理
    const [expandedMonths, setExpandedMonths] = useState({});

    // タスクを完了月（updatedAt優先）でグループ化
    const groupedTasks = useMemo(() => {
        const groups = {};
        tasks.forEach(task => {
            let dateObj = new Date();
            if (task.completedAt) {
                dateObj = task.completedAt instanceof Date ? task.completedAt : (task.completedAt?.toDate ? task.completedAt.toDate() : new Date(task.completedAt));
            } else if (task.updatedAt) {
                dateObj = task.updatedAt instanceof Date ? task.updatedAt : (task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt));
            } else if (task.createdAt) {
                dateObj = task.createdAt instanceof Date ? task.createdAt : (task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt));
            } else if (task.deadline) {
                dateObj = task.deadline instanceof Date ? task.deadline : (task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline));
            }

            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const key = `${year}年${month}月`;

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // キーを新しい月順にソートして配列化
        return Object.keys(groups).sort((a, b) => {
            const getScore = (str) => {
                const [y, m] = str.replace('月', '').split('年');
                return parseInt(y) * 12 + parseInt(m);
            };
            return getScore(b) - getScore(a);
        }).map(key => ({
            monthKey: key,
            tasks: groups[key].sort((a, b) => {
                const timeA = a.completedAt ? (a.completedAt.getTime ? a.completedAt.getTime() : new Date(a.completedAt).getTime()) : 0;
                const timeB = b.completedAt ? (b.completedAt.getTime ? b.completedAt.getTime() : new Date(b.completedAt).getTime()) : 0;
                return timeB - timeA;
            })
        }));
    }, [tasks]);

    const toggleMonth = (monthKey) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthKey]: prev[monthKey] !== undefined ? !prev[monthKey] : false
        }));
    };

    // 初期状態はすべて「開く」にしておく
    React.useEffect(() => {
        if (isOpen && groupedTasks.length > 0) {
            const initialExpanded = {};
            groupedTasks.forEach(g => {
                initialExpanded[g.monthKey] = true;
            });
            setExpandedMonths(initialExpanded);
        }
    }, [isOpen, groupedTasks]);

    const getSizeColor = getSizeBorderClass;
    const getBadgeColor = getSizeBadgeClass;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={COMPLETED_TASKS_MODAL.title}
            maxWidth="max-w-3xl"
            zIndex={60}
            blockOutsideInteraction={!isTutorialActive}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden"
        >
            <div id="tutorial-completed-modal" className="max-h-[85vh] flex flex-col">
                {/* ヘッダー */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" strokeWidth={2.2} />
                        <span>{COMPLETED_TASKS_MODAL.title}</span>
                    </h2>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-2 transition"
                        title="閉じる"
                        aria-label="閉じる"
                    >
                        <X className="w-5 h-5" strokeWidth={2.2} />
                    </button>
                </div>

                {/* リスト領域 */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
                    {groupedTasks.length === 0 ? (
                        <div className="text-center text-slate-400 dark:text-slate-500 py-12 flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-10 h-10 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-semibold">{COMPLETED_TASKS_MODAL.emptyMessage}</p>
                        </div>
                    ) : (
                        groupedTasks.map(group => {
                            const isExpanded = expandedMonths[group.monthKey];
                            return (
                                <div key={group.monthKey} className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-xs overflow-hidden">
                                    {/* 月ヘッダー (アコーディオン) */}
                                    <button 
                                        type="button"
                                        onClick={() => toggleMonth(group.monthKey)}
                                        className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">{group.monthKey}</h3>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                {COMPLETED_TASKS_MODAL.countLabel(group.tasks.length)}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* タスクリスト */}
                                    {isExpanded && (
                                        <div className="p-3 sm:p-4 space-y-2.5">
                                            {group.tasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick(task)}
                                                    className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all p-3.5 border border-l-[5px] rounded-xl flex justify-between items-center bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 ${getSizeColor(task.sizeLabel)}`}
                                                >
                                                    <div className="min-w-0 flex-1 pr-3">
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                            {task.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {task.sizeLabel && (
                                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${getBadgeColor(task.sizeLabel)}`}>
                                                                {task.sizeLabel}
                                                            </span>
                                                        )}
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                            {COMPLETED_TASKS_MODAL.completedBadge}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CompletedTasksModal;
