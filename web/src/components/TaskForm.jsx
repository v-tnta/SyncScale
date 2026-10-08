import React, { useState, useEffect, useRef } from 'react'
import SizeLabelSelector from './SizeLabelSelector'
import DateTimePicker from './DateTimePicker'
import { TASK_FORM } from '../content'

/**
 * タスク登録フォーム
 * インライン展開可能なデザイン。
 * 親コンポーネントから addTask 関数、onCancel 関数などを受け取ります。
 */
const TaskForm = ({ addTask, onCancel, disabled, isTutorialActive }) => {
    // 初期値: 今日の 23:59
    const getTodayEndOfDay = () => {
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        return d;
    };

    // 入力フォームの状態管理
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState(getTodayEndOfDay());
    const [sizeLabel, setSizeLabel] = useState('');
    const titleInputRef = useRef(null);

    useEffect(() => {
        // マウント時に入力欄へフォーカス
        if (titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, []);

    // フォーム送信時の処理
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !sizeLabel) return;

        addTask({
            title: title.trim(),
            deadline,
            sizeLabel
        });

        // フォームをクリア
        setTitle('');
        setDeadline(getTodayEndOfDay());
        setSizeLabel('');

        // 完了コールバックがあれば呼ぶ
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* タスク名入力 */}
            <div id="tutorial-title-input" className="transition-all duration-200">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {TASK_FORM.titleLabel} <span className="text-red-500">*</span>
                </label>
                <input
                    ref={titleInputRef}
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400"
                    placeholder={TASK_FORM.titlePlaceholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div className="flex gap-4 flex-wrap">
                {/* 締切日時入力 */}
                <div className="flex-1 min-w-[200px] transition-all duration-200">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {TASK_FORM.deadlineLabel}
                    </label>
                    <DateTimePicker
                        id="tutorial-deadline-input"
                        value={deadline}
                        onChange={setDeadline}
                        disabled={isTutorialActive}
                        isTutorialActive={isTutorialActive}
                    />
                </div>
            </div>

            {/* 相対見積もり選択 */}
            <div id="tutorial-size-selector" className="transition-all duration-200">
                <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {TASK_FORM.sizeLabel} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        ボリューム感で選択
                    </span>
                </div>
                <SizeLabelSelector 
                    selectedLabel={sizeLabel} 
                    onSelect={setSizeLabel} 
                />
            </div>

            {/* アクションボタン（キャンセル・登録） */}
            <div className="flex items-center justify-end gap-2 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors"
                    >
                        キャンセル
                    </button>
                )}
                <button
                    id="tutorial-submit-button"
                    type="submit"
                    disabled={disabled || !title.trim() || !sizeLabel}
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 flex items-center gap-1.5"
                >
                    <span>＋</span>
                    <span>{TASK_FORM.submitButton}</span>
                </button>
            </div>
        </form>
    )
}

export default TaskForm
