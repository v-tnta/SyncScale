import React, { useState, useMemo } from 'react';

const CompletedTasksModal = ({ isOpen, onClose, tasks, onTaskClick }) => {
    // 開閉状態を月ごとに管理 (ex: "2026年5月" -> true/false)
    const [expandedMonths, setExpandedMonths] = useState({});

    // タスクを完了月（updatedAt優先）でグループ化
    const groupedTasks = useMemo(() => {
        const groups = {};
        tasks.forEach(task => {
            let dateObj = new Date(); // デフォルトは現在
            if (task.updatedAt) {
                dateObj = task.updatedAt;
            } else if (task.createdAt) {
                dateObj = task.createdAt;
            } else if (task.deadline) {
                dateObj = task.deadline;
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
                const timeA = a.updatedAt ? a.updatedAt.getTime() : 0;
                const timeB = b.updatedAt ? b.updatedAt.getTime() : 0;
                return timeB - timeA; // 新しい順
            })
        }));
    }, [tasks]);

    const toggleMonth = (monthKey) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthKey]: prev[monthKey] !== undefined ? !prev[monthKey] : false // 初期状態(undefined)の場合は閉じる
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

    if (!isOpen) return null;

    const getSizeColor = (label) => {
        switch (label) {
            case 'S': return 'border-l-cyan-400';
            case 'M': return 'border-l-orange-400';
            case 'L': return 'border-l-red-500';
            default: return 'border-l-transparent';
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-3xl max-h-[85vh] rounded-xl shadow-2xl m-4 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🏆</span> 完了したタスクの一覧
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50">
                    {groupedTasks.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            完了したタスクはまだありません。
                        </div>
                    ) : (
                        groupedTasks.map(group => {
                            const isExpanded = expandedMonths[group.monthKey];
                            return (
                                <div key={group.monthKey} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    {/* 月ヘッダー (アコーディオン) */}
                                    <button 
                                        onClick={() => toggleMonth(group.monthKey)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-px w-8 bg-gray-300"></div>
                                            <h3 className="font-bold text-gray-700">{group.monthKey}</h3>
                                            <div className="h-px w-8 bg-gray-300"></div>
                                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                                {group.tasks.length} 件
                                            </span>
                                        </div>
                                        <div className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </div>
                                    </button>

                                    {/* タスクリスト */}
                                    {isExpanded && (
                                        <div className="p-4 space-y-3">
                                            {group.tasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick(task)}
                                                    className={`cursor-pointer hover:shadow-md transition p-4 border border-l-8 rounded-lg flex justify-between items-center bg-white ${getSizeColor(task.sizeLabel)}`}
                                                >
                                                    <div>
                                                        <h4 className="font-medium flex items-center gap-2 text-gray-800">
                                                            {task.title}
                                                            {task.sizeLabel && (
                                                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-500 no-underline">
                                                                    {task.sizeLabel}
                                                                </span>
                                                            )}
                                                        </h4>
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        完了
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
        </div>
    );
};

export default CompletedTasksModal;
