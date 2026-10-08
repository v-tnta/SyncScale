import React, { useMemo, useState } from "react";
import { X, TrendingUp } from "lucide-react";
import {
    calculateLeadTimes,
    calculateEstimationAccuracy,
    isEstimationConsistent,
    calculateCrammingScores,
    calculateWorkTimeByTimeOfDay,
    detectStalledTasks,
} from "../domain/analytics";
import { ANALYTICS_PANEL } from "../content";

// Firestore Timestamp / Date / 文字列のいずれでも Date に正規化する
function toDateSafe(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

// 分（小数）を「N時間N分」表記へ
function formatMinutes(totalMinutes) {
    const m = Math.round(totalMinutes);
    if (m < 60) return `${m}分`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}時間` : `${h}時間${rem}分`;
}

const SIZE_COLORS = {
    S: { text: 'text-cyan-600 dark:text-cyan-400', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800' },
    M: { text: 'text-orange-600 dark:text-orange-400', lightBg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' },
    L: { text: 'text-red-600 dark:text-red-400', lightBg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' },
};
const getSizeColor = (size) =>
    SIZE_COLORS[size] || { text: 'text-blue-600 dark:text-blue-400', lightBg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' };

const SIZE_DESCRIPTION = ANALYTICS_PANEL.sizeDescription;

// 各分析カードの共通ラッパ（5カードごとに明確に区切る）
function AnalyticsCard({ icon, title, description, children }) {
    return (
        <div className="bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="text-base">{icon}</span> {title}
                </h4>
                {description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

export function AnalyticsPanel({ isOpen, onClose, tasks = [], timeLogs = [] }) {
    // 集計期間（'all' = 全期間 / 'month' = 今月）
    const [period, setPeriod] = useState('all');

    // 今月の範囲 [start, end)。全期間のときは null。
    const range = useMemo(() => {
        if (period !== 'month') return null;
        const now = new Date();
        return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }, [period]);

    const inRange = (d) =>
        !!d && (!range || (d.getTime() >= range.start.getTime() && d.getTime() < range.end.getTime()));

    // 選択期間で作業ログを絞り込む
    const scopedTimeLogs = useMemo(() => {
        if (!range) return timeLogs;
        return timeLogs.filter(log => inRange(toDateSafe(log.startTime || log.endTime || log.createdAt)));
    }, [timeLogs, range]);

    // 着手リードタイムは「その期間に着手したタスク」を対象にする
    const scopedTasksForLead = useMemo(() => {
        if (!range) return tasks;
        return tasks.filter(task => inRange(toDateSafe(task.startedAt)));
    }, [tasks, range]);

    const leadTimes = useMemo(() => calculateLeadTimes(scopedTasksForLead), [scopedTasksForLead]);
    const estimation = useMemo(() => calculateEstimationAccuracy(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    const cramming = useMemo(() => calculateCrammingScores(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    const workByTime = useMemo(() => calculateWorkTimeByTimeOfDay(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    const stalledTasks = useMemo(() => detectStalledTasks(tasks, timeLogs), [tasks, timeLogs]);

    const estimationConsistent = useMemo(() => isEstimationConsistent(estimation), [estimation]);
    const maxBandTotal = useMemo(
        () => Math.max(1, ...workByTime.map(b => b.total)),
        [workByTime]
    );

    if (!isOpen) return null;

    return (
        <>
            {/* バックドロップ */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* モーダル本体 */}
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-3 sm:p-4 pointer-events-none">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl rounded-3xl p-5 sm:p-7 flex flex-col justify-between font-sans pointer-events-auto relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    <div className="space-y-6">
                        {/* ヘッダー */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 sticky -top-5 sm:-top-7 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-1 z-10 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                                    <span>{ANALYTICS_PANEL.header}</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                    title="閉じる"
                                    aria-label="閉じる"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* 集計期間の切り替え（今月／全期間） */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
                                {[
                                    { key: 'month', label: ANALYTICS_PANEL.period.month },
                                    { key: 'all', label: ANALYTICS_PANEL.period.all },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => setPeriod(opt.key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${period === opt.key
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── 1. 着手リードタイム ─────────────────────────── */}
                        <AnalyticsCard
                            icon={ANALYTICS_PANEL.leadTime.icon}
                            title={ANALYTICS_PANEL.leadTime.title}
                            description={ANALYTICS_PANEL.leadTime.description}
                        >
                            <div className="space-y-2.5">
                                {leadTimes.map((item) => {
                                    const colors = getSizeColor(item.sizeLabel);
                                    const hasData = item.count > 0;
                                    const isBeforeDeadline = item.averageDays >= 0;
                                    return (
                                        <div
                                            key={item.sizeLabel}
                                            className={`border ${colors.border} ${colors.lightBg} p-3 rounded-xl flex justify-between items-center shadow-2xs`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-base font-black ${colors.text} bg-white dark:bg-slate-850 border ${colors.border} w-7 h-7 rounded-full flex items-center justify-center shadow-xs`}>
                                                    {item.sizeLabel}
                                                </span>
                                                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {SIZE_DESCRIPTION[item.sizeLabel]}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {hasData ? (
                                                    <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                                                        {isBeforeDeadline ? (
                                                            <>{ANALYTICS_PANEL.leadTime.beforeDeadlinePrefix}{item.averageDays.toFixed(1)} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{ANALYTICS_PANEL.leadTime.beforeDeadlineUnit}</span></>
                                                        ) : (
                                                            <>{ANALYTICS_PANEL.leadTime.afterDeadlinePrefix}{Math.abs(item.averageDays).toFixed(1)} <span className="text-xs font-bold text-red-500">{ANALYTICS_PANEL.leadTime.afterDeadlineUnit}</span></>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{ANALYTICS_PANEL.noData}</span>
                                                )}
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{ANALYTICS_PANEL.leadTime.countLabel(item.count)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </AnalyticsCard>

                        {/* ── 2. 見積もり精度：SML × 実働時間 ──────────── */}
                        <AnalyticsCard
                            icon={ANALYTICS_PANEL.estimation.icon}
                            title={ANALYTICS_PANEL.estimation.title}
                            description={ANALYTICS_PANEL.estimation.description}
                        >
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {estimation.map((item) => {
                                    const colors = getSizeColor(item.sizeLabel);
                                    const hasData = item.count > 0;
                                    return (
                                        <div
                                            key={item.sizeLabel}
                                            className={`border ${colors.border} ${colors.lightBg} p-3 rounded-xl flex flex-col items-center text-center shadow-2xs`}
                                        >
                                            <span className={`text-sm font-black ${colors.text} bg-white dark:bg-slate-850 border ${colors.border} w-7 h-7 rounded-full flex items-center justify-center shadow-xs mb-1.5`}>
                                                {item.sizeLabel}
                                            </span>
                                            {hasData ? (
                                                <>
                                                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                                                        {formatMinutes(item.avgMinutes)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{ANALYTICS_PANEL.estimation.avgLabel(item.count)}</span>
                                                </>
                                            ) : (
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">{ANALYTICS_PANEL.noData}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {estimation.filter(e => e.count > 0).length >= 2 && (
                                <div className={`p-3 rounded-xl text-center border ${
                                    estimationConsistent 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                }`}>
                                    <p className={`text-xs font-bold leading-relaxed ${
                                        estimationConsistent ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                                    }`}>
                                        {estimationConsistent
                                            ? ANALYTICS_PANEL.estimation.consistentMessage
                                            : ANALYTICS_PANEL.estimation.inconsistentMessage}
                                    </p>
                                </div>
                            )}
                        </AnalyticsCard>

                        {/* ── 3. 一夜漬け度 ────────────────────────────── */}
                        <AnalyticsCard
                            icon={ANALYTICS_PANEL.cramming.icon}
                            title={ANALYTICS_PANEL.cramming.title}
                            description={ANALYTICS_PANEL.cramming.description}
                        >
                            {cramming.taskCount === 0 ? (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 p-4 rounded-xl text-center">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{ANALYTICS_PANEL.cramming.empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* 全体ゲージ */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 p-4 rounded-xl">
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{ANALYTICS_PANEL.cramming.overallLabel}</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                                {Math.round(cramming.overallRatio * 100)}<span className="text-sm">%</span>
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all"
                                                style={{ width: `${Math.round(cramming.overallRatio * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-2">
                                            {ANALYTICS_PANEL.cramming.summaryLabel(cramming.taskCount, cramming.crammedTaskCount)}
                                        </p>
                                    </div>

                                    {/* サイズ別 */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {cramming.bySize.map((item) => {
                                            const colors = getSizeColor(item.sizeLabel);
                                            return (
                                                <div key={item.sizeLabel} className={`border ${colors.border} ${colors.lightBg} p-2.5 rounded-xl text-center shadow-2xs`}>
                                                    <span className={`text-xs font-black ${colors.text}`}>{item.sizeLabel}</span>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                                                        {item.ratio === null ? '—' : `${Math.round(item.ratio * 100)}%`}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{item.count}件</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 一夜漬け上位 */}
                                    {cramming.topTasks.filter(t => t.ratio > 0).length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{ANALYTICS_PANEL.cramming.topTasksLabel}</p>
                                            {cramming.topTasks.filter(t => t.ratio > 0).map((t) => (
                                                <div key={t.taskId} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 rounded-xl px-3 py-2">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{t.title}</span>
                                                    <span className="text-xs font-black text-rose-500 flex-shrink-0">{Math.round(t.ratio * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </AnalyticsCard>

                        {/* ── 4. よく作業する時間帯 ───────────────────── */}
                        <AnalyticsCard
                            icon={ANALYTICS_PANEL.timeOfDay.icon}
                            title={ANALYTICS_PANEL.timeOfDay.title}
                            description={ANALYTICS_PANEL.timeOfDay.description}
                        >
                            {workByTime.every(b => b.total === 0) ? (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 p-4 rounded-xl text-center">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{ANALYTICS_PANEL.timeOfDay.empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {workByTime.map((band) => {
                                        const hasData = band.total > 0;
                                        return (
                                            <div key={band.key} className="flex items-center gap-3">
                                                <div className="w-14 flex-shrink-0 text-right">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{band.label}</p>
                                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{band.range}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="h-5 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-750"
                                                        title={`${band.label}: ${formatMinutes(band.total)}`}
                                                    >
                                                        {hasData && (
                                                            <div
                                                                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-lg transition-all"
                                                                style={{ width: `${Math.max(8, (band.total / maxBandTotal) * 100)}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="w-16 flex-shrink-0 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                    {hasData ? formatMinutes(band.total) : '—'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </AnalyticsCard>

                        {/* ── 5. 放置タスク検出 ────────────────────────── */}
                        <AnalyticsCard
                            icon={ANALYTICS_PANEL.stalled.icon}
                            title={ANALYTICS_PANEL.stalled.title}
                            description={ANALYTICS_PANEL.stalled.description}
                        >
                            {stalledTasks.length === 0 ? (
                                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 p-4 rounded-xl text-center">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{ANALYTICS_PANEL.stalled.empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stalledTasks.map((t) => {
                                        const colors = getSizeColor(t.sizeLabel);
                                        return (
                                            <div key={t.taskId} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 rounded-xl px-3 py-2.5 shadow-xs">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {t.sizeLabel && (
                                                        <span className={`text-xs font-black ${colors.text} bg-white dark:bg-slate-850 border ${colors.border} w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>
                                                            {t.sizeLabel}
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{t.title}</p>
                                                        {t.isOverdue && (
                                                            <span className="text-[10px] font-bold text-red-500">{ANALYTICS_PANEL.stalled.overdueLabel}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                                                    {Math.floor(t.stalledDays)}日<span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{ANALYTICS_PANEL.stalled.stalledSuffix}</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </AnalyticsCard>
                    </div>

                    {/* 下部アクション */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl text-center text-xs sm:text-sm transition duration-200 shadow-xs active:scale-95 pointer-events-auto"
                        >
                            {ANALYTICS_PANEL.closeButton}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
