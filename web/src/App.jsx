import React from 'react'
import Layout from './components/Layout'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import Timer from './components/Timer' // Timerコンポーネントを追加
import TaskOverlay from './components/TaskOverlay'
import CompletedTasksModal from './components/CompletedTasksModal'
import ConditionInputModal from './components/ConditionInputModal'
import TaskSizeEstimateModal from './components/TaskSizeEstimateModal'
import Tutorial from './components/Tutorial'
import PrivacyPolicy from './components/PrivacyPolicy'
import { DebugLogger } from './components/DebugLogger'
import { useTasks } from './hooks/useTasks'
import { useTimeLogs } from './hooks/useTimeLogs' // ログ取得用に追加
import { useConditionLogs } from './hooks/useConditionLogs' // コンディションログ用に追加
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  // パスの末尾のスラッシュを除去して判定（/privacy/ も /privacy もOKにする）
  const normalizedPath = window.location.pathname.replace(/\/$/, '');
  
  if (normalizedPath === '/privacy') {
    return <PrivacyPolicy />;
  }

  const { currentUser } = useAuth();
  const { tasks, addTask, updateTask, deleteTask, completelyDeleteTask, loading, error } = useTasks();
  const { timeLogs } = useTimeLogs(); // 全体のログを取得
  const { addLog: addConditionLog } = useConditionLogs(); // フックを使用

  // Googleログイン済みかどうかの判定
  const isAuthenticated = currentUser && currentUser.isAnonymous === false;

  // 完了タスク一覧モーダルの状態
  const [isCompletedModalOpen, setIsCompletedModalOpen] = React.useState(false);

  // コンディション入力モーダルの状態（対象タスクを保持）
  const [taskToComplete, setTaskToComplete] = React.useState(null);

  // 表示用タスクと完了タスクの切り分け
  // 未完了のみメインに表示。完了済みはモーダルへ。
  const incompleteTasks = React.useMemo(() => tasks.filter(t => t.status !== 'DONE'), [tasks]);
  const completedTasks = React.useMemo(() => tasks.filter(t => t.status === 'DONE'), [tasks]);

  // 新規取得された見積もり待ちのタスクを抽出（1件ずつ表示するため先頭を取得）
  const taskToEstimate = React.useMemo(() => {
    return tasks.find(t => t.isNew === true && !t.sizeLabel) || null;
  }, [tasks]);

  // モーダル用のステート (TaskOverlay: 詳細/編集)
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // タスクがクリックされた時の処理
  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  // モーダルを閉じる処理
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  // 最新のtasks配列から選択中のタスクを取得
  const selectedTask = React.useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // 選択されたタスクに関連するログだけをフィルタリング (TaskOverlay用)
  const selectedTaskLogs = React.useMemo(() => {
    return selectedTask
      ? timeLogs.filter(log => log.taskId === selectedTask.id)
      : [];
  }, [timeLogs, selectedTask]);

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
    if (selectedTaskId === targetTaskId) {
        setIsModalOpen(false);
        setSelectedTaskId(null);
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

  // SML見積もり入力完了時の処理
  const handleEstimateSubmit = async (task, sizeLabel) => {
    await updateTask(task.id, { 
      sizeLabel: sizeLabel, 
      isNew: false, 
      updatedAt: new Date() 
    });
  };

  return (
    <Layout tasks={isAuthenticated ? tasks : null} onTaskClick={handleTaskClick}>
      {!isAuthenticated ? (
        <Tutorial />
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

          {/* 新規タスクのSML見積もりモーダル */}
          <TaskSizeEstimateModal
            isOpen={!!taskToEstimate}
            task={taskToEstimate}
            onSubmit={handleEstimateSubmit}
          />

          <DebugLogger tasks={tasks} taskToEstimate={taskToEstimate} />
        </div>
      )}
    </Layout>
  )
}

export default App
