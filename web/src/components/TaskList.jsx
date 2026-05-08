/**
 * タスク一覧コンポーネント
 * 親コンポーネント(App)から受け取った tasks データをもとにリストを表示します。
 * スクロール機能、ローディング表示、エラー表示を含みます。
 */
const TaskList = ({ tasks, timeLogs, loading, error, onTaskClick, onUpdateTask, onDeleteTask, showHidden, onToggleHidden }) => {
    if (loading) {
        return <div className="text-center p-8 text-gray-500">読み込み中...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">エラーが発生しました。設定を確認してください。</div>;
    }

    // 時間フォーマット関数 (String, Date, Timestamp対応)
    const formatDate = (val) => {
        if (!val) return '未設定';
        if (typeof val === 'string') return val;
        if (val instanceof Date) return val.toLocaleDateString();
        if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
        return val;
    };

    // 時間負債の計算ヘルパー
    const getTimeDebt = (task) => {
        // このタスクに関連するログのみ抽出
        const taskLogs = timeLogs?.filter(log => log.taskId === task.id) || [];
        const totalSeconds = taskLogs.reduce((sum, log) => sum + log.durationSeconds, 0);
        const totalMinutes = Math.floor(totalSeconds / 60);

        const diff = totalMinutes - task.estimatedMinutes;
        return diff;
    };

    // ハンドラ: 完了ボタン
    const handleComplete = (e, task) => {
        e.stopPropagation(); // 行クリックイベントの伝播を止める
        if (window.confirm(`タスク「${task.title}」を完了しますか？`)) {
            onUpdateTask(task.id, { status: 'DONE' });
        }
    };

    // ハンドラ: 非表示ボタン
    const handleDelete = (e, task) => {
        e.stopPropagation();
        onDeleteTask(task.id);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">タスク一覧 </h2>
                <label className="flex items-center cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    <input
                        type="checkbox"
                        checked={!showHidden}
                        onChange={onToggleHidden}
                        className="mr-2 cursor-pointer"
                    />
                <h6 className="text-xs items-center text-gray-500">完了タスク 非表示 </h6>
                </label>
            </div>

            {/* タスクリスト表示エリア: 高さ制限とスクロールを追加 */}
            <div className="space-y-3 max-h-[270px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">タスクはまだありません。</p>
                ) : (
                    tasks.map((task) => {
                        const debt = getTimeDebt(task);
                        return (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={`cursor-pointer hover:shadow-md transition p-4 border rounded-lg flex justify-between items-center ${!task.isVisible ? 'bg-gray-200 opacity-60' :
                                    task.status === 'DONE' ? 'bg-gray-100 opacity-80' : 'bg-white'
                                    }`}
                            >
                                <div>
                                    <h3 className={`font-medium ${task.status === 'DONE' ? 'text-gray-500' : 'text-gray-800'}`}>
                                        {task.title}
                                        {!task.isVisible && <span className="text-xs ml-2 text-red-500">(非表示)</span>}
                                    </h3>
                                    <div className="text-sm text-gray-500 mt-1 flex gap-4">
                                        <span>⏳ 見積: {task.estimatedMinutes}分</span>
                                        <span>📅 締切: {formatDate(task.deadline)}</span>
                                    </div>
                                </div>

                                {/* ステータス・操作エリア */}
                                <div className="flex items-center gap-4">

                                    {/* DOINGの場合のみ時間負債を表示 */}
                                    {task.status === 'DOING' && (
                                        <span className={`text-sm font-bold w-12 text-right ${debt > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {debt > 0 ? `+${debt}` : debt}分
                                        </span>
                                    )}


                                    {/* 操作ボタン */}
                                    <div className="flex items-center gap-1">
                                        {task.status !== 'DONE' ? (
                                            <button
                                                onClick={(e) => handleComplete(e, task)}
                                                className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition"
                                                title="完了にする"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        ) : (
                                            task.isVisible !== false ? (
                                                <button
                                                    onClick={(e) => handleDelete(e, task)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
                                                    title="リストから非表示"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handlePhysicalDelete(e, task)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                                                    title="物理削除"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )
                                        )}
                                    </div>



                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'TODO' ? 'bg-gray-200 text-gray-700' :
                                        task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default TaskList
