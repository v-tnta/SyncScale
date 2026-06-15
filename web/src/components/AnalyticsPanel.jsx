import React, { useMemo } from "react";
import {
    calculateLeadTimes,
    calculateEstimationAccuracy,
    isEstimationConsistent,
    calculateCrammingScores,
    calculateConditionByTimeOfDay,
    detectStalledTasks,
} from "../domain/analytics";

// 分（小数）を「N時間N分」表記へ
function formatMinutes(totalMinutes) {
    const m = Math.round(totalMinutes);
    if (m < 60) return `${m}分`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}時間` : `${h}時間${rem}分`;
}

const SIZE_COLORS = {
    S: { text: 'text-cyan-600', lightBg: 'bg-cyan-50', border: 'border-cyan-200' },
    M: { text: 'text-orange-600', lightBg: 'bg-orange-50', border: 'border-orange-200' },
    L: { text: 'text-red-600', lightBg: 'bg-red-50', border: 'border-red-200' },
};
const getSizeColor = (size) =>
    SIZE_COLORS[size] || { text: 'text-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200' };

const SIZE_DESCRIPTION = {
    S: '小規模 (すぐやる)',
    M: '中規模 (半日〜1日)',
    L: '大規模 (数日)',
};

// 各分析セクションの共通ラッパ
function Section({ icon, title, description, children }) {
    return (
        <div className="space-y-3">
            <div>
                <h4 className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                    <span>{icon}</span> {title}
                </h4>
                {description && (
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

export function AnalyticsPanel({ isOpen, onClose, tasks = [], timeLogs = [], conditionLogs = [] }) {
    // フックは早期 return より前で呼ぶ（React Hooks のルール）。
    // isOpen による早期 return の後に useMemo を置くと、開閉のたびに
    // 呼ばれるフック数が変わり「Rendered more hooks than during the previous render」で
    // クラッシュするため、必ず return より上で呼ぶ。
    const leadTimes = useMemo(() => calculateLeadTimes(tasks), [tasks]);
    const estimation = useMemo(() => calculateEstimationAccuracy(tasks, timeLogs), [tasks, timeLogs]);
    const cramming = useMemo(() => calculateCrammingScores(tasks, timeLogs), [tasks, timeLogs]);
    const conditionByTime = useMemo(
        () => calculateConditionByTimeOfDay(tasks, timeLogs, conditionLogs),
        [tasks, timeLogs, conditionLogs]
    );
    const stalledTasks = useMemo(() => detectStalledTasks(tasks, timeLogs), [tasks, timeLogs]);

    const estimationConsistent = useMemo(() => isEstimationConsistent(estimation), [estimation]);
    const maxBandTotal = useMemo(
        () => Math.max(1, ...conditionByTime.map(b => b.total)),
        [conditionByTime]
    );

    if (!isOpen) return null;

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
                    <div className="space-y-7">
                        {/* ヘッダー */}
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4 sticky -top-6 bg-white/95 backdrop-blur-sm pt-1 z-10">
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

                        {/* ── 着手リードタイム ─────────────────────────── */}
                        <Section
                            icon="⏱"
                            title="平均着手タイミング"
                            description="課題ごとに、最初の作業ログを記録した時点が、締切の何日前であったかの平均値です。"
                        >
                            <div className="space-y-3">
                                {leadTimes.map((item) => {
                                    const colors = getSizeColor(item.sizeLabel);
                                    const hasData = item.count > 0;
                                    const isBeforeDeadline = item.averageDays >= 0;
                                    return (
                                        <div
                                            key={item.sizeLabel}
                                            className={`border ${colors.border} ${colors.lightBg} p-3.5 rounded-2xl flex justify-between items-center shadow-sm`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-lg font-black ${colors.text} bg-white border ${colors.border} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}>
                                                    {item.sizeLabel}
                                                </span>
                                                <span className="text-sm font-bold text-gray-700">
                                                    {SIZE_DESCRIPTION[item.sizeLabel]}
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
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 1. 見積もり精度：SML × 実働時間 ──────────── */}
                        <Section
                            icon="🎯"
                            title="見積もり精度（SML × 実働時間）"
                            description="S/M/L ごとに、実際にかかった作業時間の平均です。S→M→L で増えていれば見積もりの感覚が一貫しています。"
                        >
                            <div className="grid grid-cols-3 gap-2">
                                {estimation.map((item) => {
                                    const colors = getSizeColor(item.sizeLabel);
                                    const hasData = item.count > 0;
                                    return (
                                        <div
                                            key={item.sizeLabel}
                                            className={`border ${colors.border} ${colors.lightBg} p-3 rounded-2xl flex flex-col items-center text-center shadow-sm`}
                                        >
                                            <span className={`text-base font-black ${colors.text} bg-white border ${colors.border} w-7 h-7 rounded-full flex items-center justify-center shadow-sm mb-2`}>
                                                {item.sizeLabel}
                                            </span>
                                            {hasData ? (
                                                <>
                                                    <span className="text-sm font-black text-gray-800 leading-tight">
                                                        {formatMinutes(item.avgMinutes)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">平均 / {item.count}件</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400 mt-1">データなし</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`p-3 rounded-2xl text-center border ${estimationConsistent ? 'bg-emerald-50 border-emerald-200/60' : 'bg-amber-50 border-amber-200/60'}`}>
                                <p className={`text-xs font-bold leading-relaxed ${estimationConsistent ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {estimation.every(e => e.count === 0)
                                        ? "💡 作業ログを記録すると、サイズ感と実時間のズレが見えてきます。"
                                        : estimationConsistent
                                            ? "✅ サイズが大きいほど作業時間も長く、見積もりの感覚が一貫しています。"
                                            : "⚠️ サイズの大小と実際の作業時間が逆転しています。ラベルの付け方を見直すヒントになります。"}
                                </p>
                            </div>
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 2. 一夜漬け度 ────────────────────────────── */}
                        <Section
                            icon="🌙"
                            title="一夜漬け度"
                            description="各タスクの全作業時間のうち、締切24時間前以降（超過分含む）に行った割合の平均です。高いほど直前に作業が集中しています。"
                        >
                            {cramming.taskCount === 0 ? (
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-slate-500">締切と作業ログが揃ったタスクがまだありません。</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* 全体ゲージ */}
                                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500">全体の一夜漬け度</span>
                                            <span className="text-2xl font-black text-slate-800">
                                                {Math.round(cramming.overallRatio * 100)}<span className="text-sm">%</span>
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all"
                                                style={{ width: `${Math.round(cramming.overallRatio * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-2">
                                            対象 {cramming.taskCount}件中 {cramming.crammedTaskCount}件が「直前集中型」（50%以上）
                                        </p>
                                    </div>

                                    {/* サイズ別 */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {cramming.bySize.map((item) => {
                                            const colors = getSizeColor(item.sizeLabel);
                                            return (
                                                <div key={item.sizeLabel} className={`border ${colors.border} ${colors.lightBg} p-2.5 rounded-2xl text-center shadow-sm`}>
                                                    <span className={`text-sm font-black ${colors.text}`}>{item.sizeLabel}</span>
                                                    <p className="text-base font-black text-gray-800 leading-tight mt-0.5">
                                                        {item.ratio === null ? '—' : `${Math.round(item.ratio * 100)}%`}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 font-semibold">{item.count}件</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 一夜漬け上位 */}
                                    {cramming.topTasks.filter(t => t.ratio > 0).length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-bold text-gray-400">直前集中だったタスク</p>
                                            {cramming.topTasks.filter(t => t.ratio > 0).map((t) => (
                                                <div key={t.taskId} className="flex items-center justify-between gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
                                                    <span className="text-xs font-bold text-gray-700 truncate">{t.title}</span>
                                                    <span className="text-xs font-black text-rose-500 flex-shrink-0">{Math.round(t.ratio * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 3. 時間帯 × コンディション ───────────────── */}
                        <Section
                            icon="🕐"
                            title="時間帯 × コンディション"
                            description="どの時間帯に作業したタスクが、提出時にどんな手応え（😀良い / 😐普通 / 😩しんどい）だったかを作業時間で集計しています。"
                        >
                            {conditionByTime.every(b => b.total === 0) ? (
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-slate-500">作業ログとコンディションが揃うと、時間帯ごとの傾向が見えてきます。</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {conditionByTime.map((band) => {
                                        const hasData = band.total > 0;
                                        const pct = (v) => (band.total > 0 ? (v / band.total) * 100 : 0);
                                        return (
                                            <div key={band.key} className="flex items-center gap-3">
                                                <div className="w-14 flex-shrink-0 text-right">
                                                    <p className="text-xs font-black text-gray-700">{band.label}</p>
                                                    <p className="text-[9px] text-gray-400 font-semibold">{band.range}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="h-6 flex rounded-lg overflow-hidden bg-gray-100"
                                                        style={{ width: `${Math.max(8, (band.total / maxBandTotal) * 100)}%` }}
                                                        title={`${band.label}: ${formatMinutes(band.total)}`}
                                                    >
                                                        {hasData && (
                                                            <>
                                                                <div className="bg-emerald-400" style={{ width: `${pct(band.good)}%` }} />
                                                                <div className="bg-amber-400" style={{ width: `${pct(band.fair)}%` }} />
                                                                <div className="bg-rose-400" style={{ width: `${pct(band.poor)}%` }} />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="w-16 flex-shrink-0 text-right text-[10px] font-bold text-gray-400">
                                                    {hasData ? formatMinutes(band.total) : '—'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* 凡例 */}
                                    <div className="flex items-center justify-center gap-3 pt-1">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />良い</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />普通</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />しんどい</span>
                                    </div>
                                </div>
                            )}
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 4. 放置タスク検出 ────────────────────────── */}
                        <Section
                            icon="🚨"
                            title="放置タスク"
                            description="「とりかかり中」のまま3日以上作業していないタスクです。手をつけたまま止まっている課題を見逃さないために。"
                        >
                            {stalledTasks.length === 0 ? (
                                <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-emerald-700">✅ 放置されているタスクはありません。順調です！</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stalledTasks.map((t) => {
                                        const colors = getSizeColor(t.sizeLabel);
                                        return (
                                            <div key={t.taskId} className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {t.sizeLabel && (
                                                        <span className={`text-xs font-black ${colors.text} bg-white border ${colors.border} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}>
                                                            {t.sizeLabel}
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{t.title}</p>
                                                        {t.isOverdue && (
                                                            <span className="text-[9px] font-bold text-red-500">締切超過</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-amber-600 flex-shrink-0">
                                                    {Math.floor(t.stalledDays)}日<span className="text-[10px] font-bold text-gray-400">放置</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>
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
