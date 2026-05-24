import React from 'react'
import Layout from '../components/Layout'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import TaskOverlay from '../components/TaskOverlay'
import CompletedTasksModal from '../components/CompletedTasksModal'
import ConditionInputModal from '../components/ConditionInputModal'
import TaskSizeEstimateModal from '../components/TaskSizeEstimateModal'
import { DebugLogger } from '../components/DebugLogger'
import { useTasks } from '../hooks/useTasks'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { useConditionLogs } from '../hooks/useConditionLogs'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { currentUser } = useAuth();
  const { tasks, addTask, addTasksBatch, updateTask, deleteTask, completelyDeleteTask, loading, error } = useTasks();
  const { timeLogs } = useTimeLogs();
  const { addLog: addConditionLog } = useConditionLogs();

  // tasksの最新状態を保持するRef（useEffectの依存配列を減らすため）
  const tasksRef = React.useRef(tasks);
  React.useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // 完了タスク一覧モーダルの状態
  const [isCompletedModalOpen, setIsCompletedModalOpen] = React.useState(false);

  // 拡張機能からのインポートタスクの一時保持
  const [pendingImportTasks, setPendingImportTasks] = React.useState(null);

  // コンディション入力モーダルの状態（対象タスクを保持）
  const [taskToComplete, setTaskToComplete] = React.useState(null);

  // 表示用タスクと完了タスクの切り分け
  const incompleteTasks = React.useMemo(() => tasks.filter(t => t.status !== 'DONE'), [tasks]);
  const completedTasks = React.useMemo(() => tasks.filter(t => t.status === 'DONE'), [tasks]);

  // 新規取得された見積もり待ちのタスクをすべて抽出
  const allNewTasksToEstimate = React.useMemo(() => {
    return tasks.filter(t => t.isNew === true && !t.sizeLabel);
  }, [tasks]);

  const taskToEstimate = allNewTasksToEstimate.length > 0 ? allNewTasksToEstimate[0] : null;
  const totalNewTasksRef = React.useRef(0);

  // 未評価タスクが0件になったら総数をリセットし、増えたら総数を更新する
  React.useEffect(() => {
    if (allNewTasksToEstimate.length > totalNewTasksRef.current) {
      totalNewTasksRef.current = allNewTasksToEstimate.length;
    } else if (allNewTasksToEstimate.length === 0) {
      totalNewTasksRef.current = 0;
    }
  }, [allNewTasksToEstimate.length]);

  const estimateCurrentIndex = taskToEstimate ? (totalNewTasksRef.current - allNewTasksToEstimate.length + 1) : 0;
  const estimateTotalCount = totalNewTasksRef.current;
  
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

  // タスク完了のリクエスト
  const handleCompleteRequest = (task) => {
    setTaskToComplete(task);
  };

  // コンディション入力完了時の処理
  const handleConditionSubmit = async ({ condition, memo }) => {
    if (!taskToComplete) return;

    const targetTaskId = taskToComplete.id;
    setTaskToComplete(null);
    
    if (selectedTaskId === targetTaskId) {
        setIsModalOpen(false);
        setSelectedTaskId(null);
    }

    try {
        await addConditionLog(targetTaskId, { condition, memo });
    } catch (err) {
        console.error("コンディションの保存に失敗しました", err);
    }
    
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

  // タスクのインポート
  const handleImportTasks = async (importedTasks) => {
    if (!importedTasks || importedTasks.length === 0) return;

    const existingIds = new Set(tasksRef.current.map(t => t.manabaAssignmentId).filter(Boolean));
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

  // 1. セッションストレージからの保留中のインポート復元
  React.useEffect(() => {
    const pending = sessionStorage.getItem("pendingImportTasks");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed && parsed.length > 0) {
          setPendingImportTasks(parsed);
        }
      } catch (e) {
        console.error("sessionStorageからのインポートタスク復元に失敗しました", e);
      } finally {
        sessionStorage.removeItem("pendingImportTasks");
      }
    }
  }, []);

  // 2. 起動中のリアルタイム postMessage 受信
  React.useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'SYNC_SCALE_IMPORT_TASKS') {
        const importedTasks = event.data.tasks;
        if (!importedTasks || importedTasks.length === 0) return;

        console.log("Web App (HomePage): Received tasks from extension", importedTasks);
        window.postMessage({ type: 'SYNC_SCALE_IMPORT_ACK' }, '*');
        setPendingImportTasks(importedTasks);
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'SYNC_SCALE_APP_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 3. データのロード完了時に保留中のインポートを実行する
  React.useEffect(() => {
    if (!loading && pendingImportTasks) {
      handleImportTasks(pendingImportTasks);
      setPendingImportTasks(null);
    }
  }, [loading, pendingImportTasks]);

  return (
    <Layout tasks={tasks} onTaskClick={handleTaskClick}>
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
          currentIndex={estimateCurrentIndex}
          totalCount={estimateTotalCount}
          onSubmit={handleEstimateSubmit}
        />

        <DebugLogger tasks={tasks} taskToEstimate={taskToEstimate} />
      </div>
    </Layout>
  )
}
