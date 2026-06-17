import React, { useState } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// momentのロケール設定 (日本語)
import 'moment/locale/ja'
moment.locale('ja')

const localizer = momentLocalizer(moment)

const Calendar = ({ tasks, onEventClick, timeLogs = [] }) => {
    // 制御用ステート (ナビゲーションを正しく機能させるため)
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // 「作業を行った日」ごとの作業ログ件数（GitHubの草風インジケータ用）
    const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const activityCountByDay = React.useMemo(() => {
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

    // 日付セルの下部に、その日の作業件数ぶん（最大3つ）緑のマスを表示する
    const components = React.useMemo(() => ({
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
                        gap: '2px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {Array.from({ length: dotCount }).map((_, i) => (
                        <span
                            key={i}
                            style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22c55e' }}
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
    }), [activityCountByDay]);

    // 完了したタスクを除外し、カレンダーイベント形式に変換
    const activeTasks = tasks.filter(t => t.status !== 'DONE');
    
    const events = activeTasks.map(task => {
        let start = new Date();
        let end = new Date();
        let allDay = true;

        if (task.deadline) {
            if (task.deadline.seconds) {
                // Firestore Timestamp
                start = new Date(task.deadline.seconds * 1000);
            } else if (task.deadline instanceof Date) {
                // Date Object
                start = task.deadline;
            } else {
                // String or other
                const d = new Date(task.deadline);
                if (!isNaN(d.getTime())) {
                    start = d;
                }
            }
            // 締切日＝その日の終わりまで、あるいはその日一日
            end = start;
        } else {
            return null;
        }

        return {
            title: task.title,
            start: start,
            end: end,
            allDay: true, // 締切ベースなので終日扱い
            resource: task,
            // 完了したタスクの色を変えるなどのためのプロパティ
            status: task.status,
            sizeLabel: task.sizeLabel
        };
    }).filter(event => event !== null); // null (締切なし) を除外

    // イベントスタイル (色分け)
    const eventPropGetter = (event) => {
        let backgroundColor = '#3174ad'; // Default Blue
        
        switch (event.sizeLabel) {
            case 'S': backgroundColor = '#06b6d4'; break; // Cyan-500
            case 'M': backgroundColor = '#f97316'; break; // Orange-500
            case 'L': backgroundColor = '#ef4444'; break; // Red-500
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: event.status === 'DONE' ? 0.4 : 0.85,
                color: 'white',
                border: '0px',
                display: 'block',
                textDecoration: event.status === 'DONE' ? 'line-through' : 'none'
            }
        };
    };

    // ナビゲーションハンドラ
    const onNavigate = (newDate) => {
        setDate(newDate);
    };

    const onView = (newView) => {
        setView(newView);
    };

    return (
        <div className="h-[660px] bg-white p-4 rounded-lg shadow-md">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                // Controlled props
                view={view}
                onView={onView}
                date={date}
                onNavigate={onNavigate}
                // Views configuration (remove 'day')
                views={['month', 'week']}
                onSelectEvent={(event) => onEventClick(event.resource)}
                eventPropGetter={eventPropGetter}
                components={components}
                messages={{
                    next: "次へ",
                    previous: "前へ",
                    today: "今日",
                    month: "月",
                    week: "週",
                    date: "日付",
                    time: "時間",
                    event: "イベント",
                    noEventsInRange: "この期間にタスクはありません",
                }}
            />
        </div>
    )
}

export default Calendar
