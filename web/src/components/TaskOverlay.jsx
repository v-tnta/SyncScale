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
    const [isChartExpanded, setIsChartExpanded] = useState(true); // 実績チャートの開閉状態

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

    const getBadgeColor = (label) => {
        switch (label) {
            case 'S': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
            case 'M': return 'bg-orange-50 text-orange-700 border border-orange-100';
            case 'L': return 'bg-red-50 text-red-700 border border-red-100';
            default: return 'bg-gray-100 text-gray-500';
        }
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
                    <div className="flex-1 mr-4 w-full">
                        <div className="flex flex-col gap-4 w-full">
                            {/* Row 1: タイトル + アクションアイコン */}
                            <div className="flex items-start justify-between w-full">
                                {/* タイトル部分 */}
                                <div className="flex-1 pr-6">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full text-3xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-blue-50/50 px-2 py-1 rounded-t-sm"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder="タスク名"
                                            autoFocus
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bold text-gray-800 break-words leading-tight">
                                            {task.title}
                                        </h2>
                                    )}
                                </div>

                                {/* アクションアイコンエリア（右上） */}
                                <div className="flex items-center gap-6 shrink-0">
                                    {isEditing ? (
                                        <>
                                            {/* 編集モード: キャンセル + 保存 */}
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                    title="キャンセル"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">キャンセル</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={handleSave}
                                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition shadow-sm"
                                                    title="保存"
                                                >
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <span className="text-xs font-bold text-blue-700">保存</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* 閲覧モード: 編集 + 削除 + 提出完了 */}
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                    title="編集"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">編集</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={handlePhysicalDelete}
                                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                    title="削除"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] font-bold text-gray-500">削除</span>
                                            </div>
                                            {task.status !== 'DONE' && (
                                                <div className="flex flex-col items-center gap-1 ml-2">
                                                    <button
                                                        onClick={handleComplete}
                                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
                                                        title="提出完了"
                                                    >
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs font-bold text-gray-800">提出完了</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: 〆切 + SML・ステータスバッジ */}
                            <div className="flex items-center justify-between w-full">
                                {/* 左: 〆切 */}
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-600">〆切:</span>
                                    {isEditing ? (
                                        <div className="w-[200px]">
                                            <DateTimePicker
                                                value={editForm.deadline}
                                                onChange={(date) => setEditForm({ ...editForm, deadline: date })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-lg font-bold text-gray-800">{formatDate(task.deadline)}</span>
                                    )}
                                </div>
                                {/* 右: SML + ステータスバッジ（アイコンと同じ縦位置） */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {isEditing ? (
                                        <div className="w-48">
                                            <SizeLabelSelector
                                                selectedLabel={editForm.sizeLabel}
                                                onSelect={(label) => setEditForm({ ...editForm, sizeLabel: label })}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {task.sizeLabel && (
                                                <span className={`px-2 py-0.5 text-lg font-bold rounded ${getBadgeColor(task.sizeLabel)}`}>
                                                    {task.sizeLabel}
                                                </span>
                                            )}
                                            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-md ${task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                                task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {task.status || 'TODO'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timer Component */}
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <Timer activeTask={task} onUpdateTask={onUpdate} logs={logs} />
                        </div>
                    </div>

                    {/* 閉じるボタン */}
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
                    {/* 実績チャート */}
                    <section className="mt-8 border-t border-gray-200 pt-4">
                        <button
                            onClick={() => setIsChartExpanded(!isChartExpanded)}
                            className="w-full flex items-center justify-between text-left"
                        >
                            <h3 className="text-xl font-bold text-gray-800">
                                実績チャート
                            </h3>
                            <div className={`transform transition-transform text-gray-400 ${isChartExpanded ? 'rotate-180' : ''}`}>
                                ▼
                            </div>
                        </button>
                        
                        {isChartExpanded && (
                            <div className="mt-4 bg-gray-50 p-4 border border-gray-200 shadow-inner rounded-lg">
                                <GanttChart logs={logs} taskSize={task.sizeLabel} />
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default TaskOverlay
