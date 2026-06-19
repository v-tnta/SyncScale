import React, { useMemo, useState } from "react";
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
    S: { text: 'text-cyan-600', lightBg: 'bg-cyan-50', border: 'border-cyan-200' },
    M: { text: 'text-orange-600', lightBg: 'bg-orange-50', border: 'border-orange-200' },
    L: { text: 'text-red-600', lightBg: 'bg-red-50', border: 'border-red-200' },
};
const getSizeColor = (size) =>
    SIZE_COLORS[size] || { text: 'text-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200' };

const SIZE_DESCRIPTION = ANALYTICS_PANEL.sizeDescription;

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

    // 選択期間で作業ログを絞り込む（基準は startTime → endTime → createdAt）
    const scopedTimeLogs = useMemo(() => {
        if (!range) return timeLogs;
        return timeLogs.filter(log => inRange(toDateSafe(log.startTime || log.endTime || log.createdAt)));
    }, [timeLogs, range]);

    // 着手リードタイムは「その期間に着手したタスク」を対象にする
    const scopedTasksForLead = useMemo(() => {
        if (!range) return tasks;
        return tasks.filter(task => inRange(toDateSafe(task.startedAt)));
    }, [tasks, range]);

    // フックは早期 return より前で呼ぶ（React Hooks のルール）。
    // isOpen による早期 return の後に useMemo を置くと、開閉のたびに
    // 呼ばれるフック数が変わり「Rendered more hooks than during the previous render」で
    // クラッシュするため、必ず return より上で呼ぶ。
    const leadTimes = useMemo(() => calculateLeadTimes(scopedTasksForLead), [scopedTasksForLead]);
    const estimation = useMemo(() => calculateEstimationAccuracy(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    const cramming = useMemo(() => calculateCrammingScores(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    const workByTime = useMemo(() => calculateWorkTimeByTimeOfDay(tasks, scopedTimeLogs), [tasks, scopedTimeLogs]);
    // 放置タスクは「今まさに止まっているか」を示すため、期間に関わらず常に最新状態で判定する
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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
                onClick={onClose}
            ></div>

            {/* モーダル本体 */}
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-4 pointer-events-none">
                <div className="w-full max-w-lg bg-white border border-gray-200 text-gray-800 shadow-2xl rounded-3xl p-6 flex flex-col justify-between font-sans pointer-events-auto relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                    <div className="space-y-7">
                        {/* ヘッダー */}
                        <div className="border-b border-gray-200 pb-4 sticky -top-6 bg-white/95 backdrop-blur-sm pt-1 z-10 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black flex items-center gap-2 text-gray-900">
                                    <span>📈</span> {ANALYTICS_PANEL.header}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg text-sm transition"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* 集計期間の切り替え（今月／全期間） */}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                                {[
                                    { key: 'month', label: ANALYTICS_PANEL.period.month },
                                    { key: 'all', label: ANALYTICS_PANEL.period.all },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setPeriod(opt.key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${period === opt.key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── 着手リードタイム ─────────────────────────── */}
                        <Section
                            icon={ANALYTICS_PANEL.leadTime.icon}
                            title={ANALYTICS_PANEL.leadTime.title}
                            description={ANALYTICS_PANEL.leadTime.description}
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
                                                            <>{ANALYTICS_PANEL.leadTime.beforeDeadlinePrefix}{item.averageDays.toFixed(1)} <span className="text-xs font-bold text-gray-500">{ANALYTICS_PANEL.leadTime.beforeDeadlineUnit}</span></>
                                                        ) : (
                                                            <>{ANALYTICS_PANEL.leadTime.afterDeadlinePrefix}{Math.abs(item.averageDays).toFixed(1)} <span className="text-xs font-bold text-red-500">{ANALYTICS_PANEL.leadTime.afterDeadlineUnit}</span></>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-400">{ANALYTICS_PANEL.noData}</span>
                                                )}
                                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{ANALYTICS_PANEL.leadTime.countLabel(item.count)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 1. 見積もり精度：SML × 実働時間 ──────────── */}
                        <Section
                            icon={ANALYTICS_PANEL.estimation.icon}
                            title={ANALYTICS_PANEL.estimation.title}
                            description={ANALYTICS_PANEL.estimation.description}
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
                                                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{ANALYTICS_PANEL.estimation.avgLabel(item.count)}</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400 mt-1">{ANALYTICS_PANEL.noData}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* 実績のあるサイズ（count>0）が2つ以上あるときだけ、一貫性/逆転のコメントを表示する */}
                            {estimation.filter(e => e.count > 0).length >= 2 && (
                                <div className={`p-3 rounded-2xl text-center border ${estimationConsistent ? 'bg-emerald-50 border-emerald-200/60' : 'bg-amber-50 border-amber-200/60'}`}>
                                    <p className={`text-xs font-bold leading-relaxed ${estimationConsistent ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {estimationConsistent
                                            ? ANALYTICS_PANEL.estimation.consistentMessage
                                            : ANALYTICS_PANEL.estimation.inconsistentMessage}
                                    </p>
                                </div>
                            )}
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 2. 一夜漬け度 ────────────────────────────── */}
                        <Section
                            icon={ANALYTICS_PANEL.cramming.icon}
                            title={ANALYTICS_PANEL.cramming.title}
                            description={ANALYTICS_PANEL.cramming.description}
                        >
                            {cramming.taskCount === 0 ? (
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-slate-500">{ANALYTICS_PANEL.cramming.empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* 全体ゲージ */}
                                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500">{ANALYTICS_PANEL.cramming.overallLabel}</span>
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
                                            {ANALYTICS_PANEL.cramming.summaryLabel(cramming.taskCount, cramming.crammedTaskCount)}
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
                                            <p className="text-[11px] font-bold text-gray-400">{ANALYTICS_PANEL.cramming.topTasksLabel}</p>
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

                        {/* ── 3. よく作業する時間帯 ───────────────────── */}
                        <Section
                            icon={ANALYTICS_PANEL.timeOfDay.icon}
                            title={ANALYTICS_PANEL.timeOfDay.title}
                            description={ANALYTICS_PANEL.timeOfDay.description}
                        >
                            {workByTime.every(b => b.total === 0) ? (
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-slate-500">{ANALYTICS_PANEL.timeOfDay.empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {workByTime.map((band) => {
                                        const hasData = band.total > 0;
                                        return (
                                            <div key={band.key} className="flex items-center gap-3">
                                                <div className="w-14 flex-shrink-0 text-right">
                                                    <p className="text-xs font-black text-gray-700">{band.label}</p>
                                                    <p className="text-[9px] text-gray-400 font-semibold">{band.range}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="h-6 rounded-lg overflow-hidden bg-gray-100"
                                                        title={`${band.label}: ${formatMinutes(band.total)}`}
                                                    >
                                                        {hasData && (
                                                            <div
                                                                className="h-full bg-emerald-400 rounded-lg transition-all"
                                                                style={{ width: `${Math.max(8, (band.total / maxBandTotal) * 100)}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="w-16 flex-shrink-0 text-right text-[10px] font-bold text-gray-400">
                                                    {hasData ? formatMinutes(band.total) : '—'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>

                        <hr className="border-gray-100" />

                        {/* ── 4. 放置タスク検出 ────────────────────────── */}
                        <Section
                            icon={ANALYTICS_PANEL.stalled.icon}
                            title={ANALYTICS_PANEL.stalled.title}
                            description={ANALYTICS_PANEL.stalled.description}
                        >
                            {stalledTasks.length === 0 ? (
                                <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-emerald-700">{ANALYTICS_PANEL.stalled.empty}</p>
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
                                                            <span className="text-[9px] font-bold text-red-500">{ANALYTICS_PANEL.stalled.overdueLabel}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-amber-600 flex-shrink-0">
                                                    {Math.floor(t.stalledDays)}日<span className="text-[10px] font-bold text-gray-400">{ANALYTICS_PANEL.stalled.stalledSuffix}</span>
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
                            {ANALYTICS_PANEL.closeButton}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
