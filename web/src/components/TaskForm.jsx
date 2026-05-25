import React, { useState } from 'react'
import SizeLabelSelector from './SizeLabelSelector'
import DateTimePicker from './DateTimePicker'

/**
 * タスク登録フォーム
 * 親コンポーネント(App)から addTask 関数を受け取り、実行します。
 */
const TaskForm = ({ addTask, disabled, isTutorialActive }) => {
    // 初期値: 今日の 23:59
    const getTodayEndOfDay = () => {
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        return d;
    };

    // 入力フォームの状態管理
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState(getTodayEndOfDay());
    const [sizeLabel, setSizeLabel] = useState('S'); // 🆕 デフォルトは'S'とする

    // フォーム送信時の処理
    const handleSubmit = (e) => {
        e.preventDefault();

        // 親から受け取った「追加機能」を実行してデータを渡す
        addTask({
            title,
            deadline,
            sizeLabel // 🆕 相対見積もりラベルを追加
        });

        // フォームをクリアする
        setTitle('');
        setDeadline(getTodayEndOfDay());
        setSizeLabel('S');
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* タスク名入力 */}
                <div id="tutorial-title-input" className="transition-all duration-300 rounded-lg p-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">タスク名</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="例: 数学の課題、レポート作成"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="flex gap-4 flex-wrap">
                    {/* 締切日時入力 */}
                    <div className="flex-1 min-w-[150px] transition-all duration-300 rounded-lg p-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">締切日時</label>
                        <DateTimePicker
                            id="tutorial-deadline-input"
                            value={deadline}
                            onChange={setDeadline}
                            disabled={isTutorialActive}
                            isTutorialActive={isTutorialActive}
                        />
                    </div>
                </div>

                {/* 🆕 相対見積もり選択 */}
                <div id="tutorial-size-selector" className="transition-all duration-300 rounded-lg p-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">規模感 (相対見積もり)</label>
                    <SizeLabelSelector 
                        selectedLabel={sizeLabel} 
                        onSelect={setSizeLabel} 
                    />
                </div>

                {/* 登録ボタン */}
                <button
                    id="tutorial-submit-button"
                    type="submit"
                    disabled={disabled}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    タスクを登録
                </button>
            </form>
        </div>
    )
}

export default TaskForm
