import React from 'react'
import Layout from '../components/Layout'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import TaskOverlay from '../components/TaskOverlay'
import CompletedTasksModal from '../components/CompletedTasksModal'
import ConditionInputModal from '../components/ConditionInputModal'
import TaskSizeEstimateModal from '../components/TaskSizeEstimateModal'
import DynamicTutorialGuide from '../components/DynamicTutorialGuide'
import MobileAppPromoModal from '../components/MobileAppPromoModal'
import { DebugLogger } from '../components/DebugLogger'
import { useTasks } from '../hooks/useTasks'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { useConditionLogs } from '../hooks/useConditionLogs'
import { useAuth } from '../hooks/useAuth'
import { useOnboarding } from '../hooks/useOnboarding'
import ExtensionGuideModal from '../components/ExtensionGuideModal'

export function HomePage() {
  const { currentUser } = useAuth();
  const { onboarding, completeStep, dismissMobilePromo, viewExtensionGuide } = useOnboarding();
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

  // チュートリアルの現在のステップ
  const [tutorialStep, setTutorialStep] = React.useState(1);

  // 動的チュートリアルがアクティブか判定
  const isTutorialActive = React.useMemo(() => {
    return onboarding && onboarding.step3 && !onboarding.step4;
  }, [onboarding]);

  // 拡張機能からのインポートタスクの一時保持
  const [pendingImportTasks, setPendingImportTasks] = React.useState(null);

  // コンディション入力モーダルの状態（対象タスクを保持）
  const [taskToComplete, setTaskToComplete] = React.useState(null);

  // チュートリアル終了時のトランジション状態
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // 表示用タスクと完了タスクの切り分け（チュートリアル中かどうかに応じて動的フィルタリング）
  const incompleteTasks = React.useMemo(() => {
    if (isTutorialActive) {
      return tasks.filter(t => t.status !== 'DONE' && t.isTutorialTask === true);
    } else {
      return tasks.filter(t => t.status !== 'DONE' && t.isTutorialTask !== true);
    }
  }, [tasks, isTutorialActive]);

  const completedTasks = React.useMemo(() => {
    if (isTutorialActive) {
      return tasks.filter(t => t.status === 'DONE' && t.isTutorialTask === true);
    } else {
      return tasks.filter(t => t.status === 'DONE' && t.isTutorialTask !== true);
    }
  }, [tasks, isTutorialActive]);

  // カレンダー等の表示用タスクのフィルタリング
  const filteredTasks = React.useMemo(() => {
    if (isTutorialActive) {
      return tasks.filter(t => t.isTutorialTask === true);
    } else {
      return tasks.filter(t => t.isTutorialTask !== true);
    }
  }, [tasks, isTutorialActive]);

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

  // Chrome拡張機能使い方ガイドモーダルの状態
  const [isExtensionGuideOpen, setIsExtensionGuideOpen] = React.useState(false);

  // オンボーディング完了かつ拡張機能ガイド未読の場合に自動表示する
  React.useEffect(() => {
    if (onboarding && onboarding.completed && !onboarding.extensionGuideViewed) {
      setIsExtensionGuideOpen(true);
    }
  }, [onboarding]);

  // チュートリアル開始時のクリーンアップ実行フラグと自動一掃処理
  const hasCleanedUpRef = React.useRef(false);
  React.useEffect(() => {
    if (!isTutorialActive) {
      hasCleanedUpRef.current = false;
    }
  }, [isTutorialActive]);

  React.useEffect(() => {
    if (loading) return; // データの初期ロード完了を待つ

    if (isTutorialActive && !hasCleanedUpRef.current) {
      hasCleanedUpRef.current = true; // タスクの有無に関わらず、チェックしたためフラグをtrueにする
      const tutorialTasks = tasks.filter(t => t.isTutorialTask === true);
      if (tutorialTasks.length > 0) {
        console.log("過去のチュートリアル用タスクを自動一掃します:", tutorialTasks);
        tutorialTasks.forEach(async (t) => {
          try {
            await completelyDeleteTask(t.id);
          } catch (e) {
            console.error("チュートリアルタスクのクリーンアップに失敗しました:", e);
          }
        });
      }
    }
  }, [isTutorialActive, tasks, loading, completelyDeleteTask]);

  // モバイルアプリプロモを表示するか判定
  const isMobilePromoOpen = React.useMemo(() => {
    if (!onboarding || !onboarding.completed) return false;
    if (onboarding.mobileInstalled) return false;
    if (isExtensionGuideOpen) return false; // 拡張機能ガイド表示中は非表示
    if (isTutorialActive) return false; // チュートリアル中は非表示

    if (onboarding.mobilePromoDismissedAt) {
      let dismissedTime;
      const dismissed = onboarding.mobilePromoDismissedAt;
      
      if (dismissed && typeof dismissed.toDate === 'function') {
        dismissedTime = dismissed.toDate();
      } else if (dismissed && dismissed.seconds) {
        dismissedTime = new Date(dismissed.seconds * 1000);
      } else {
        dismissedTime = new Date(dismissed);
      }
      
      if (isNaN(dismissedTime.getTime())) {
        return true; // パースに失敗した場合は表示する
      }
      
      const now = new Date();
      const diffMs = now - dismissedTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) { // 24時間以内なら非表示
        return false;
      }
    }
    return true;
  }, [onboarding, isExtensionGuideOpen, isTutorialActive]);

  const handleTutorialComplete = async (tutorialTaskId) => {
    try {
      setIsTransitioning(true);
      if (tutorialTaskId) {
        await completelyDeleteTask(tutorialTaskId);
      }
      await completeStep(4);
      window.location.reload();
    } catch (e) {
      console.error("チュートリアル完了処理に失敗しました", e);
      setIsTransitioning(false);
    }
  };

  // タスク登録時にチュートリアル用フラグを付与するラッパー関数
  const handleAddTask = async (taskData) => {
    await addTask({
      ...taskData,
      isTutorialTask: isTutorialActive ? true : false
    });
  };

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

    // タスクが TODO から直接 DONE になる可能性を考慮し、startedAt が null なら設定する
    const startedAt = taskToComplete.startedAt || new Date();

    await updateTask(targetTaskId, {
      status: 'DONE',
      startedAt: startedAt,
      completedAt: new Date(),
      updatedAt: new Date()
    });
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
        const rawDate = task.deadline ? new Date(task.deadline) : null;
        const deadlineDate = (rawDate && !isNaN(rawDate.getTime())) ? rawDate : null;
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
        alert(`${newTasksData.length}件の課題を新規登録しました！`);
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
        // インポートデータをセッションストレージに保存し、/svc/ext-sync に遷移させる
        sessionStorage.setItem("pendingImportTasks", JSON.stringify(importedTasks));
        window.postMessage({ type: 'SYNC_SCALE_IMPORT_ACK' }, '*');
        // /svc/ext-sync にリダイレクト
        window.location.href = "/svc/ext-sync";
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
    <Layout tasks={filteredTasks} onTaskClick={handleTaskClick}>
      <div className="flex flex-col gap-8">
        {/* 上部: 新規タスク追加 */}
        <div>
          <TaskForm addTask={handleAddTask} disabled={isTutorialActive && tutorialStep < 4} isTutorialActive={isTutorialActive} />
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
            isTutorialActive={isTutorialActive}
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
          isTutorialActive={isTutorialActive}
          tutorialStep={tutorialStep}
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
          isTutorialActive={isTutorialActive}
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

      {/* 動的チュートリアルガイド */}
      {isTutorialActive && (
        <DynamicTutorialGuide
          tasks={tasks}
          timeLogs={timeLogs}
          selectedTask={selectedTask}
          isCompletedModalOpen={isCompletedModalOpen}
          taskToComplete={taskToComplete}
          onComplete={handleTutorialComplete}
          step={tutorialStep}
          setStep={setTutorialStep}
        />
      )}

      {/* モバイルアプリ案内プロモ */}
      <MobileAppPromoModal
        isOpen={isMobilePromoOpen}
        onClose={dismissMobilePromo}
      />

      {/* Chrome拡張機能解説モーダル */}
      <ExtensionGuideModal
        isOpen={isExtensionGuideOpen}
        onClose={async () => {
          setIsExtensionGuideOpen(false);
          if (onboarding && onboarding.completed && !onboarding.extensionGuideViewed) {
            try {
              await viewExtensionGuide();
            } catch (err) {
              console.error("拡張機能ガイドの既読状態の更新に失敗しました:", err);
            }
          }
        }}
      />

      {isTransitioning && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-700">サービスに戻ります...</p>
        </div>
      )}
    </Layout>
  )
}
