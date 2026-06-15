/**
 * Analytics Domain
 * 分析タブで使う集計ロジックを純粋関数として集約します。
 * Presentation（AnalyticsPanel）からは表示に専念させ、ここで計算を完結させます。
 * 定義は Flutter 版（mobile-app/lib/models/analytics.dart）と一致させること。
 */

// ---- 共通ヘルパー -----------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;

// Firestore Timestamp / Date / 文字列のいずれでも Date に正規化する
function toDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

// 分析対象から除外するタスク（チュートリアル用ダミー）
function isAnalyzableTask(task) {
    return task && !task.isTutorialTask;
}

// 指定タスクの実働時間（秒）合計
function sumDurationSeconds(taskId, timeLogs) {
    return timeLogs
        .filter(log => log.taskId === taskId)
        .reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
}

// ---- 着手リードタイム（既存仕様を移設） -------------------------------------

// S/M/L別のリードタイム算出（締切日 - 着手日の平均日数）
export function calculateLeadTimes(tasks) {
    const summaries = [];
    for (const size of ['S', 'M', 'L']) {
        const matchedTasks = tasks.filter(task =>
            task.sizeLabel === size &&
            task.deadline &&
            task.startedAt
        );

        const days = matchedTasks.map(task => {
            const deadlineDate = toDate(task.deadline);
            const startedAtDate = toDate(task.startedAt);
            if (!deadlineDate || !startedAtDate) return null;
            return (deadlineDate.getTime() - startedAtDate.getTime()) / MS_PER_DAY;
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

// ---- 1. 見積もり精度：SML × 実働時間 ----------------------------------------

/**
 * S/M/L ラベルごとに、実際に費やした作業時間（timeLogs 合計）の平均を算出する。
 * 「Sのつもりが実はMより重かった」等の見積もりズレを可視化する。
 * @returns {{sizeLabel:string, count:number, avgMinutes:number, totalMinutes:number}[]}
 */
export function calculateEstimationAccuracy(tasks, timeLogs = []) {
    const summaries = [];
    for (const size of ['S', 'M', 'L']) {
        const minutesList = tasks
            .filter(task => isAnalyzableTask(task) && task.sizeLabel === size)
            .map(task => sumDurationSeconds(task.id, timeLogs) / 60)
            .filter(minutes => minutes > 0); // 実働ログがあるタスクのみ

        if (minutesList.length === 0) {
            summaries.push({ sizeLabel: size, count: 0, avgMinutes: 0, totalMinutes: 0 });
            continue;
        }

        const totalMinutes = minutesList.reduce((sum, m) => sum + m, 0);
        summaries.push({
            sizeLabel: size,
            count: minutesList.length,
            avgMinutes: totalMinutes / minutesList.length,
            totalMinutes
        });
    }
    return summaries;
}

/**
 * S→M→L の平均作業時間が単調増加になっているか（見積もりの一貫性）を判定する。
 * count>0 のサイズだけを対象に、逆転があれば false。
 */
export function isEstimationConsistent(accuracy) {
    const valid = accuracy.filter(a => a.count > 0);
    for (let i = 1; i < valid.length; i++) {
        if (valid[i].avgMinutes < valid[i - 1].avgMinutes) return false;
    }
    return valid.length >= 2;
}

// ---- 2. 一夜漬け度 ----------------------------------------------------------

const CRAMMING_WINDOW_HOURS = 24; // 締切この時間前以降の作業を「一夜漬け」とみなす
const CRAMMING_THRESHOLD = 0.5;   // この比率以上で「一夜漬けタスク」と判定

/**
 * タスクごとに、全作業時間のうち「締切24時間前以降（超過分含む）」に行った割合を算出する。
 * @returns {{
 *   overallRatio: number|null,
 *   taskCount: number,
 *   crammedTaskCount: number,
 *   bySize: {sizeLabel:string, ratio:number|null, count:number}[],
 *   topTasks: {taskId:string, title:string, sizeLabel:string|null, ratio:number}[]
 * }}
 */
export function calculateCrammingScores(tasks, timeLogs = []) {
    const perTask = [];

    for (const task of tasks) {
        if (!isAnalyzableTask(task)) continue;
        const deadline = toDate(task.deadline);
        if (!deadline) continue;

        const logs = timeLogs.filter(log => log.taskId === task.id);
        const totalSec = logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
        if (totalSec <= 0) continue;

        const crammedThreshold = deadline.getTime() - CRAMMING_WINDOW_HOURS * MS_PER_HOUR;
        const crammedSec = logs.reduce((sum, log) => {
            const start = toDate(log.startTime) || toDate(log.endTime);
            if (start && start.getTime() >= crammedThreshold) {
                return sum + (log.durationSeconds || 0);
            }
            return sum;
        }, 0);

        perTask.push({
            taskId: task.id,
            title: task.title,
            sizeLabel: task.sizeLabel || null,
            ratio: crammedSec / totalSec
        });
    }

    const averageRatio = (list) =>
        list.length === 0 ? null : list.reduce((s, x) => s + x.ratio, 0) / list.length;

    const bySize = ['S', 'M', 'L'].map(size => {
        const list = perTask.filter(t => t.sizeLabel === size);
        return { sizeLabel: size, ratio: averageRatio(list), count: list.length };
    });

    return {
        overallRatio: averageRatio(perTask),
        taskCount: perTask.length,
        crammedTaskCount: perTask.filter(t => t.ratio >= CRAMMING_THRESHOLD).length,
        bySize,
        topTasks: [...perTask].sort((a, b) => b.ratio - a.ratio).slice(0, 3)
    };
}

// ---- 3. 時間帯 × コンディション ---------------------------------------------

// 時間帯の定義（24時間を4分割）
export const TIME_BANDS = [
    { key: 'midnight', label: '深夜', range: '0-6時', startHour: 0, endHour: 6 },
    { key: 'morning', label: '午前', range: '6-12時', startHour: 6, endHour: 12 },
    { key: 'afternoon', label: '午後', range: '12-18時', startHour: 12, endHour: 18 },
    { key: 'night', label: '夜', range: '18-24時', startHour: 18, endHour: 24 }
];

function bandKeyOf(hour) {
    const band = TIME_BANDS.find(b => hour >= b.startHour && hour < b.endHour);
    return band ? band.key : 'night';
}

/**
 * 「どの時間帯に作業したタスクが、どんなコンディション（good/fair/poor）で終わったか」を集計する。
 * 各作業ログをタスクのコンディションに紐付け、作業時間（分）で重み付けして時間帯別に積み上げる。
 * @returns {{key:string, label:string, range:string, good:number, fair:number, poor:number, total:number}[]}
 */
export function calculateConditionByTimeOfDay(tasks, timeLogs = [], conditionLogs = []) {
    // 除外対象（チュートリアル）のタスクIDセット
    const excludedTaskIds = new Set(
        tasks.filter(t => !isAnalyzableTask(t)).map(t => t.id)
    );

    // taskId -> 最新のコンディション
    const conditionByTask = {};
    for (const log of conditionLogs) {
        const created = toDate(log.createdAt);
        const prev = conditionByTask[log.taskId];
        if (!prev || (created && prev.createdAt && created.getTime() > prev.createdAt.getTime()) || !prev.createdAt) {
            conditionByTask[log.taskId] = { condition: log.condition, createdAt: created };
        }
    }

    const result = TIME_BANDS.map(b => ({
        key: b.key, label: b.label, range: b.range, good: 0, fair: 0, poor: 0, total: 0
    }));
    const indexByKey = Object.fromEntries(result.map((r, i) => [r.key, i]));

    for (const log of timeLogs) {
        if (excludedTaskIds.has(log.taskId)) continue;
        const cond = conditionByTask[log.taskId];
        if (!cond) continue;
        const start = toDate(log.startTime);
        if (!start) continue;

        const minutes = (log.durationSeconds || 0) / 60;
        if (minutes <= 0) continue;

        const bucket = result[indexByKey[bandKeyOf(start.getHours())]];
        if (cond.condition === 'good') bucket.good += minutes;
        else if (cond.condition === 'poor') bucket.poor += minutes;
        else bucket.fair += minutes;
        bucket.total += minutes;
    }

    return result;
}

// ---- 4. 放置タスク検出 ------------------------------------------------------

const STALLED_THRESHOLD_DAYS = 3; // 最終作業からこの日数以上で「放置」と判定

/**
 * 「とりかかり中（DOING）のまま一定日数作業していない」タスクを検出する。
 * 最終作業日時 = そのタスクの timeLogs の最新 endTime（無ければ startedAt/updatedAt）。
 * @returns {{taskId:string, title:string, sizeLabel:string|null, lastActivityAt:Date|null,
 *            stalledDays:number, isOverdue:boolean, deadline:Date|null}[]}
 */
export function detectStalledTasks(tasks, timeLogs = [], options = {}) {
    const now = options.now ? toDate(options.now) : new Date();
    const thresholdDays = options.thresholdDays ?? STALLED_THRESHOLD_DAYS;
    const stalled = [];

    for (const task of tasks) {
        if (!isAnalyzableTask(task)) continue;
        if (task.status !== 'DOING') continue;

        // 最終作業日時を求める
        const logTimes = timeLogs
            .filter(log => log.taskId === task.id)
            .map(log => toDate(log.endTime) || toDate(log.startTime))
            .filter(Boolean);

        let lastActivityAt = logTimes.length > 0
            ? new Date(Math.max(...logTimes.map(d => d.getTime())))
            : (toDate(task.startedAt) || toDate(task.updatedAt));

        if (!lastActivityAt) continue;

        const stalledDays = (now.getTime() - lastActivityAt.getTime()) / MS_PER_DAY;
        if (stalledDays < thresholdDays) continue;

        const deadline = toDate(task.deadline);
        stalled.push({
            taskId: task.id,
            title: task.title,
            sizeLabel: task.sizeLabel || null,
            lastActivityAt,
            stalledDays,
            deadline,
            isOverdue: !!deadline && now.getTime() > deadline.getTime()
        });
    }

    return stalled.sort((a, b) => b.stalledDays - a.stalledDays);
}
