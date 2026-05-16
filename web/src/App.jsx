import React from 'react'
import Layout from './components/Layout'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import Timer from './components/Timer' // Timerコンポーネントを追加
import TaskOverlay from './components/TaskOverlay'
import CompletedTasksModal from './components/CompletedTasksModal'
import ConditionInputModal from './components/ConditionInputModal'
import { useTasks } from './hooks/useTasks'
import { useTimeLogs } from './hooks/useTimeLogs' // ログ取得用に追加
import { useConditionLogs } from './hooks/useConditionLogs' // コンディションログ用に追加
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { currentUser } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, completelyDeleteTask, loading, error } = useTasks();
  const { timeLogs } = useTimeLogs(); // 全体のログを取得
  const { addLog: addConditionLog } = useConditionLogs(); // フックを使用

  // 完了タスク一覧モーダルの状態
  const [isCompletedModalOpen, setIsCompletedModalOpen] = React.useState(false);

  // コンディション入力モーダルの状態（対象タスクを保持）
  const [taskToComplete, setTaskToComplete] = React.useState(null);

  // 表示用タスクと完了タスクの切り分け
  // 未完了のみメインに表示。完了済みはモーダルへ。
  const incompleteTasks = React.useMemo(() => tasks.filter(t => t.status !== 'DONE'), [tasks]);
  const completedTasks = React.useMemo(() => tasks.filter(t => t.status === 'DONE'), [tasks]);

  // モーダル用のステート (TaskOverlay: 詳細/編集)
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // タスクがクリックされた時の処理
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // モーダルを閉じる処理
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // 選択されたタスクに関連するログだけをフィルタリング (TaskOverlay用)
  const selectedTaskLogs = selectedTask
    ? timeLogs.filter(log => log.taskId === selectedTask.id)
    : [];

  // タスク完了のリクエスト（即座にDONEにせず、コンディション入力を開く）
  const handleCompleteRequest = (task) => {
    setTaskToComplete(task);
  };

  // コンディション入力完了時の処理
  const handleConditionSubmit = async ({ condition, memo }) => {
    if (!taskToComplete) return;

    // 先にモーダルを閉じる
    const targetTaskId = taskToComplete.id;
    setTaskToComplete(null);
    
    // TaskOverlayが開いていた場合は閉じる
    if (selectedTask && selectedTask.id === targetTaskId) {
        setIsModalOpen(false);
        setSelectedTask(null);
    }

    // Firestoreの conditionLogs に保存
    try {
        await addConditionLog(targetTaskId, { condition, memo });
    } catch (err) {
        console.error("コンディションの保存に失敗しました", err);
    }
    
    // タスクのステータスをDONEに更新する
    await updateTask(targetTaskId, { status: 'DONE', updatedAt: new Date() });
  };

  return (
    <Layout tasks={currentUser ? tasks : null} onTaskClick={handleTaskClick}>
      {!currentUser ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-red-600 mb-4">認証エラー</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            システムエラーによりユーザー認証に失敗しました。ページをリロードしてください。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* 一時的なデータ移行用ボタン等は以前に案内しましたが、ここでは不要なため省略 */}
          {/* 上部: 新規タスク追加 */}
          <div>
            <TaskForm addTask={addTask} />
          </div>

          {/* 下部: タスク一覧 */}
          <div>
            <TaskList
              tasks={incompleteTasks}
              timeLogs={timeLogs}
              loading={loading}
              error={error}
              onTaskClick={handleTaskClick}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onCompleteRequest={handleCompleteRequest}
              onOpenCompletedModal={() => setIsCompletedModalOpen(true)}
            />
          </div>

          {/* タスク詳細モーダル */}
          <TaskOverlay
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            task={selectedTask}
            logs={selectedTaskLogs}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onPhysicalDelete={completelyDeleteTask}
            onCompleteRequest={handleCompleteRequest}
          />

          {/* 完了タスク一覧モーダル */}
          <CompletedTasksModal
            isOpen={isCompletedModalOpen}
            onClose={() => setIsCompletedModalOpen(false)}
            tasks={completedTasks}
            onTaskClick={handleTaskClick}
          />

          {/* コンディション入力モーダル */}
          <ConditionInputModal
            isOpen={!!taskToComplete}
            onClose={() => setTaskToComplete(null)}
            task={taskToComplete}
            onSubmit={handleConditionSubmit}
          />
        </div>
      )}
    </Layout>
  )
}

export default App
