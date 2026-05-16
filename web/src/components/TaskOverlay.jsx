import React, { useState, useEffect } from 'react'
import GanttChart from './GanttChart'
import Timer from './Timer'
import SizeLabelSelector from './SizeLabelSelector'
import DateTimePicker from './DateTimePicker'

/**
 * TaskOverlay コンポーネント
 * タスクの詳細（分析とガントチャート）を表示するオーバーレイです。
 * タスクの編集・完了・物理削除機能も含みます。
 */
const TaskOverlay = ({ isOpen, onClose, task, logs, onUpdate, onDelete, onPhysicalDelete, onCompleteRequest }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', deadline: null, sizeLabel: 'M' });

    // モーダルが開くたび、またはタスクが変わるたびにフォームを初期化
    useEffect(() => {
        if (task) {
            // 締切日の形式変換 (Dateオブジェクトへ)
            let formattedDeadline = null;
            if (task.deadline) {
                if (task.deadline.seconds) {
                    // Timestamp
                    formattedDeadline = new Date(task.deadline.seconds * 1000);
                } else if (task.deadline instanceof Date) {
                    // Date Object
                    formattedDeadline = task.deadline;
                } else {
                    // String ("YYYY-MM-DD" etc) or other
                    formattedDeadline = new Date(task.deadline);
                }
            }

            setEditForm({
                title: task.title,
                deadline: formattedDeadline,
                sizeLabel: task.sizeLabel || 'M'
            });
            setIsEditing(false); // モーダルを開いたときは閲覧モード
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = async () => {
        if (!editForm.title.trim()) return alert("タイトルは必須です");

        // 更新処理
        await onUpdate(task.id, {
            title: editForm.title,
            sizeLabel: editForm.sizeLabel,
            // Dateオブジェクトとして保存（FirestoreでTimestampになる）
            deadline: editForm.deadline
        });
        setIsEditing(false);
    };

    // タスク完了 (ステータス更新)
    const handleComplete = async () => {
        onCompleteRequest(task);
    };

    // 物理削除
    const handlePhysicalDelete = async () => {
        const confirmMessage = `タスク「${task.title}」を完全に削除しますか？\n\n※この操作は取り消せません。\n※関連する作業ログも全て削除されます。`;
        if (window.confirm(confirmMessage)) {
            await onPhysicalDelete(task.id);
            onClose();
        }
    };

    // 表示用の日付フォーマット関数
    const formatDate = (dateVal) => {
        if (!dateVal) return '未設定';
        let d = dateVal;
        if (dateVal.seconds) {
            d = new Date(dateVal.seconds * 1000);
        } else if (!(dateVal instanceof Date)) {
            d = new Date(dateVal);
        }
        if (isNaN(d.getTime())) return '未設定';
        
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${year}年${month}月${day}日 ${hour}:${min}`;
    };

    return (
        // 背景 (Backdrop)
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            {/* モーダル本体 */}
            <div
                className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl m-4 p-6 relative animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダーエリア */}
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            // --- 編集モード ---
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full text-2xl font-bold border-b-2 border-blue-500 focus:outline-none p-1"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="タスク名"
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1 min-w-[150px]">
                                        <span className="text-sm text-gray-500 mb-1 block">締切日時:</span>
                                        <DateTimePicker
                                            value={editForm.deadline}
                                            onChange={(date) => setEditForm({ ...editForm, deadline: date })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">規模感:</span>
                                    <SizeLabelSelector
                                        selectedLabel={editForm.sizeLabel}
                                        onSelect={(label) => setEditForm({ ...editForm, sizeLabel: label })}
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- 閲覧モード ---
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                        task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {task.status || 'TODO'}
                                    </span>
                                    {/* 編集アイコン */}
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-gray-400 hover:text-blue-600 p-1"
                                        title="編集"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>

                                    {/* ステータスがDoneでない場合: 完了ボタン (Check) */}
                                    {task.status !== 'DONE' && (
                                        <button
                                            onClick={handleComplete}
                                            className="text-gray-400 hover:text-green-600 p-1"
                                            title="完了にする"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* 物理削除ボタン (Trash) */}
                                    <button
                                        onClick={handlePhysicalDelete}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="完全に削除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    {task.title}
                                    {task.sizeLabel && (
                                        <span className="px-2 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-700">
                                            {task.sizeLabel}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    締切: {formatDate(task.deadline)}
                                </p>

                                {/* Timer Component Embedded Here */}
                                <div className="mt-4 border-t border-gray-100 pt-3">
                                    <Timer activeTask={task} onUpdateTask={onUpdate} logs={logs} />
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* コンテンツエリア */}
                <div className="space-y-8">
                    {/* 実績ガントチャート */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span>📈</span> 実績チャート
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <GanttChart logs={logs} taskSize={task.sizeLabel} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default TaskOverlay
