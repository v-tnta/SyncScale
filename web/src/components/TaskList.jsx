import { TASK_STATUS_LABELS } from '../domain/task';

/**
 * タスク一覧コンポーネント
 * 親コンポーネント(App)から受け取った tasks データをもとにリストを表示します。
 * スクロール機能、ローディング表示、エラー表示を含みます。
 */
const TaskList = ({ tasks, timeLogs, loading, error, onTaskClick, onUpdateTask, onDeleteTask, onCompleteRequest, onOpenCompletedModal, isTutorialActive }) => {
    // サイズに応じたアクセントカラーを取得
    const getSizeColor = (label) => {
        if (!label) return 'border-l-gray-300 bg-gray-50';
        const upperLabel = label.toUpperCase();
        switch (upperLabel) {
            case 'S': return 'border-l-cyan-400';
            case 'M': return 'border-l-orange-400';
            case 'L': return 'border-l-red-500';
            default: return 'border-l-gray-300 bg-gray-50'; // 未定時はグレー
        }
    };

    const getBadgeColor = (label) => {
        if (!label) return 'bg-gray-100 text-gray-500';
        const upperLabel = label.toUpperCase();
        switch (upperLabel) {
            case 'S': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
            case 'M': return 'bg-orange-50 text-orange-700 border border-orange-100';
            case 'L': return 'bg-red-50 text-red-700 border border-red-100';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-500">読み込み中...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">エラーが発生しました。設定を確認してください。</div>;
    }

    // 締切ステータス判定
    const getDeadlineStatus = (val) => {
        if (!val) return 'none';
        let dateObj;
        if (typeof val === 'string') dateObj = new Date(val);
        else if (val instanceof Date) dateObj = val;
        else if (val.seconds) dateObj = new Date(val.seconds * 1000);
        else return 'none';

        if (isNaN(dateObj.getTime())) return 'none';

        const now = new Date();
        const diffMs = dateObj - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return 'expired'; // 期限切れ
        if (diffHours <= 24) return 'urgent'; // 24時間以内
        return 'normal';
    };

    // 日時フォーマット関数 (String, Date, Timestamp対応)
    const formatDate = (val) => {
        if (!val) return '未設定';
        let dateObj;
        if (typeof val === 'string') {
            dateObj = new Date(val);
        } else if (val instanceof Date) {
            dateObj = val;
        } else if (val.seconds) {
            dateObj = new Date(val.seconds * 1000);
        } else {
            return '未設定';
        }
        
        if (isNaN(dateObj.getTime())) return '未設定';
        
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        const h = dateObj.getHours().toString().padStart(2, '0');
        const min = dateObj.getMinutes().toString().padStart(2, '0');
        return `${y}/${m}/${d} ${h}:${min}`;
    };

    // ハンドラ: 完了ボタン
    const handleComplete = (e, task) => {
        e.stopPropagation(); // 行クリックイベントの伝播を止める
        onCompleteRequest(task);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>📋</span> タスク一覧
                </h2>
                <button
                    id="tutorial-completed-list-button"
                    onClick={onOpenCompletedModal}
                    className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition font-medium border border-gray-200 shadow-sm"
                >
                    <span>🏆</span> 完了したタスクの一覧
                </button>
            </div>

            {/* タスクリスト表示エリア: 高さ制限とスクロールを追加 */}
            <div className="space-y-3 max-h-[270px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">タスクはまだありません。</p>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            id={task.title.includes("線形代数") ? "tutorial-target-task" : undefined}
                            onClick={() => onTaskClick(task)}
                            className={`cursor-pointer hover:shadow-md transition p-4 border border-l-8 rounded-lg flex justify-between items-center bg-white ${getSizeColor(task.sizeLabel)}`}
                        >
                                <div>
                                    <h3 className="font-medium flex items-center gap-2 text-gray-800">
                                        {task.title}
                                    </h3>
                                    <div className="text-sm mt-1 flex gap-4">
                                        <span className={`font-medium ${
                                            getDeadlineStatus(task.deadline) === 'expired' ? 'text-gray-400 line-through' :
                                            getDeadlineStatus(task.deadline) === 'urgent' ? 'text-red-600 animate-pulse' : 
                                            'text-gray-500'
                                        }`}>
                                            📅 締切: {formatDate(task.deadline)}
                                        </span>
                                    </div>
                                </div>

                                {/* ステータス・操作エリア */}
                                <div className="flex items-center gap-4">
                                    {task.sizeLabel && (
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${getBadgeColor(task.sizeLabel)}`}>
                                            {task.sizeLabel}
                                        </span>
                                    )}

                                    {/* 操作ボタン */}
                                    <div className="flex items-center gap-1">
                                        {task.status !== 'DONE' && (
                                            <button
                                                onClick={(e) => handleComplete(e, task)}
                                                disabled={isTutorialActive}
                                                className="p-1 text-gray-400 hover:text-green-600 disabled:text-gray-200 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-full hover:bg-green-50 transition"
                                                title={isTutorialActive ? "チュートリアル中は詳細画面から完了してください" : "完了にする"}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'TODO' ? 'bg-gray-200 text-gray-700' :
                                        task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {TASK_STATUS_LABELS[task.status] || task.status}
                                    </span>
                                </div>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    )
}

export default TaskList
