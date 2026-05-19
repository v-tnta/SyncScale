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
  const { tasks, addTask, addTasksBatch, updateTask, deleteTask, completelyDeleteTask, loading, error } = useTasks();
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

  const [pendingImportTasks, setPendingImportTasks] = React.useState(null);

  const { login } = useAuth(); // login関数が必要なため追加（既存はTutorial内で使用）

  // タスクのインポート（重複排除と一括登録）
  const handleImportTasks = async (importedTasks) => {
    if (!importedTasks || importedTasks.length === 0) return;

    const existingIds = new Set(tasks.map(t => t.manabaAssignmentId).filter(Boolean));
    const newTasksData = [];

    for (const task of importedTasks) {
      if (!existingIds.has(task.manabaAssignmentId)) {
        const deadlineDate = task.deadline ? new Date(task.deadline) : null;
        newTasksData.push({
          manabaAssignmentId: task.manabaAssignmentId,
          manabaCourseId: task.manabaCourseId,
          courseName: task.courseName,
          title: task.title,
          type: task.type,
          deadline: deadlineDate,
          estimatedMinutes: 0,
          isNew: true,
          source: 'chrome_ext',
          startedAt: null,
          completedAt: null
        });
      }
    }

    if (newTasksData.length > 0) {
      try {
        await addTasksBatch(newTasksData);
        alert(`${newTasksData.length}件の課題を新規登録しました！（既に登録済みのものはスキップしました）`);
      } catch (e) {
        console.error("課題の一括登録に失敗しました", e);
        alert("課題の登録中にエラーが発生しました。");
      }
    } else {
      alert("新しい課題はありませんでした。（全て登録済みです）");
    }
  };

  // ログイン成功時に保留中のタスクがあれば登録する
  React.useEffect(() => {
    if (isAuthenticated && pendingImportTasks) {
      handleImportTasks(pendingImportTasks);
      setPendingImportTasks(null);
    }
  }, [isAuthenticated, pendingImportTasks]);

  // Chrome拡張機能からのタスクインポートメッセージを受信
  React.useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'SYNC_SCALE_IMPORT_TASKS') {
        const importedTasks = event.data.tasks;
        if (!importedTasks || importedTasks.length === 0) return;

        console.log("Web App: Received tasks from extension", importedTasks);

        if (!isAuthenticated) {
          // 未ログイン時は保留状態にしてモーダルを出す
          setPendingImportTasks(importedTasks);
          return;
        }

        // ログイン済みの場合は即座に登録処理
        await handleImportTasks(importedTasks);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isAuthenticated, tasks, addTasksBatch]);

  return (
    <Layout tasks={isAuthenticated ? tasks : null} onTaskClick={handleTaskClick}>
      {/* ログイン待ちモーダル */}
      {!isAuthenticated && pendingImportTasks && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">課題が見つかりました！</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              課題をSyncScaleに取り込む準備ができました。<br/>Googleでログインして登録を完了しましょう。
            </p>
            <button
              onClick={login}
              className="flex items-center justify-center w-full gap-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Googleでログイン
            </button>
            <button
              onClick={() => setPendingImportTasks(null)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition underline-offset-2 hover:underline"
            >
              今は取り込まない
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <Tutorial />
      ) : (
        <div className="flex flex-col gap-8">
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
