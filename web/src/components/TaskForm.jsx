import React, { useState } from 'react'

/**
 * タスク登録フォーム
 * 親コンポーネント(App)から addTask 関数を受け取り、実行します。
 */
const TaskForm = ({ addTask }) => {
    // 入力フォームの状態管理
    const [title, setTitle] = useState('');
    const [estimatedMinutes, setEstimatedMinutes] = useState('');
    const [deadline, setDeadline] = useState('');

    // フォーム送信時の処理
    const handleSubmit = (e) => {
        e.preventDefault();

        // 親から受け取った「追加機能」を実行してデータを渡す
        addTask({
            title,
            estimatedMinutes: Number(estimatedMinutes), // 数値に変換
            deadline
        });

        // フォームをクリアする
        setTitle('');
        setEstimatedMinutes('');
        setDeadline('');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">新規タスクの追加</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* タスク名入力 */}
                <div>
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

                <div className="flex gap-4">
                    {/* 見積もり時間入力 */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">見積もり時間 (分)</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="30"
                            value={estimatedMinutes}
                            onChange={(e) => setEstimatedMinutes(e.target.value)}
                            min="1"
                            required
                        />
                    </div>

                    {/* 締切日入力 */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">締切日</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* 登録ボタン */}
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    タスクを登録
                </button>
            </form>
        </div>
    )
}

export default TaskForm
