import React, { useMemo } from "react";

// S/M/L別のリードタイム算出（締切日 - 着手日の平均日数）
function calculateLeadTimes(tasks) {
    const summaries = [];
    for (const size of ['S', 'M', 'L']) {
        const matchedTasks = tasks.filter(task => 
            task.sizeLabel === size &&
            task.deadline &&
            task.startedAt
        );

        const days = matchedTasks.map(task => {
            // deadline を Date にパース
            let deadlineDate;
            if (task.deadline.toDate) deadlineDate = task.deadline.toDate();
            else if (task.deadline instanceof Date) deadlineDate = task.deadline;
            else deadlineDate = new Date(task.deadline);

            // startedAt を Date にパース
            let startedAtDate;
            if (task.startedAt.toDate) startedAtDate = task.startedAt.toDate();
            else if (task.startedAt instanceof Date) startedAtDate = task.startedAt;
            else startedAtDate = new Date(task.startedAt);

            if (isNaN(deadlineDate.getTime()) || isNaN(startedAtDate.getTime())) return null;

            // 差分日数 (締め切り - 初回着手日時)
            const diffMs = deadlineDate.getTime() - startedAtDate.getTime();
            return diffMs / (1000 * 60 * 60 * 24);
        }).filter(val => val !== null);

        if (days.length === 0) {
            summaries.push({ sizeLabel: size, averageDays: 0, count: 0 });
            continue;
        }

        const total = days.reduce((sum, val) => sum + val, 0);
        summaries.push({
            sizeLabel: size,
            averageDays: total / days.length,
            count: days.length
        });
    }
    return summaries;
}

export function AnalyticsPanel({ isOpen, onClose, tasks = [] }) {
    if (!isOpen) return null;

    const leadTimes = useMemo(() => calculateLeadTimes(tasks), [tasks]);

    const getSizeColor = (size) => {
        switch (size) {
            case 'S': return {
                text: 'text-cyan-600',
                lightBg: 'bg-cyan-50',
                border: 'border-cyan-200'
            };
            case 'M': return {
                text: 'text-orange-600',
                lightBg: 'bg-orange-50',
                border: 'border-orange-200'
            };
            case 'L': return {
                text: 'text-red-600',
                lightBg: 'bg-red-50',
                border: 'border-red-200'
            };
            default: return {
                text: 'text-blue-600',
                lightBg: 'bg-blue-50',
                border: 'border-blue-200'
            };
        }
    };

    return (
        <>
            {/* バックドロップ */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* モーダル本体 */}
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-4 pointer-events-none">
                <div className="w-full max-w-lg bg-white border border-gray-200 text-gray-800 shadow-2xl rounded-3xl p-6 flex flex-col justify-between font-sans pointer-events-auto relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    <div className="space-y-6">
                        {/* ヘッダー */}
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-black flex items-center gap-2 text-gray-900">
                                <span>📈</span> 分析ダッシュボード
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg text-sm transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 説明 */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">平均着手タイミング</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                課題ごとに、最初の作業ログを記録した時点（初めて課題に取り掛かった時点）が、**締切の何日前であったか**の平均値です。
                            </p>
                        </div>

                        {/* S/M/Lカード */}
                        <div className="space-y-4">
                            {leadTimes.map((item) => {
                                const colors = getSizeColor(item.sizeLabel);
                                const hasData = item.count > 0;
                                const isBeforeDeadline = item.averageDays >= 0;

                                return (
                                    <div
                                        key={item.sizeLabel}
                                        className={`border ${colors.border} ${colors.lightBg} p-4 rounded-2xl flex justify-between items-center shadow-sm transition hover:shadow-md`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-black ${colors.text} bg-white border ${colors.border} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}>
                                                {item.sizeLabel}
                                            </span>
                                            <span className="text-sm font-bold text-gray-700">
                                                {item.sizeLabel === 'S' ? '小規模 (すぐやる)' :
                                                 item.sizeLabel === 'M' ? '中規模 (半日〜1日)' : '大規模 (数日)'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            {hasData ? (
                                                <span className="text-lg font-black text-gray-800">
                                                    {isBeforeDeadline ? (
                                                        <>締切の {item.averageDays.toFixed(1)} <span className="text-xs font-bold text-gray-500">日前</span></>
                                                    ) : (
                                                        <>締切の {Math.abs(item.averageDays).toFixed(1)} <span className="text-xs font-bold text-red-500">日後 (超過)</span></>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-400">データなし</span>
                                            )}
                                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">（計測数: {item.count}件）</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* アドバイス */}
                        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                            <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 leading-relaxed">
                                <span>💡</span>
                                {(() => {
                                    const s = leadTimes.find(i => i.sizeLabel === 'S')?.averageDays || 0;
                                    const m = leadTimes.find(i => i.sizeLabel === 'M')?.averageDays || 0;
                                    const l = leadTimes.find(i => i.sizeLabel === 'L')?.averageDays || 0;
                                    const counts = leadTimes.reduce((acc, i) => acc + i.count, 0);

                                    if (counts === 0) {
                                        return "タスクの作業ログを記録すると、締切からの余裕日数がここに集計されます。";
                                    }
                                    if (l < s && l < 1) {
                                        return "Lサイズのタスクは締切ギリギリ（または超過後）に着手しがちです。まずは1分だけでも早めに取り掛かってみましょう！";
                                    }
                                    if (s < 2) {
                                        return "小規模（S）タスクを締切の直前まで溜め込んでいませんか？見つけたらその場で終わらせてしまうのがコツです。";
                                    }
                                    return "全体的に締切に対して十分な余裕を持って着手できています！このペースを維持しましょう。";
                                })()}
                            </p>
                        </div>
                    </div>

                    {/* 下部アクション */}
                    <div className="border-t border-gray-200 pt-4 mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="py-2.5 px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-center text-sm transition duration-200 shadow-sm active:scale-95 pointer-events-auto"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
