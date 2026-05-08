import React, { useState } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// momentのロケール設定 (日本語)
import 'moment/locale/ja'
moment.locale('ja')

const localizer = momentLocalizer(moment)

const Calendar = ({ tasks, onEventClick }) => {
    // 制御用ステート (ナビゲーションを正しく機能させるため)
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // タスクをカレンダーイベント形式に変換
    const events = tasks.map(task => {
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
            status: task.status
        };
    }).filter(event => event !== null); // null (締切なし) を除外

    // イベントスタイル (色分け)
    const eventPropGetter = (event) => {
        let backgroundColor = '#3174ad'; // Default Blue
        if (event.status === 'DONE') {
            backgroundColor = '#10B981'; // Green
        } else if (event.status === 'DOING') {
            backgroundColor = '#F59E0B'; // Yellow/Orange
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
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
