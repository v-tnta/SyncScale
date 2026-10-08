import React, { useState, useMemo } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// momentのロケール設定 (日本語)
import 'moment/locale/ja'
import { getSizeHexColor, getSizeContrastHexColor } from '../domain/taskSize'
import { CALENDAR } from '../content'
moment.locale('ja')

const localizer = momentLocalizer(moment)

const JAPANESE_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const formatJapaneseDay = (date, includeYear = false) => {
    const year = includeYear ? `${date.getFullYear()}年` : ''
    return `${year}${date.getMonth() + 1}月${date.getDate()}日(${JAPANESE_WEEKDAYS[date.getDay()]})`
}

// カレンダー内の年月日を日本語表記で固定
const calendarFormats = {
    dateFormat: (date) => `${date.getDate()}`,
    dayFormat: (date) => formatJapaneseDay(date),
    weekdayFormat: (date) => JAPANESE_WEEKDAYS[date.getDay()],
    monthHeaderFormat: 'YYYY年M月',
    dayHeaderFormat: (date) => formatJapaneseDay(date, true),
    dayRangeHeaderFormat: ({ start, end }, culture, activeLocalizer) =>
        `${activeLocalizer.format(start, 'YYYY年M月D日', culture)} ～ ${activeLocalizer.format(end, 'M月D日', culture)}`,
    agendaDateFormat: (date) => formatJapaneseDay(date),
    timeGutterFormat: 'H:mm',
}

// Firestore Timestamp / Date / 文字列のいずれでも Date に正規化する
const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

// 視認できる最低の帯の高さ（分）
const MIN_WORKLOG_MINUTES = 10;

const Calendar = ({ tasks = [], onEventClick, timeLogs = [] }) => {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    // 未完了タスクの抽出
    const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'DONE'), [tasks]);

    // 日付ごとの未完了締切タスクのマップ
    const deadlineTasksByDay = useMemo(() => {
        const map = new Map();
        for (const task of activeTasks) {
            const d = toDate(task.deadline);
            if (!d) continue;
            const key = dayKey(d);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(task);
        }
        return map;
    }, [activeTasks]);

    // 作業ログ件数（月表示での草風ドット用）
    const activityCountByDay = useMemo(() => {
        const map = new Map();
        for (const log of timeLogs) {
            const raw = log.startTime || log.endTime || log.createdAt;
            if (!raw) continue;
            const d = raw instanceof Date ? raw : (raw?.toDate ? raw.toDate() : new Date(raw));
            if (isNaN(d.getTime())) continue;
            const key = dayKey(d);
            map.set(key, (map.get(key) || 0) + 1);
        }
        return map;
    }, [timeLogs]);

    // 日付ヘッダーコンポーネント（S/M/L円背景、分割円、今日ハイライト）
    const CustomDateHeader = ({ date: cellDate, label, isOffRange }) => {
        const key = dayKey(cellDate);
        const dayTasks = deadlineTasksByDay.get(key) || [];

        const today = new Date();
        const isToday = dayKey(today) === key;
        const hasDeadline = dayTasks.length > 0;

        let deadlineBgStyle = null;
        if (hasDeadline) {
            // ユニークなサイズ一覧
            const sizes = Array.from(new Set(dayTasks.map(t => (t.sizeLabel || '').toUpperCase())));
            const colors = sizes.map(s => getSizeContrastHexColor(s));
            if (colors.length === 1) {
                deadlineBgStyle = { backgroundColor: colors[0] };
            } else {
                // 複数サイズの場合は conic-gradient で円を等分割
                const sliceDeg = 360 / colors.length;
                const stops = colors.map((c, i) => `${c} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`).join(', ');
                deadlineBgStyle = { background: `conic-gradient(${stops})` };
            }
        }

        const numberContent = hasDeadline ? (
            <span
                style={deadlineBgStyle}
                className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[11px] sm:text-xs font-black shadow-xs shrink-0 select-none transition-transform hover:scale-110"
                title={`締切課題 ${dayTasks.length}件:\n${dayTasks.map(t => `・${t.title} (${t.sizeLabel || '未設定'})`).join('\n')}`}
            >
                {label}
            </span>
        ) : (
            <span className={`text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${
                isOffRange 
                    ? 'text-slate-300 dark:text-slate-600' 
                    : isToday 
                    ? 'text-blue-600 dark:text-blue-400 font-black' 
                    : 'text-slate-700 dark:text-slate-300'
            }`}>
                {label}
            </span>
        );

        return (
            <div className="flex items-center justify-center pt-1 pb-0.5 px-0.5">
                {isToday ? (
                    <div className={`p-0.5 rounded-lg flex items-center justify-center ${
                        hasDeadline ? 'bg-blue-100/80 dark:bg-blue-950/70 ring-1 ring-blue-300 dark:ring-blue-700' : 'bg-blue-50 dark:bg-blue-950/40'
                    }`}>
                        {numberContent}
                    </div>
                ) : (
                    numberContent
                )}
            </div>
        );
    };

    // 月表示の日付セル下部に作業ログの点（緑色の点）を表示
    const components = useMemo(() => ({
        month: {
            dateHeader: CustomDateHeader,
        },
        dateCellWrapper: ({ children, value }) => {
            const count = activityCountByDay.get(dayKey(value)) || 0;
            if (count <= 0) return children;
            const dotCount = Math.min(count, 3);
            const dots = (
                <div
                    key="activity-dots"
                    style={{
                        position: 'absolute',
                        bottom: 3,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '3px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {Array.from({ length: dotCount }).map((_, i) => (
                        <span
                            key={i}
                            style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#22c55e' }}
                        />
                    ))}
                </div>
            );
            return React.cloneElement(
                children,
                { style: { ...(children.props.style || {}), position: 'relative' } },
                children.props.children,
                dots
            );
        },
    }), [activityCountByDay, deadlineTasksByDay]);

    // 週表示での作業時間ログ帯の生成
    const workLogEvents = useMemo(() => {
        if (view !== 'week') return [];
        const segments = [];
        for (const log of timeLogs) {
            const start = toDate(log.startTime);
            if (!start) continue;

            let end = toDate(log.endTime);
            const durationMs = (log.durationSeconds || 0) * 1000;
            if (!end || end.getTime() <= start.getTime()) {
                end = new Date(start.getTime() + durationMs);
            }
            if (end.getTime() <= start.getTime()) {
                end = new Date(start.getTime() + 60 * 1000);
            }

            const name = log.subTaskName || CALENDAR.workLog.defaultName;

            let segStart = start;
            while (segStart.getTime() < end.getTime()) {
                const dayEnd = new Date(
                    segStart.getFullYear(), segStart.getMonth(), segStart.getDate() + 1, 0, 0, 0, 0
                );
                const dayBoundaryMs = dayEnd.getTime() - 1;
                const reachesBoundary = end.getTime() >= dayEnd.getTime();
                const segEndMs = reachesBoundary ? dayBoundaryMs : end.getTime();
                const minutes = Math.max(1, Math.round((segEndMs - segStart.getTime()) / 60000));

                let displayEndMs = segEndMs;
                const minEndMs = segStart.getTime() + MIN_WORKLOG_MINUTES * 60 * 1000;
                if (displayEndMs < minEndMs) {
                    displayEndMs = Math.min(minEndMs, dayBoundaryMs);
                }

                segments.push({
                    title: CALENDAR.workLog.title(name, minutes),
                    start: segStart,
                    end: new Date(displayEndMs),
                    allDay: false,
                    isWorkLog: true,
                });

                segStart = dayEnd;
            }
        }
        return segments;
    }, [timeLogs, view]);

    // 締切イベントの生成
    const deadlineEvents = useMemo(() => {
        return activeTasks.map(task => {
            const d = toDate(task.deadline);
            if (!d) return null;

            return {
                title: task.title,
                start: d,
                end: d,
                allDay: true,
                resource: task,
                status: task.status,
                sizeLabel: task.sizeLabel
            };
        }).filter(Boolean);
    }, [activeTasks]);

    // 締切イベント＋作業ログの帯を合成
    const events = useMemo(() => [...deadlineEvents, ...workLogEvents], [deadlineEvents, workLogEvents]);

    // イベントスタイル (色分け)
    const eventPropGetter = (event) => {
        if (event.isWorkLog) {
            return {
                style: {
                    backgroundColor: '#22c55e',
                    borderRadius: '6px',
                    opacity: 0.9,
                    color: 'white',
                    border: '0px',
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 'bold',
                }
            };
        }

        const backgroundColor = getSizeHexColor(event.sizeLabel);

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: event.status === 'DONE' ? 0.4 : 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                textDecoration: event.status === 'DONE' ? 'line-through' : 'none',
                fontSize: '12px',
                fontWeight: '600',
            }
        };
    };

    return (
        <div className="syncscale-calendar h-full min-h-[500px] bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col transition-colors duration-200">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', flex: 1 }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                views={['month', 'week']}
                step={60}
                timeslots={1}
                scrollToTime={new Date(1970, 0, 1, 0, 0, 0)}
                formats={calendarFormats}
                onSelectEvent={(event) => { if (event.resource) onEventClick(event.resource); }}
                eventPropGetter={eventPropGetter}
                components={components}
                messages={CALENDAR.messages}
            />
        </div>
    )
}

export default Calendar
